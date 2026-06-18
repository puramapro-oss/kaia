/**
 * Détection de capacité AR — décide du mode de rendu selon l'appareil.
 * Fonction pure (les capacités du navigateur sont passées en paramètres) pour
 * rester testable. Le composant client lit `navigator` et appelle ce helper.
 *
 * - mobile + WebXR (navigator.xr) → mode immersif complet
 * - mobile + caméra (getUserMedia) → mode caméra (body/hand-tracking via flux vidéo)
 * - desktop ou aucune caméra → non supporté → fallback gracieux (jamais d'écran cassé)
 */

export type ARMode = "webxr" | "camera" | "unsupported";

export interface ARCapabilityInput {
  /** navigator.xr présent (WebXR). */
  hasXR: boolean;
  /** navigator.mediaDevices.getUserMedia disponible. */
  hasCamera: boolean;
  userAgent: string;
}

export interface ARCapability {
  supported: boolean;
  mode: ARMode;
  isMobile: boolean;
  /** Raison lisible si non supporté (affichée en fallback). */
  reason?: string;
}

export function isMobileUA(userAgent: string): boolean {
  return /android|iphone|ipad|ipod|mobile/i.test(userAgent);
}

export function detectARCapability(input: ARCapabilityInput): ARCapability {
  const isMobile = isMobileUA(input.userAgent);

  if (!input.hasCamera) {
    return {
      supported: false,
      mode: "unsupported",
      isMobile,
      reason: "Le Miroir Énergétique a besoin d'une caméra. Ouvre KAÏA sur ton téléphone pour vivre l'expérience.",
    };
  }

  if (!isMobile) {
    return {
      supported: false,
      mode: "unsupported",
      isMobile,
      reason: "Le Miroir Énergétique est pensé pour le mobile. Retrouve-le sur ton téléphone.",
    };
  }

  return {
    supported: true,
    mode: input.hasXR ? "webxr" : "camera",
    isMobile,
  };
}
