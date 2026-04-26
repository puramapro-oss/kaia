/**
 * Multiplicateur d'ancienneté abonné (BRIEF §11.4).
 *
 * - Mois 1 (abonné < 30j) : multiplicateur 1.0 (base earn rules)
 * - Mois 2-12 : +10% par mois (1.10, 1.20, ..., 2.00)
 * - Mois 12+ : palier max +200% gel (3.00)
 * - Si plan != 'active' : multiplicateur 1.0 (base, pas d'escalation)
 *
 * Le multiplicateur est appliqué côté API (ex: complete-session) AVANT le RPC apply_token_event :
 *   `delta = baseTokens * multiplier`
 *
 * Le cap 200/jour reste lui aussi côté DB. Le multiplicateur ne by-pass pas le cap.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface MultiplierInput {
  plan: "free" | "active" | "canceled" | string;
  /** Date d'abonnement actif. Null si user free/jamais abonné. */
  subscriptionStartedAt: Date | string | null | undefined;
  /** Date courante — injectable pour tests. */
  now?: Date;
}

export const MAX_MULTIPLIER = 3.0;
export const MULTIPLIER_PER_MONTH = 0.1;

/**
 * Renvoie le multiplicateur d'earn applicable.
 * @returns nombre entre 1.0 et 3.0
 */
export function computeMultiplier({ plan, subscriptionStartedAt, now }: MultiplierInput): number {
  if (plan !== "active" || !subscriptionStartedAt) return 1.0;

  const start = subscriptionStartedAt instanceof Date ? subscriptionStartedAt : new Date(subscriptionStartedAt);
  if (Number.isNaN(start.getTime())) return 1.0;

  const current = now ?? new Date();
  const ageDays = (current.getTime() - start.getTime()) / MS_PER_DAY;
  if (ageDays < 30) return 1.0;

  const monthsActive = Math.floor(ageDays / 30);
  // Mois 2 = monthsActive=1 → +10%
  // Mois 12 = monthsActive=11 → +110% capé à +200%
  const raw = 1.0 + monthsActive * MULTIPLIER_PER_MONTH;
  return Math.min(raw, MAX_MULTIPLIER);
}

/**
 * Applique le multiplicateur au delta de tokens, arrondi entier.
 */
export function applyMultiplier(baseTokens: number, multiplier: number): number {
  if (baseTokens <= 0) return baseTokens;
  return Math.floor(baseTokens * multiplier);
}
