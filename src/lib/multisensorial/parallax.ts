/**
 * Parallax — DeviceMotion / pointer normalisé en {x,y} dans [-1, 1].
 *
 * Ne touche pas au DOM. C'est le composant qui consomme le hook qui translate3d.
 */

export interface ParallaxOffset {
  x: number;
  y: number;
}

export const ZERO_OFFSET: ParallaxOffset = { x: 0, y: 0 };

/**
 * Conversion gyroscope iOS/Android → offset normalisé.
 *
 * `beta`  : pitch  (-180..180, ~0 quand l'écran face à toi)
 * `gamma` : roll   (-90..90)
 *
 * On clamp à ±15° pour éviter le mal de mer puis on normalise.
 */
export function deviceOrientationToOffset(
  beta: number | null,
  gamma: number | null
): ParallaxOffset {
  if (beta === null || gamma === null) return ZERO_OFFSET;
  const clampedY = Math.max(-15, Math.min(15, beta - 0));
  const clampedX = Math.max(-15, Math.min(15, gamma));
  return { x: clampedX / 15, y: clampedY / 15 };
}

/**
 * Conversion mouvement souris (event.clientX/Y vs viewport) → offset normalisé.
 */
export function pointerToOffset(
  clientX: number,
  clientY: number,
  viewportWidth: number,
  viewportHeight: number
): ParallaxOffset {
  if (!viewportWidth || !viewportHeight) return ZERO_OFFSET;
  const x = (clientX / viewportWidth) * 2 - 1;
  const y = (clientY / viewportHeight) * 2 - 1;
  return { x, y };
}

/**
 * iOS 13+ exige une autorisation explicite pour DeviceMotion.
 */
export async function requestDeviceMotionPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const anyDM = (
    window as unknown as {
      DeviceMotionEvent?: { requestPermission?: () => Promise<"granted" | "denied"> };
    }
  ).DeviceMotionEvent;
  if (!anyDM || typeof anyDM.requestPermission !== "function") {
    // Plateformes sans gating (Android, desktop) → autorisé d'office.
    return true;
  }
  try {
    const result = await anyDM.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

/**
 * Vrai si l'utilisateur préfère ne pas être bougé.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
