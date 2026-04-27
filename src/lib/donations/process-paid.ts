/**
 * Helper invoqué par le webhook Stripe quand `checkout.session.completed`
 * arrive avec metadata.kaia_donation_id (don confirmé).
 *
 *  - Marque le don 'succeeded' (idempotency par stripe_payment_intent)
 *  - Crédite tokens + tickets éligibles (apply_token_event idempotent)
 *  - Envoie le reçu fiscal via Resend (best-effort)
 */
import type Stripe from "stripe";
import type { createServiceClient } from "@/lib/supabase/admin";
import { computeDonationRewards, getCause } from "./causes";
import {
  sendDonationReceipt,
  nextReceiptNumber,
} from "@/lib/email/donation-receipt";

type AdminClient = ReturnType<typeof createServiceClient>;

export interface ProcessDonationResult {
  processed: boolean;
  reason?: string;
  tokensCredited?: number;
  ticketsCredited?: number;
  receiptSent?: boolean;
}

export async function processDonationPaid(params: {
  admin: AdminClient;
  session: Stripe.Checkout.Session;
}): Promise<ProcessDonationResult> {
  const { admin, session } = params;
  const meta = session.metadata ?? {};
  const donationId = meta.kaia_donation_id;
  if (!donationId) {
    return { processed: false, reason: "no_donation_id" };
  }
  const userId = meta.user_id ?? null;
  const causeSlug = meta.kaia_cause ?? null;

  // Récupère le don
  const { data: donation } = await admin
    .from("donations")
    .select("*")
    .eq("id", donationId)
    .maybeSingle();
  if (!donation) {
    return { processed: false, reason: "donation_not_found" };
  }
  if (donation.status === "succeeded") {
    return { processed: false, reason: "already_succeeded" };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
  const amountCents = donation.amount_cents as number;

  const { tokens, tickets } = computeDonationRewards(amountCents);
  const cause = getCause((causeSlug ?? donation.cause) as string);

  // Marque succeeded
  await admin
    .from("donations")
    .update({
      status: "succeeded",
      stripe_payment_intent: paymentIntentId,
      tokens_credited: tokens,
      tickets_credited: tickets,
    })
    .eq("id", donationId);

  // Crédite tokens si user identifié
  if (userId && tokens > 0) {
    await admin.rpc("apply_token_event", {
      p_user_id: userId,
      p_delta: tokens,
      p_reason: "donation_reward",
      p_metadata: { donationId, causeSlug, amountCents },
      p_idempotency_key: `donation_tokens_${donationId}`,
    });
  }

  // Crédite tickets sur le concours weekly courant si éligibles
  if (userId && tickets > 0) {
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
        tickets,
        source: "donation",
      });
    }
  }

  // Envoi reçu fiscal (best-effort)
  let receiptSent = false;
  if (donation.donor_email && cause) {
    const number = nextReceiptNumber();
    const r = await sendDonationReceipt({
      donorEmail: donation.donor_email as string,
      donorName: (donation.donor_name as string) ?? "Donateur·rice",
      amountCents,
      causeTitle: cause.title,
      causeSlug: cause.slug,
      donationId,
      receiptNumber: number,
      paidAt: new Date(),
    });
    if (r.sent) {
      await admin
        .from("donations")
        .update({ receipt_sent_at: new Date().toISOString() })
        .eq("id", donationId);
      receiptSent = true;
    }
  }

  return {
    processed: true,
    tokensCredited: tokens,
    ticketsCredited: tickets,
    receiptSent,
  };
}
