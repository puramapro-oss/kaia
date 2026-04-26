/**
 * Calcul de série quotidienne (streak) — BRIEF §11.1.
 *
 * Règles :
 * - Une routine validée hier → streak +1.
 * - Une routine validée aujourd'hui (déjà compté) → no-op.
 * - Sinon (gap) → streak reset à 1.
 * - Bonus +50 tokens à 7j, +200 à 30j (delta exact, pas multiple — un user touche ces bonus 1× par seuil).
 *
 * Toutes les dates sont normalisées en UTC date-only (00:00:00.000Z) pour éviter les bugs timezone.
 */

import type { EarnReason } from "@/lib/tokens/earn-rules";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface StreakInput {
  /** Streak actuel (avant l'événement). */
  currentStreak: number;
  /** Dernière date où l'user a complété une routine (ou null si jamais). */
  lastRoutineDate: Date | string | null | undefined;
  /** Date d'aujourd'hui — injectable pour tests. */
  today?: Date;
}

export interface StreakResult {
  newStreak: number;
  /** True si on doit MAJ profiles.streak_days. */
  shouldUpdate: boolean;
  /** Bonus déclenchés par cette transition (à appliquer via apply_token_event). */
  bonuses: EarnReason[];
}

function dateOnlyUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function diffDays(a: Date, b: Date): number {
  return Math.round((dateOnlyUtc(a).getTime() - dateOnlyUtc(b).getTime()) / MS_PER_DAY);
}

/**
 * Calcule le nouveau streak APRÈS qu'un user ait complété sa routine du jour.
 *
 * @example
 * computeStreakAfterRoutine({ currentStreak: 6, lastRoutineDate: yesterday })
 *   // => { newStreak: 7, shouldUpdate: true, bonuses: ['streak_7_bonus'] }
 */
export function computeStreakAfterRoutine(input: StreakInput): StreakResult {
  const today = input.today ?? new Date();
  const todayUtc = dateOnlyUtc(today);

  if (!input.lastRoutineDate) {
    return {
      newStreak: 1,
      shouldUpdate: true,
      bonuses: bonusesForStreak(0, 1),
    };
  }

  const last = input.lastRoutineDate instanceof Date ? input.lastRoutineDate : new Date(input.lastRoutineDate);
  if (Number.isNaN(last.getTime())) {
    return { newStreak: 1, shouldUpdate: true, bonuses: bonusesForStreak(0, 1) };
  }

  const delta = diffDays(todayUtc, last);

  if (delta === 0) {
    // Routine déjà comptée aujourd'hui — pas de re-credit, pas de re-bonus.
    return { newStreak: input.currentStreak, shouldUpdate: false, bonuses: [] };
  }

  if (delta === 1) {
    const next = input.currentStreak + 1;
    return {
      newStreak: next,
      shouldUpdate: true,
      bonuses: bonusesForStreak(input.currentStreak, next),
    };
  }

  // Gap >= 2 jours : reset à 1.
  return {
    newStreak: 1,
    shouldUpdate: true,
    bonuses: bonusesForStreak(0, 1),
  };
}

/** Renvoie les bonus à attribuer en passant de `from` à `to` (jamais en double). */
function bonusesForStreak(from: number, to: number): EarnReason[] {
  const bonuses: EarnReason[] = [];
  if (from < 7 && to >= 7) bonuses.push("streak_7_bonus");
  if (from < 30 && to >= 30) bonuses.push("streak_30_bonus");
  return bonuses;
}
