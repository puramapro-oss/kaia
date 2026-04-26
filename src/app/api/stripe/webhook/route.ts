import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
        break;
      }
      case "invoice.payment_succeeded": {
        // Hook for influencer commissions / referral commissions in P6.
        break;
      }
      case "invoice.payment_failed": {
        // Hook for dunning / email retry in P8.
        break;
      }
      case "charge.refunded": {
        // Hook for clawback of influencer commissions in P6.
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
