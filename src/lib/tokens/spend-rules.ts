/**
 * Règles de dépense des tokens (BRIEF §11.2).
 * 100 tokens = 1€ (équivalent virtuel Phase 1, cash réel via Treezor Phase 2).
 */

import { EUR_TO_TOKENS } from "@/lib/constants";

export type SpendKind =
  | "promo_subscription_pct"
  | "contest_ticket"
  | "shop_product"
  | "donation_unlock"
  | "vip_ritual_access";

export interface SpendItem {
  kind: SpendKind;
  /** Coût en tokens. Pour un % de promo abonnement, peut varier — voir `SUBSCRIPTION_DISCOUNTS`. */
  costTokens: number;
  label: string;
  description: string;
}

/** Promotions sur l'abonnement (BRIEF §11.2). */
export const SUBSCRIPTION_DISCOUNTS: Record<10 | 20 | 30 | 50, { tokens: number; label: string }> = {
  10: { tokens: 1000, label: "−10% sur l'abonnement" },
  20: { tokens: 2000, label: "−20% sur l'abonnement" },
  30: { tokens: 3000, label: "−30% sur l'abonnement" },
  50: { tokens: 5000, label: "−50% sur l'abonnement" },
};

export const CONTEST_TICKET_COST = 500;
export const VIP_RITUAL_ACCESS_COST = 2000;
export const DONATION_UNLOCK_THRESHOLD_EUR = 5;

/** Conversion tokens → euros (Phase 1 = équivalent virtuel uniquement). */
export function tokensToEuros(tokens: number): number {
  return Math.floor((tokens / EUR_TO_TOKENS) * 100) / 100;
}

/** Conversion euros → tokens. */
export function eurosToTokens(euros: number): number {
  return Math.round(euros * EUR_TO_TOKENS);
}

export type SpendValidation =
  | { ok: true; cost: number }
  | { ok: false; reason: "insufficient_balance" | "invalid_kind"; needed?: number; have?: number };

/** Vérifie si l'utilisateur peut dépenser pour un kind donné. */
export function validateSpend(
  kind: SpendKind,
  balance: number,
  meta?: { discountPct?: 10 | 20 | 30 | 50; itemCostTokens?: number },
): SpendValidation {
  let cost: number;
  switch (kind) {
    case "promo_subscription_pct": {
      const pct = meta?.discountPct;
      if (!pct || !(pct in SUBSCRIPTION_DISCOUNTS)) {
        return { ok: false, reason: "invalid_kind" };
      }
      cost = SUBSCRIPTION_DISCOUNTS[pct].tokens;
      break;
    }
    case "contest_ticket":
      cost = CONTEST_TICKET_COST;
      break;
    case "vip_ritual_access":
      cost = VIP_RITUAL_ACCESS_COST;
      break;
    case "shop_product":
      cost = meta?.itemCostTokens ?? 0;
      if (cost <= 0) return { ok: false, reason: "invalid_kind" };
      break;
    case "donation_unlock":
      cost = eurosToTokens(DONATION_UNLOCK_THRESHOLD_EUR);
      break;
    default:
      return { ok: false, reason: "invalid_kind" };
  }
  if (balance < cost) {
    return { ok: false, reason: "insufficient_balance", needed: cost, have: balance };
  }
  return { ok: true, cost };
}
