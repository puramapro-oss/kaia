/**
 * Helper webhook Stripe — calcule + insère une commission influenceur depuis
 * une `Stripe.Invoice` reçue dans `invoice.payment_succeeded`.
 *
 *  - Détecte si c'est le 1er paiement (en lookant `influencer_conversions`
 *    existantes pour ce link_id × subscription)
 *  - Floor commission, status='pending'
 *  - Idempotent via UNIQUE(stripe_invoice_id) côté DB (skip si déjà loggé)
 *
 * Robuste : si la migration 0003 manque (colonnes optionnelles), on continue
 * avec defaults 50/10. Toujours utiliser le service client (RLS bypass).
 */
import type { createServiceClient } from "@/lib/supabase/admin";
import {
  computeInfluencerCommission,
  computeInfluencerClawback,
  type InfluencerCommissionResult,
} from "./commission-rules";

type AdminClient = ReturnType<typeof createServiceClient>;

interface ProcessParams {
  admin: AdminClient;
  linkId: string;
  referredUserId: string | null;
  amountCents: number;
  stripeInvoiceId: string;
}

export interface ProcessResult {
  inserted: boolean;
  isFirstPayment: boolean;
  commissionCents: number;
  conversionId?: string;
  reason?: string;
}

export async function processInfluencerCommission(
  params: ProcessParams
): Promise<ProcessResult> {
  const { admin, linkId, referredUserId, amountCents, stripeInvoiceId } = params;

  if (!stripeInvoiceId) {
    return {
      inserted: false,
      isFirstPayment: false,
      commissionCents: 0,
      reason: "missing_invoice_id",
    };
  }

  // Idempotency : si déjà loggé, skip
  const { data: existing } = await admin
    .from("influencer_conversions")
    .select("id")
    .eq("stripe_invoice_id", stripeInvoiceId)
    .maybeSingle();
  if (existing) {
    return {
      inserted: false,
      isFirstPayment: false,
      commissionCents: 0,
      conversionId: existing.id,
      reason: "already_logged",
    };
  }

  // Charge le link pour les % override
  const { data: link } = await admin
    .from("influencer_links")
    .select("base_commission_first, lifetime_commission")
    .eq("id", linkId)
    .maybeSingle();

  // 1er paiement : aucune conversion 'first_payment' existante pour ce filleul × link
  let isFirstPayment = true;
  if (referredUserId) {
    const prior = await admin
      .from("influencer_conversions")
      .select("id")
      .eq("link_id", linkId)
      .eq("referred_user_id", referredUserId)
      .eq("kind", "first_payment")
      .maybeSingle();
    if (prior.data) isFirstPayment = false;
  }

  const result: InfluencerCommissionResult = computeInfluencerCommission({
    amountCents,
    isFirstPayment,
    link: link
      ? {
          base_commission_first: link.base_commission_first ?? null,
          lifetime_commission: link.lifetime_commission ?? null,
        }
      : null,
  });

  if (result.commissionCents <= 0) {
    return {
      inserted: false,
      isFirstPayment,
      commissionCents: 0,
      reason: "zero_commission",
    };
  }

  const { data: inserted, error } = await admin
    .from("influencer_conversions")
    .insert({
      link_id: linkId,
      referred_user_id: referredUserId,
      stripe_invoice_id: stripeInvoiceId,
      amount_cents: amountCents,
      commission_cents: result.commissionCents,
      kind: result.kind,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return {
      inserted: false,
      isFirstPayment,
      commissionCents: result.commissionCents,
      reason: error?.message ?? "insert_failed",
    };
  }

  return {
    inserted: true,
    isFirstPayment,
    commissionCents: result.commissionCents,
    conversionId: inserted.id,
  };
}

/** Marque une conversion comme reversée suite à un refund. */
export async function reverseInfluencerCommission(
  admin: AdminClient,
  stripeInvoiceId: string,
  refundedAmountCents: number
): Promise<void> {
  void refundedAmountCents; // unused but documented
  const _clawback = computeInfluencerClawback(refundedAmountCents);
  void _clawback;
  await admin
    .from("influencer_conversions")
    .update({ status: "reversed" })
    .eq("stripe_invoice_id", stripeInvoiceId)
    .eq("status", "pending");
}
