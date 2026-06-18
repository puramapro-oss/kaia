/**
 * Frais de retrait wallet — grille dégressive. Plus le montant est élevé, plus
 * le taux baisse (incite à retirer moins souvent, couvre les frais Stripe).
 * Fonction pure.
 *
 * Min 20€ (8.7%) · recommandé 50€ (4.8%) · 200€+ (3.0%).
 * Bornes = source unique `WALLET_MIN/MAX_WITHDRAWAL_EUR` (lib/constants.ts).
 */
import { WALLET_MIN_WITHDRAWAL_EUR, WALLET_MAX_WITHDRAWAL_EUR } from "@/lib/constants";

export const MIN_WITHDRAWAL_CENTS = WALLET_MIN_WITHDRAWAL_EUR * 100;
export const MAX_WITHDRAWAL_CENTS = WALLET_MAX_WITHDRAWAL_EUR * 100;

interface FeeTier {
  minCents: number;
  ratePct: number;
}

// Trié par seuil décroissant pour un lookup simple.
const TIERS: FeeTier[] = [
  { minCents: 200_00, ratePct: 3.0 },
  { minCents: 50_00, ratePct: 4.8 },
  { minCents: 20_00, ratePct: 8.7 },
];

export interface WithdrawalQuote {
  amountCents: number;
  ratePct: number;
  feeCents: number;
  netCents: number;
}

/** Taux applicable à un montant (cents). */
export function feeRateFor(amountCents: number): number {
  const tier = TIERS.find((t) => amountCents >= t.minCents);
  return tier ? tier.ratePct : TIERS[TIERS.length - 1].ratePct;
}

/**
 * Devis de retrait. Renvoie null hors des bornes [min, max] (retrait interdit).
 * Les frais sont arrondis au cent supérieur (en faveur de la plateforme).
 */
export function quoteWithdrawal(amountCents: number): WithdrawalQuote | null {
  if (!Number.isFinite(amountCents)) return null;
  if (amountCents < MIN_WITHDRAWAL_CENTS || amountCents > MAX_WITHDRAWAL_CENTS) return null;
  const ratePct = feeRateFor(amountCents);
  const feeCents = Math.ceil((amountCents * ratePct) / 100);
  return { amountCents, ratePct, feeCents, netCents: amountCents - feeCents };
}
