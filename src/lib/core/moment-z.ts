/**
 * Moment Z — pic de synchronisation collective d'un événement C.O.R.E.
 *
 * Le "Moment Z" est l'instant où toutes les participantes sont invitées à
 * converger (respiration / intention / présence) en même temps. Fonctions
 * pures et déterministes : `now` est toujours passé en paramètre pour rester
 * testable (jamais de `Date.now()` ici).
 */

export type CoreEventType = "now" | "24h" | "7days";

export interface MomentZEvent {
  type: CoreEventType;
  starts_at: string;
  ends_at?: string | null;
  synchronization_moment_z?: string | null;
}

export type MomentZStatus = "upcoming" | "live" | "passed";

/** Fenêtre par défaut autour du Moment Z pendant laquelle la sync est "live" (secondes). */
export const MOMENT_Z_WINDOW_SEC = 120;

/**
 * Date du Moment Z d'un événement.
 * - explicite si `synchronization_moment_z` est fourni
 * - sinon `starts_at` pour un événement `now`
 * - sinon le milieu entre `starts_at` et `ends_at`
 * - sinon `starts_at` en dernier recours
 */
export function getMomentZ(event: MomentZEvent): Date {
  if (event.synchronization_moment_z) {
    return new Date(event.synchronization_moment_z);
  }
  const start = new Date(event.starts_at);
  if (event.type === "now" || !event.ends_at) {
    return start;
  }
  const end = new Date(event.ends_at);
  return new Date((start.getTime() + end.getTime()) / 2);
}

/** Secondes restantes avant le Moment Z (négatif si déjà passé). */
export function secondsUntilMomentZ(event: MomentZEvent, now: Date): number {
  return Math.round((getMomentZ(event).getTime() - now.getTime()) / 1000);
}

/** Vrai si `now` est dans la fenêtre ±window autour du Moment Z. */
export function isWithinMomentZWindow(
  event: MomentZEvent,
  now: Date,
  windowSec: number = MOMENT_Z_WINDOW_SEC,
): boolean {
  return Math.abs(secondsUntilMomentZ(event, now)) <= windowSec;
}

/** Statut du Moment Z relativement à `now`. */
export function momentZStatus(
  event: MomentZEvent,
  now: Date,
  windowSec: number = MOMENT_Z_WINDOW_SEC,
): MomentZStatus {
  const delta = secondsUntilMomentZ(event, now);
  if (delta > windowSec) return "upcoming";
  if (delta < -windowSec) return "passed";
  return "live";
}

/** Formate un compte à rebours en `H:MM:SS` (ou `MM:SS` si < 1h). Clampé à 0. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
