/**
 * Haptics — wrapper unifié web (Vibration API) / Capacitor (P9).
 *
 * Patterns inspirés iOS Haptic Engine. Sur web, Vibration API n'a qu'un
 * paramètre `duration ms` — on simule l'intensité en jouant sur la durée.
 *
 * Toutes les fonctions sont silencieuses en cas d'absence de support
 * (desktop, iOS Safari sans Vibration API, mode économie d'énergie).
 */

export type HapticIntensity = "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error";

const PATTERN: Record<HapticIntensity, number | number[]> = {
  selection: 4,
  light: 8,
  medium: 14,
  heavy: 24,
  success: [8, 30, 8],
  warning: [12, 40, 12],
  error: [20, 60, 20, 60, 20],
};

function canVibrate(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return typeof navigator.vibrate === "function";
}

/**
 * Déclenche une vibration. Respecte le toggle utilisateur (passé par le caller).
 *
 * @param enabled  Toggle utilisateur `multisensorial_haptics`. Si false → no-op.
 */
export function haptic(intensity: HapticIntensity, enabled: boolean = true): void {
  if (!enabled) return;
  if (!canVibrate()) return;
  try {
    navigator.vibrate(PATTERN[intensity]);
  } catch {
    // Volontairement silencieux : haptic est secondaire.
  }
}

export function isHapticSupported(): boolean {
  return canVibrate();
}
