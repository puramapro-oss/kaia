/**
 * Helper webhook Stripe : `checkout.session.completed` mode='payment'
 *  + metadata.kaia_purchase_id → marque la purchase 'paid' + applique cashback.
 */
import type Stripe from "stripe";
import type { createServiceClient } from "@/lib/supabase/admin";
import { computeShopRewards } from "./cashback";

type AdminClient = ReturnType<typeof createServiceClient>;

export interface ProcessPurchaseResult {
  processed: boolean;
  reason?: string;
  cashbackTokens?: number;
  ticketsEarned?: number;
}

export async function processPurchasePaid(params: {
  admin: AdminClient;
  session: Stripe.Checkout.Session;
}): Promise<ProcessPurchaseResult> {
  const { admin, session } = params;
  const meta = session.metadata ?? {};
  const purchaseId = meta.kaia_purchase_id;
  if (!purchaseId) return { processed: false, reason: "no_purchase_id" };

  const { data: purchase } = await admin
    .from("purchases")
    .select("*")
    .eq("id", purchaseId)
    .maybeSingle();
  if (!purchase) return { processed: false, reason: "purchase_not_found" };
  if (purchase.status === "paid") return { processed: false, reason: "already_paid" };

  const amountCents = (session.amount_total ?? purchase.amount_cents) as number;
  const { cashbackTokens, ticketsEarned } = computeShopRewards(amountCents);

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  await admin
    .from("purchases")
    .update({
      status: "paid",
      amount_cents: amountCents,
      stripe_session_id: session.id,
      stripe_payment_intent: paymentIntentId,
      cashback_tokens: cashbackTokens,
      tickets_credited: ticketsEarned,
    })
    .eq("id", purchaseId);

  // Crédit tokens cashback
  const userId = (purchase.user_id as string) ?? null;
  if (userId && cashbackTokens > 0) {
    await admin.rpc("apply_token_event", {
      p_user_id: userId,
      p_delta: cashbackTokens,
      p_reason: "shop_cashback",
      p_metadata: { purchaseId, productId: purchase.product_id, amountCents },
      p_idempotency_key: `shop_cashback_${purchaseId}`,
    });
  }

  // Tickets sur le concours weekly courant
  if (userId && ticketsEarned > 0) {
    const { data: liveContest } = await admin
      .from("contests")
      .select("id")
      .eq("kind", "weekly")
      .eq("status", "live")
      .maybeSingle();
    if (liveContest) {
      await admin.from("contest_entries").insert({
        contest_id: liveContest.id,
        user_id: userId,
        tickets: ticketsEarned,
        source: "shop",
      });
    }
  }

  return { processed: true, cashbackTokens, ticketsEarned };
}
