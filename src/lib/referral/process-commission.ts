/**
 * Helper webhook Stripe — calcule + insère une commission parrainage particulier
 * + crédite le bonus tokens parrain au 1er paiement (BRIEF §10 + §11.1).
 *
 *  - Idempotency via UNIQUE(stripe_invoice_id) sur referral_commissions
 *  - Crédit +200 tokens parrain seulement à la 1ère facture (referral_converted)
 *  - +200 tokens filleul à l'inscription (logique séparée — handle dans /auth/callback)
 */
import type { createServiceClient } from "@/lib/supabase/admin";
import {
  computeReferralCommission,
  REFERRAL_CONVERTED_TOKENS_BONUS,
  type ReferralSource,
} from "./commission-rules";

type AdminClient = ReturnType<typeof createServiceClient>;

interface ProcessParams {
  admin: AdminClient;
  referrerCode: string;
  referredUserId: string;
  amountCents: number;
  source: ReferralSource;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
}

export interface ProcessResult {
  inserted: boolean;
  commissionCents: number;
  bonusTokensApplied: boolean;
  reason?: string;
}

export async function processReferralCommission(
  params: ProcessParams
): Promise<ProcessResult> {
  const {
    admin,
    referrerCode,
    referredUserId,
    amountCents,
    source,
    stripeInvoiceId,
    stripePaymentIntentId,
  } = params;

  // Trouve le parrain par son code
  const { data: referrer } = await admin
    .from("profiles")
    .select("id")
    .eq("referral_code", referrerCode)
    .maybeSingle();

  if (!referrer) {
    return {
      inserted: false,
      commissionCents: 0,
      bonusTokensApplied: false,
      reason: "referrer_not_found",
    };
  }

  if (referrer.id === referredUserId) {
    return {
      inserted: false,
      commissionCents: 0,
      bonusTokensApplied: false,
      reason: "self_referral_blocked",
    };
  }

  // Idempotency check
  if (stripeInvoiceId) {
    const { data: dupe } = await admin
      .from("referral_commissions")
      .select("id")
      .eq("stripe_invoice_id", stripeInvoiceId)
      .maybeSingle();
    if (dupe) {
      return {
        inserted: false,
        commissionCents: 0,
        bonusTokensApplied: false,
        reason: "already_logged",
      };
    }
  }

  const { commissionCents } = computeReferralCommission({ amountCents, source });

  // Insert/update referrals (UNIQUE referred_user_id) — premier paiement → status active
  const isFirst = source === "subscription_first";
  await admin
    .from("referrals")
    .upsert(
      {
        referrer_user_id: referrer.id,
        referred_user_id: referredUserId,
        status: isFirst ? "active" : undefined,
        first_payment_at: isFirst ? new Date().toISOString() : undefined,
      },
      { onConflict: "referred_user_id", ignoreDuplicates: false }
    );

  if (commissionCents > 0) {
    const insertRes = await admin.from("referral_commissions").insert({
      referrer_user_id: referrer.id,
      referred_user_id: referredUserId,
      source,
      amount_cents: amountCents,
      commission_cents: commissionCents,
      stripe_invoice_id: stripeInvoiceId ?? null,
      stripe_payment_intent_id: stripePaymentIntentId ?? null,
      status: "pending",
    });

    if (insertRes.error) {
      // Si la table n'existe pas encore (migration 0003 absente), on log et on continue
      console.warn(
        "[KAIA referral] Insert commission échoué :",
        insertRes.error.message
      );
    }

    // Met à jour total_commission_cents sur referrals
    const incrementRes = await admin.rpc("increment_referral_commission", {
      p_referrer_user_id: referrer.id,
      p_referred_user_id: referredUserId,
      p_delta_cents: commissionCents,
    });
    if (incrementRes.error) {
      // Pas de RPC → fallback : addition manuelle (atomic via SQL fonction)
      const { data: row } = await admin
        .from("referrals")
        .select("total_commission_cents")
        .eq("referrer_user_id", referrer.id)
        .eq("referred_user_id", referredUserId)
        .maybeSingle();
      const newTotal = (row?.total_commission_cents ?? 0) + commissionCents;
      await admin
        .from("referrals")
        .update({ total_commission_cents: newTotal })
        .eq("referrer_user_id", referrer.id)
        .eq("referred_user_id", referredUserId);
    }
  }

  // Bonus +200 tokens parrain (seulement 1ère fois)
  let bonusTokensApplied = false;
  if (isFirst) {
    const idempKey = `referral_converted_${referrer.id}_${referredUserId}`;
    const { data, error } = await admin.rpc("apply_token_event", {
      p_user_id: referrer.id,
      p_delta: REFERRAL_CONVERTED_TOKENS_BONUS,
      p_reason: "referral_converted",
      p_metadata: { referredUserId },
      p_idempotency_key: idempKey,
    });
    if (!error && Array.isArray(data) && data[0]?.applied) {
      bonusTokensApplied = true;
    }
  }

  return {
    inserted: commissionCents > 0,
    commissionCents,
    bonusTokensApplied,
  };
}
