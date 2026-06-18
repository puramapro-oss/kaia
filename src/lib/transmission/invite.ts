/**
 * Transmission Mères / Filles — invitation par lien d'un espace partagé
 * intergénérationnel (journal commun, rituels, questions de LUNA).
 *
 * Le lien encode un token opaque (généré côté serveur) + le rôle invité.
 * Si l'invitée a ≥ 50 ans, elle peut accéder en "web view only" sans créer
 * de compte (lecture + contribution légère via le token). Fonctions pures :
 * le `now` et le token aléatoire sont fournis par l'appelant.
 */

export const TRANSMISSION_INVITE_VERSION = 1;
/** Durée de validité d'un lien d'invitation (jours). */
export const INVITE_TTL_DAYS = 30;
export const INVITE_TTL_MS = INVITE_TTL_DAYS * 24 * 60 * 60 * 1000;

export type TransmissionRole = "fille" | "mere";

export interface TransmissionInvite {
  v: number;
  spaceId: string;
  /** Token opaque (aléatoire) servant de secret partagé du lien. */
  token: string;
  role: TransmissionRole;
  /** Accès sans compte (web view) — réservé aux invitées ≥ 50 ans. */
  guestAllowed: boolean;
  /** Epoch ms d'émission. */
  issuedAt: number;
}

export interface BuildInviteArgs {
  spaceId: string;
  token: string;
  role: TransmissionRole;
  inviteeAge?: number;
  issuedAt: number;
}

/** Seuil d'âge au-delà duquel l'accès web sans compte est autorisé. */
export const GUEST_ACCESS_MIN_AGE = 50;

export function buildInvite(args: BuildInviteArgs): TransmissionInvite {
  return {
    v: TRANSMISSION_INVITE_VERSION,
    spaceId: args.spaceId,
    token: args.token,
    role: args.role,
    guestAllowed:
      args.role === "mere" &&
      typeof args.inviteeAge === "number" &&
      args.inviteeAge >= GUEST_ACCESS_MIN_AGE,
    issuedAt: args.issuedAt,
  };
}

/** Construit le chemin relatif du lien d'invitation (à préfixer par l'origine). */
export function invitePath(invite: TransmissionInvite): string {
  const params = new URLSearchParams({
    s: invite.spaceId,
    t: invite.token,
    r: invite.role,
  });
  return `/cycle/transmission/rejoindre?${params.toString()}`;
}

/** Parse les paramètres d'un lien d'invitation ; null si incomplet. */
export function parseInviteParams(params: URLSearchParams): {
  spaceId: string;
  token: string;
  role: TransmissionRole;
} | null {
  const spaceId = params.get("s");
  const token = params.get("t");
  const role = params.get("r");
  if (!spaceId || !token || (role !== "fille" && role !== "mere")) return null;
  return { spaceId, token, role };
}

/** Vrai si l'invitation est encore dans sa fenêtre de validité. */
export function isInviteValid(
  invite: TransmissionInvite,
  nowMs: number,
  ttlMs: number = INVITE_TTL_MS
): boolean {
  const age = nowMs - invite.issuedAt;
  return age >= 0 && age <= ttlMs;
}
