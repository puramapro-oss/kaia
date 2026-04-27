/**
 * Règles de commission PARRAINAGE (utilisateur particulier) — BRIEF §10.
 *
 *  - 1er paiement abonnement filleul : 50 %
 *  - Récurrent à vie tant que filleul reste abonné : 10 %
 *  - Achat produit VIDA shop : 5 %
 *  - +200 tokens bonus parrain à la conversion (1ère facture)
 *  - Si filleul churn → arrêt commissions (statut 'expired')
 *
 * Module TS pur (testable Vitest), sans I/O.
 *
 * NB : ces % sont fixes (pas de table ALTER pour custom). Si on veut
 * personnaliser un jour → ajouter colonnes sur `referrals`.
 */

import type { ReferralCommissionRow } from "./types";

export const REFERRAL_FIRST_PERCENT = 50;
export const REFERRAL_RECURRING_PERCENT = 10;
export const REFERRAL_SHOP_PERCENT = 5;
export const REFERRAL_CONVERTED_TOKENS_BONUS = 200;
export const REFERRAL_REFEREE_WELCOME_TOKENS = 200;

export type ReferralSource = ReferralCommissionRow["source"];

export interface ReferralCommissionInput {
  amountCents: number;
  source: ReferralSource;
}

export interface ReferralCommissionResult {
  commissionCents: number;
  source: ReferralSource;
  percent: number;
}

const PERCENT_BY_SOURCE: Record<ReferralSource, number> = {
  subscription_first: REFERRAL_FIRST_PERCENT,
  subscription_recurring: REFERRAL_RECURRING_PERCENT,
  shop_purchase: REFERRAL_SHOP_PERCENT,
};

/**
 * Calcule la commission parrainage à appliquer.
 * Garantit `commissionCents >= 0` (refund négatif géré ailleurs).
 */
export function computeReferralCommission(
  input: ReferralCommissionInput
): ReferralCommissionResult {
  const { amountCents, source } = input;
  const percent = PERCENT_BY_SOURCE[source];
  if (typeof percent !== "number") {
    return { commissionCents: 0, source, percent: 0 };
  }
  if (amountCents <= 0) {
    return { commissionCents: 0, source, percent };
  }
  const commissionCents = Math.floor((amountCents * percent) / 100);
  return { commissionCents, source, percent };
}

/**
 * Clawback parrainage lors d'un refund.
 * Retourne montant NÉGATIF.
 */
export function computeReferralClawback(
  refundedAmountCents: number,
  source: ReferralSource
): number {
  if (refundedAmountCents <= 0) return 0;
  const percent = PERCENT_BY_SOURCE[source] ?? 0;
  return -Math.floor((refundedAmountCents * percent) / 100);
}

/** True si la source est une source d'abonnement (pour gating "1ère fois"). */
export function isSubscriptionSource(source: ReferralSource): boolean {
  return source === "subscription_first" || source === "subscription_recurring";
}
