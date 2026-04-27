/**
 * Règles de commission INFLUENCEUR — BRIEF §9.3.
 *
 *  - 1er paiement abonnement filleul : 50 % (ou `base_commission_first` du link)
 *  - Récurrent à vie tant que filleul reste abonné : 10 % (`lifetime_commission`)
 *  - Si filleul churn → la prochaine facture ne déclenche plus de commission
 *  - Plafond cookie 30 j (validé en amont par cookie + metadata Stripe)
 *
 * Module TS pur (testable Vitest), sans I/O.
 */

import type { InfluencerLinkRow } from "./types";

export interface InfluencerCommissionInput {
  /** Montant facturé en centimes (ex : 1499 pour 14,99 €). */
  amountCents: number;
  /** Si c'est la première invoice payée pour ce filleul. */
  isFirstPayment: boolean;
  /** Pourcentages éventuellement custom par link. Default 50/10. */
  link?: Pick<InfluencerLinkRow, "base_commission_first" | "lifetime_commission"> | null;
}

export interface InfluencerCommissionResult {
  commissionCents: number;
  /** 'first_payment' (50 %) ou 'recurring' (10 %). */
  kind: "first_payment" | "recurring";
  /** Pourcentage appliqué (0–100). */
  percent: number;
}

/** % par défaut si aucun link override (BRIEF §9.3). */
export const DEFAULT_INFLUENCER_FIRST_PERCENT = 50;
export const DEFAULT_INFLUENCER_RECURRING_PERCENT = 10;

/** Plafonne le pourcentage à [0..100] pour éviter une mauvaise saisie admin. */
export function clampPercent(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Calcule la commission influenceur à appliquer.
 *
 * Robuste : si `amountCents <= 0` → retourne 0 (refund négatif géré ailleurs).
 */
export function computeInfluencerCommission(
  input: InfluencerCommissionInput
): InfluencerCommissionResult {
  const { amountCents, isFirstPayment, link } = input;

  const firstPercent = clampPercent(
    link?.base_commission_first ?? DEFAULT_INFLUENCER_FIRST_PERCENT,
    DEFAULT_INFLUENCER_FIRST_PERCENT
  );
  const recurringPercent = clampPercent(
    link?.lifetime_commission ?? DEFAULT_INFLUENCER_RECURRING_PERCENT,
    DEFAULT_INFLUENCER_RECURRING_PERCENT
  );

  const percent = isFirstPayment ? firstPercent : recurringPercent;
  const kind = isFirstPayment ? "first_payment" : "recurring";

  if (amountCents <= 0) {
    return { commissionCents: 0, kind, percent };
  }

  // Math.floor pour ne jamais sur-créditer l'influenceur
  const commissionCents = Math.floor((amountCents * percent) / 100);

  return { commissionCents, kind, percent };
}

/**
 * Calcule le clawback (retournement) lors d'un refund.
 * Renvoie un montant NÉGATIF en centimes (montant à débiter de la commission).
 */
export function computeInfluencerClawback(refundedAmountCents: number): number {
  if (refundedAmountCents <= 0) return 0;
  // Le clawback applique le même % que le 1er paiement (cas le plus fréquent : remboursement immédiat).
  return -Math.floor((refundedAmountCents * DEFAULT_INFLUENCER_FIRST_PERCENT) / 100);
}
