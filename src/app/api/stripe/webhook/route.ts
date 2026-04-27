import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/admin";
import { processInfluencerCommission, reverseInfluencerCommission } from "@/lib/influencer/process-commission";
import { processReferralCommission } from "@/lib/referral/process-commission";

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

  // 1. Influencer commission
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

  // 2. Referral commission (parrainage particulier)
  if (meta.referral_code) {
    // Source = first si pas encore de referrals.first_payment_at, sinon recurring
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
        const userId = (session.client_reference_id ?? session.metadata?.user_id) as string | null;
        if (userId) {
          await supabase
            .from("profiles")
            .update({
              plan: "active",
              stripe_subscription_id: (session.subscription as string) ?? null,
            })
            .eq("id", userId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        const status = sub.status;
        const isActive = ["active", "trialing"].includes(status);
        if (userId) {
          const subItem = sub.items.data[0];
          const periodEndUnix =
            (subItem as unknown as { current_period_end?: number })?.current_period_end ?? null;
          const periodEndIso =
            periodEndUnix !== null ? new Date(periodEndUnix * 1000).toISOString() : null;
          await supabase
            .from("profiles")
            .update({
              plan: isActive ? "active" : status === "canceled" ? "canceled" : "free",
              stripe_subscription_id: sub.id,
              subscription_current_period_end: periodEndIso,
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
            .update({ plan: "canceled", stripe_subscription_id: null })
            .eq("id", userId);
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
