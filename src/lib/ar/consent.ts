/**
 * Consentement AR — OBLIGATOIRE avant toute session AR Energy Mirror™.
 *
 * Le consentement est matérialisé par un payload signé dans le temps, encodé
 * dans un QR que la participante confirme. Pas de session sans consentement
 * frais et valide. Fonctions pures (le `now` est passé en paramètre).
 */

export const CONSENT_VERSION = 1;
/** Durée de validité d'un consentement (secondes). Au-delà → re-consentement. */
export const CONSENT_TTL_SEC = 600;

export type ARStyle = "A" | "B";

/** Métadonnées d'affichage des 2 styles de miroir (source unique). */
export const AR_STYLES: Record<ARStyle, { title: string; desc: string }> = {
  A: { title: "Silhouette d'Énergie", desc: "Ton aura suit tes mouvements (body-tracking)." },
  B: { title: "Mains de Lumière", desc: "Des mains de lumière guident le geste (hand-tracking)." },
};

export interface ConsentPayload {
  v: number;
  userId: string;
  style: ARStyle;
  protocolSlug: string;
  /** Epoch ms d'émission. */
  issuedAt: number;
}

export interface BuildConsentArgs {
  userId: string;
  style: ARStyle;
  protocolSlug: string;
  issuedAt: number;
}

export function buildConsentPayload(args: BuildConsentArgs): ConsentPayload {
  return {
    v: CONSENT_VERSION,
    userId: args.userId,
    style: args.style,
    protocolSlug: args.protocolSlug,
    issuedAt: args.issuedAt,
  };
}

/** Sérialise le payload pour encodage dans un QR. */
export function encodeConsent(payload: ConsentPayload): string {
  return JSON.stringify(payload);
}

/** Parse un payload de consentement ; renvoie null si malformé ou version inconnue. */
export function parseConsentPayload(raw: string): ConsentPayload | null {
  try {
    const obj = JSON.parse(raw) as Partial<ConsentPayload>;
    if (
      obj.v !== CONSENT_VERSION ||
      typeof obj.userId !== "string" ||
      (obj.style !== "A" && obj.style !== "B") ||
      typeof obj.protocolSlug !== "string" ||
      typeof obj.issuedAt !== "number"
    ) {
      return null;
    }
    return obj as ConsentPayload;
  } catch {
    return null;
  }
}

/** Vrai si le consentement est frais (émis dans la fenêtre TTL et non futur). */
export function isConsentValid(
  payload: ConsentPayload,
  nowMs: number,
  ttlSec: number = CONSENT_TTL_SEC,
): boolean {
  const ageSec = (nowMs - payload.issuedAt) / 1000;
  return ageSec >= 0 && ageSec <= ttlSec;
}
