/**
 * Drip d'onboarding : guide premier cycle (J3) + invitation AURORA (J7).
 * Basé sur `profiles.onboarded_at`. Fonctions pures (now en paramètre) → testables.
 * Match exact du jour → un seul envoi par palier, jamais quotidien.
 */
import type { KaiaEmailKind } from "@/lib/email/kaia-emails";

export const DRIP_DAYS = { first_cycle_guide: 3, aurora_invitation: 7 } as const;
export type DripKind = keyof typeof DRIP_DAYS;

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDay(ms: number): string {
  return new Date(ms).toISOString().split("T")[0];
}

/** Dates d'onboarding (YYYY-MM-DD) ciblées aujourd'hui, par palier. */
export function dripTargetDates(nowMs: number): Record<DripKind, string> {
  return {
    first_cycle_guide: isoDay(nowMs - DRIP_DAYS.first_cycle_guide * DAY_MS),
    aurora_invitation: isoDay(nowMs - DRIP_DAYS.aurora_invitation * DAY_MS),
  };
}

/** Bornes [début, fin) couvrant tous les paliers, pour borner la requête SQL. */
export function dripQueryWindow(nowMs: number): { startISO: string; endISO: string } {
  const maxDays = Math.max(...Object.values(DRIP_DAYS));
  const minDays = Math.min(...Object.values(DRIP_DAYS));
  return {
    startISO: new Date(nowMs - (maxDays + 1) * DAY_MS).toISOString(),
    endISO: new Date(nowMs - minDays * DAY_MS).toISOString(),
  };
}

/** Palier de drip pour une date d'onboarding, ou null. */
export function dripKindForDate(onboardedAt: string | null, nowMs: number): (DripKind & KaiaEmailKind) | null {
  if (!onboardedAt) return null;
  const targets = dripTargetDates(nowMs);
  const day = onboardedAt.split("T")[0];
  if (day === targets.first_cycle_guide) return "first_cycle_guide";
  if (day === targets.aurora_invitation) return "aurora_invitation";
  return null;
}
