/**
 * KAÏA — capacitor-detect.ts (P10)
 *
 * Helpers pour brancher du code conditionnel iOS/Android/Web sans crasher
 * en SSR. Tous les imports Capacitor sont DYNAMIQUES — l'app web hors
 * Capacitor reste 100% fonctionnelle.
 */

import type { Capacitor as CapacitorType } from "@capacitor/core";

let cachedCapacitor: typeof CapacitorType | null = null;

async function loadCapacitor(): Promise<typeof CapacitorType | null> {
  if (typeof window === "undefined") return null;
  if (cachedCapacitor) return cachedCapacitor;
  try {
    const mod = await import("@capacitor/core");
    cachedCapacitor = mod.Capacitor;
    return cachedCapacitor;
  } catch {
    return null;
  }
}

export async function isNative(): Promise<boolean> {
  const cap = await loadCapacitor();
  return cap?.isNativePlatform() ?? false;
}

export async function getPlatform(): Promise<"ios" | "android" | "web"> {
  const cap = await loadCapacitor();
  if (!cap) return "web";
  const platform = cap.getPlatform();
  return platform === "ios" || platform === "android" ? platform : "web";
}

/** Vibration tactile native si disponible, no-op silencieux sinon. */
export async function nativeHaptic(style: "light" | "medium" | "heavy" = "light"): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    } as const;
    await Haptics.impact({ style: map[style] });
  } catch {
    // ignore
  }
}
