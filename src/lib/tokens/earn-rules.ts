/**
 * Règles d'attribution des tokens (BRIEF §11.1).
 * Utilisées par les routes API pour computer le delta avant `apply_token_event`.
 *
 * Le RPC SQL `kaia.apply_token_event` applique le cap quotidien (200) côté DB.
 * Ici on définit uniquement le delta nominal par action.
 */

export type EarnReason =
  | "routine_completed"
  | "practice_completed"
  | "streak_7_bonus"
  | "streak_30_bonus"
  | "ritual_completed"
  | "mission_solo"
  | "mission_humanitarian"
  | "mission_marketing_story"
  | "mission_marketing_video"
  | "mission_marketing_dm"
  | "mission_social_follow"
  | "donation_per_10cents"
  | "shop_purchase_cashback"
  | "referral_converted"
  | "onboarding_complete"
  | "first_routine"
  | "feedback_given";

export interface EarnRule {
  reason: EarnReason;
  baseTokens: number;
  /** True si la règle est appliquée par CRON (et non depuis un endpoint user). */
  serverOnly?: boolean;
  /** Description user-facing en français. */
  label: string;
}

/** Table de référence — BRIEF §11.1 + §11. */
export const EARN_RULES: Record<EarnReason, EarnRule> = {
  routine_completed: {
    reason: "routine_completed",
    baseTokens: 10,
    label: "Routine du jour complétée",
  },
  practice_completed: {
    reason: "practice_completed",
    baseTokens: 5,
    label: "Micro-pratique terminée",
  },
  streak_7_bonus: {
    reason: "streak_7_bonus",
    baseTokens: 50,
    label: "Bonus série 7 jours",
  },
  streak_30_bonus: {
    reason: "streak_30_bonus",
    baseTokens: 200,
    label: "Bonus série 30 jours",
  },
  ritual_completed: {
    reason: "ritual_completed",
    baseTokens: 30,
    label: "Rituel hebdomadaire",
  },
  mission_solo: {
    reason: "mission_solo",
    baseTokens: 50,
    label: "Mission solo",
  },
  mission_humanitarian: {
    reason: "mission_humanitarian",
    baseTokens: 200,
    label: "Mission humanitaire",
  },
  mission_marketing_story: {
    reason: "mission_marketing_story",
    baseTokens: 50,
    label: "Story partagée",
  },
  mission_marketing_video: {
    reason: "mission_marketing_video",
    baseTokens: 300,
    label: "Vidéo dédiée",
  },
  mission_marketing_dm: {
    reason: "mission_marketing_dm",
    baseTokens: 50,
    label: "DM témoignage",
  },
  mission_social_follow: {
    reason: "mission_social_follow",
    baseTokens: 30,
    label: "Comptes VIDA suivis",
  },
  donation_per_10cents: {
    reason: "donation_per_10cents",
    baseTokens: 1,
    label: "Don VIDA",
    serverOnly: true,
  },
  shop_purchase_cashback: {
    reason: "shop_purchase_cashback",
    baseTokens: 0,
    label: "Cashback boutique 5%",
    serverOnly: true,
  },
  referral_converted: {
    reason: "referral_converted",
    baseTokens: 200,
    label: "Filleul converti",
    serverOnly: true,
  },
  onboarding_complete: {
    reason: "onboarding_complete",
    baseTokens: 20,
    label: "Onboarding terminé",
  },
  first_routine: {
    reason: "first_routine",
    baseTokens: 30,
    label: "Première routine offerte",
  },
  feedback_given: {
    reason: "feedback_given",
    baseTokens: 10,
    label: "Feedback envoyé",
  },
};

/**
 * Earn nominal par raison.
 * @param overrideTokens — pour missions à montant variable (la règle dans `missions` table override).
 */
export function getEarnAmount(reason: EarnReason, overrideTokens?: number): number {
  if (typeof overrideTokens === "number" && overrideTokens >= 0) {
    return overrideTokens;
  }
  return EARN_RULES[reason]?.baseTokens ?? 0;
}

/** Cashback boutique : 5% du montant en euros, en tokens (1€ = 100 tokens). */
export function computeShopCashback(purchaseAmountEur: number): number {
  if (purchaseAmountEur <= 0) return 0;
  return Math.floor(purchaseAmountEur * 100 * 0.05);
}

/** Tokens par don : 1 token / 0.10€. */
export function computeDonationTokens(donationAmountEur: number): number {
  if (donationAmountEur <= 0) return 0;
  return Math.floor(donationAmountEur * 10);
}
