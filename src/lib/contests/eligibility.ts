/**
 * Règles d'éligibilité concours KAÏA — BRIEF §5.9.
 * Module TS pur · testable · zéro I/O.
 *
 *  - 1 ticket / routine quotidienne complétée
 *  - 5 tickets / abonné actif (one-shot par tirage)
 *  - 1 ticket / parrainage converti
 *  - 1 ticket / rituel hebdo complété
 *  - 1 ticket / 100 tokens dépensés en boutique (achat ou don)
 *
 * Aucun ticket n'est conditionné à un abonnement payant — règle Loi Loyauté
 * Loteries 2014 (gratuit total possible).
 */

export type ContestSource =
  | "practice"
  | "subscription"
  | "referral"
  | "ritual"
  | "shop"
  | "donation"
  | "manual";

export interface EligibilityInput {
  routinesCompleted: number;
  isActiveSubscriber: boolean;
  referralsConverted: number;
  ritualsParticipated: number;
  tokensSpentShop: number;
}

export interface EligibilityResult {
  total: number;
  breakdown: Array<{ source: ContestSource; tickets: number; rule: string }>;
}

const RULES = {
  PER_ROUTINE: 1,
  ACTIVE_SUBSCRIBER_BONUS: 5,
  PER_REFERRAL: 1,
  PER_RITUAL: 1,
  TOKENS_PER_TICKET_SHOP: 100,
  MAX_PER_USER: 50, // garde-fou anti-abus côté DB également
} as const;

export function computeEligibleTickets(input: EligibilityInput): EligibilityResult {
  const breakdown: EligibilityResult["breakdown"] = [];
  const safe = (n: number) => Math.max(0, Math.floor(n));

  const routines = safe(input.routinesCompleted) * RULES.PER_ROUTINE;
  if (routines > 0) {
    breakdown.push({ source: "practice", tickets: routines, rule: "1×routine" });
  }

  if (input.isActiveSubscriber) {
    breakdown.push({
      source: "subscription",
      tickets: RULES.ACTIVE_SUBSCRIBER_BONUS,
      rule: "5×abonné actif",
    });
  }

  const refs = safe(input.referralsConverted) * RULES.PER_REFERRAL;
  if (refs > 0) {
    breakdown.push({ source: "referral", tickets: refs, rule: "1×parrainage converti" });
  }

  const rituals = safe(input.ritualsParticipated) * RULES.PER_RITUAL;
  if (rituals > 0) {
    breakdown.push({ source: "ritual", tickets: rituals, rule: "1×rituel hebdo" });
  }

  const shopTickets = Math.floor(safe(input.tokensSpentShop) / RULES.TOKENS_PER_TICKET_SHOP);
  if (shopTickets > 0) {
    breakdown.push({ source: "shop", tickets: shopTickets, rule: "1 / 100 tokens dépensés" });
  }

  const rawTotal = breakdown.reduce((acc, b) => acc + b.tickets, 0);
  const total = Math.min(rawTotal, RULES.MAX_PER_USER);
  return { total, breakdown };
}

export const CONTEST_RULES = RULES;
