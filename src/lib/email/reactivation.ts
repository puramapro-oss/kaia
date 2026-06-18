/**
 * Sélection des emails de réactivation lifecycle (J14 inactif, J30 inactif).
 * Fonctions pures (le `now` est passé en paramètre) → testables.
 *
 * Signal d'activité : `profiles.streak_last_at` (date du dernier jour engagé).
 * Match exact du jour (J14 / J30) → un seul envoi par palier, jamais quotidien.
 */
import type { KaiaEmailKind } from "@/lib/email/kaia-emails";

export const REACTIVATION_DAYS = { reactivation_j14: 14, reactivation_j30: 30 } as const;
export type ReactivationKind = keyof typeof REACTIVATION_DAYS;

function isoDay(ms: number): string {
  return new Date(ms).toISOString().split("T")[0];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Dates d'activité (YYYY-MM-DD) ciblées aujourd'hui, par palier de réactivation. */
export function reactivationTargetDates(nowMs: number): Record<ReactivationKind, string> {
  return {
    reactivation_j14: isoDay(nowMs - REACTIVATION_DAYS.reactivation_j14 * DAY_MS),
    reactivation_j30: isoDay(nowMs - REACTIVATION_DAYS.reactivation_j30 * DAY_MS),
  };
}

/** Palier de réactivation pour une date de dernière activité, ou null. */
export function reactivationKindForDate(streakLastAt: string | null, nowMs: number): ReactivationKind | null {
  if (!streakLastAt) return null;
  const targets = reactivationTargetDates(nowMs);
  const day = streakLastAt.split("T")[0];
  if (day === targets.reactivation_j14) return "reactivation_j14";
  if (day === targets.reactivation_j30) return "reactivation_j30";
  return null;
}

/** Type guard : le kind est bien un email lifecycle connu. */
export function isReactivationEmail(kind: ReactivationKind): kind is ReactivationKind & KaiaEmailKind {
  return kind === "reactivation_j14" || kind === "reactivation_j30";
}
