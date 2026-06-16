import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/admin";
import { processInfluencerCommission, reverseInfluencerCommission } from "@/lib/influencer/process-commission";
import { processReferralCommission } from "@/lib/referral/process-commission";
import { processDonationPaid } from "@/lib/donations/process-paid";
import { processPurchasePaid } from "@/lib/shop/process-paid";

const VITAE_MULTIPLIER: Record<string, number> = {
  essentiel: 1,
  infini: 5,
  legende: 10,
};

const PRIME_AMOUNTS: Record<"j1" | "j30" | "j60", number> = {
  j1: 2500,
  j30: 2500,
  j60: 5000,
};

const RETRACTION_DAYS = 30;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface SubscriptionMetadata {
  user_id?: string;
  app_slug?: string;
  influencer_link_id?: string;
  referral_code?: string;
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  admin: ReturnType<typeof createServiceClient>
) {
  const invoiceWithSub = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
  const subId =
    typeof invoiceWithSub.subscription === "string"
      ? invoiceWithSub.subscription
      : invoiceWithSub.subscription?.id ?? null;
  if (!subId) return;

  const sub = await stripe.subscriptions.retrieve(subId);
  const meta = (sub.metadata ?? {}) as SubscriptionMetadata;
  const userId = meta.user_id;
  const amountCents = invoice.amount_paid ?? 0;

  if (!userId || amountCents <= 0) return;

  // 1. Primes J30 / J60 based on invoice sequence
  const invoiceLine = (invoice as unknown as { billing_reason?: string }).billing_reason;
  if (invoiceLine === "subscription_cycle") {
    // Count previous invoices to determine J30 vs J60
    const { data: primeJ30 } = await admin.from("primes").select("id").eq("user_id", userId).eq("type", "j30").maybeSingle();
    const { data: primeJ60 } = await admin.from("primes").select("id").eq("user_id", userId).eq("type", "j60").maybeSingle();

    if (!primeJ30) {
      await admin.from("primes").insert({
        user_id: userId,
        type: "j30",
        amount_cents: PRIME_AMOUNTS.j30,
        status: "available",
      });
    } else if (!primeJ60) {
      await admin.from("primes").insert({
        user_id: userId,
        type: "j60",
        amount_cents: PRIME_AMOUNTS.j60,
        status: "available",
      });
    }
  }

  // 2. Unlock J1 prime if retraction period has passed
  const { data: j1Prime } = await admin
    .from("primes")
    .select("id, retraction_deadline")
    .eq("user_id", userId)
    .eq("type", "j1")
    .eq("status", "locked")
    .maybeSingle();
  if (j1Prime?.retraction_deadline && new Date(j1Prime.retraction_deadline) < new Date()) {
    await admin.from("primes").update({ status: "available" }).eq("id", j1Prime.id);
  }

  // 3. Influencer commission
  if (meta.influencer_link_id) {
    const linkRes = await admin
      .from("influencer_links")
      .select("id")
      .eq("id", meta.influencer_link_id)
      .maybeSingle();
    if (linkRes.data) {
      const r = await processInfluencerCommission({
        admin,
        linkId: meta.influencer_link_id,
        referredUserId: userId,
        amountCents,
        stripeInvoiceId: invoice.id ?? "",
      });
      if (!r.inserted && r.reason && r.reason !== "already_logged") {
        console.warn("[KAIA webhook] influencer commission skip:", r.reason);
      }
    }
  }

  // 4. Referral commission (parrainage particulier)
  if (meta.referral_code) {
    const { data: existing } = await admin
      .from("referrals")
      .select("first_payment_at")
      .eq("referred_user_id", userId)
      .maybeSingle();
    const isFirst = !existing?.first_payment_at;

    const r = await processReferralCommission({
      admin,
      referrerCode: meta.referral_code,
      referredUserId: userId,
      amountCents,
      source: isFirst ? "subscription_first" : "subscription_recurring",
      stripeInvoiceId: invoice.id ?? "",
    });
    if (!r.inserted && r.reason && r.reason !== "already_logged") {
      console.warn("[KAIA webhook] referral commission skip:", r.reason);
    }
  }
}

async function handleChargeRefunded(
  charge: Stripe.Charge,
  admin: ReturnType<typeof createServiceClient>
) {
  const invoiceId = typeof charge.invoice === "string" ? charge.invoice : charge.invoice?.id ?? null;
  if (!invoiceId) return;

  const refundedCents = charge.amount_refunded ?? 0;
  if (refundedCents <= 0) return;

  // Marque les commissions associées en 'reversed'
  await reverseInfluencerCommission(admin, invoiceId, refundedCents);
  await admin
    .from("referral_commissions")
    .update({ status: "reversed" })
    .eq("stripe_invoice_id", invoiceId)
    .eq("status", "pending")
    .then(() => undefined, () => undefined);
}

async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
  admin: ReturnType<typeof createServiceClient>
) {
  const meta = (sub.metadata ?? {}) as SubscriptionMetadata;
  const userId = meta.user_id;
  if (!userId) return;

  // Marque le referral comme expired
  if (meta.referral_code) {
    await admin
      .from("referrals")
      .update({ status: "expired" })
      .eq("referred_user_id", userId);
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook signature manquante." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature invalide.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata ?? {};

        // Donation Stripe one-shot
        if (meta.kaia_donation_id) {
          const r = await processDonationPaid({ admin: supabase, session });
          if (!r.processed && r.reason && r.reason !== "already_succeeded") {
            console.warn("[KAIA webhook] donation skip:", r.reason);
          }
          break;
        }

        // Achat boutique
        if (meta.kaia_purchase_id) {
          const r = await processPurchasePaid({ admin: supabase, session });
          if (!r.processed && r.reason && r.reason !== "already_paid") {
            console.warn("[KAIA webhook] purchase skip:", r.reason);
          }
          break;
        }

        // Subscription VITAE
        const userId = (session.client_reference_id ?? meta.user_id) as string | null;
        const planKey = meta.plan_key as string | null;
        if (userId && session.mode === "subscription") {
          const multiplier = planKey ? (VITAE_MULTIPLIER[planKey] ?? 1) : 1;
          await supabase
            .from("profiles")
            .update({
              vitae_plan: planKey ?? null,
              vitae_multiplier: multiplier,
              stripe_subscription_id: (session.subscription as string) ?? null,
            })
            .eq("id", userId);

          // Prime J1 = 25€ with 30-day retraction lock
          const retractionDeadline = new Date();
          retractionDeadline.setDate(retractionDeadline.getDate() + RETRACTION_DAYS);
          const { data: existingJ1 } = await supabase
            .from("primes")
            .select("id")
            .eq("user_id", userId)
            .eq("type", "j1")
            .maybeSingle();
          if (!existingJ1) {
            await supabase.from("primes").insert({
              user_id: userId,
              type: "j1",
              amount_cents: PRIME_AMOUNTS.j1,
              status: "locked",
              retraction_deadline: retractionDeadline.toISOString(),
            });
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        const planKey = sub.metadata?.plan_key ?? null;
        const status = sub.status;
        if (userId) {
          const multiplier = planKey ? (VITAE_MULTIPLIER[planKey] ?? 1) : 1;
          await supabase
            .from("profiles")
            .update({
              vitae_plan: ["active", "trialing"].includes(status) ? planKey : null,
              vitae_multiplier: ["active", "trialing"].includes(status) ? multiplier : 1,
              stripe_subscription_id: sub.id,
            })
            .eq("id", userId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (userId) {
          await supabase
            .from("profiles")
            .update({ vitae_plan: null, vitae_multiplier: 1, stripe_subscription_id: null })
            .eq("id", userId);
          // Reverse pending primes if still in retraction window
          await supabase
            .from("primes")
            .update({ status: "reversed" })
            .eq("user_id", userId)
            .eq("status", "locked");
        }
        await handleSubscriptionDeleted(sub, supabase);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice, supabase);
        break;
      }
      case "invoice.payment_failed": {
        // Hook for dunning / email retry in P8.
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge, supabase);
        break;
      }
      default: {
        // Other events ignored
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook]", event.type, err);
    return NextResponse.json({ error: "Erreur de traitement." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
