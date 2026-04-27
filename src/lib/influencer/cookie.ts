/**
 * Cookie tracking INFLUENCEUR (P6).
 * - Nom : `kaia_inf`
 * - Stocke : link.id (UUID) + link.code (debug)
 * - Durée : 30 jours
 * - Scope : path=/, sameSite=Lax, httpOnly=true, secure en prod
 *
 * Lu côté serveur :
 *  - dans `/api/stripe/checkout` → ajoute `influencer_link_id` à `subscription.metadata`
 *  - dans `/auth/callback` (signup) → enregistre la conversion en attente
 */

import type { ResponseCookies } from "next/dist/server/web/spec-extension/cookies";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const INFLUENCER_COOKIE_NAME = "kaia_inf";
export const INFLUENCER_COOKIE_TTL_DAYS = 30;

export interface InfluencerCookieValue {
  /** UUID de `kaia.influencer_links.id`. */
  linkId: string;
  /** Code en clair pour debug + analytics côté client. */
  code: string;
  /** Timestamp ISO du clic initial (utilisé pour la fenêtre 30 j). */
  clickedAt: string;
}

const COOKIE_MAX_AGE_SECONDS = INFLUENCER_COOKIE_TTL_DAYS * 24 * 60 * 60;

/**
 * Sérialise la valeur cookie. Format pipe-séparé pour rester < 256 bytes.
 *  `<linkId>|<code>|<clickedAtIso>`
 */
export function serializeInfluencerCookie(value: InfluencerCookieValue): string {
  return `${value.linkId}|${value.code}|${value.clickedAt}`;
}

/** Parse, retourne null si format invalide ou cookie expiré côté logic. */
export function parseInfluencerCookie(raw: string | undefined | null): InfluencerCookieValue | null {
  if (!raw) return null;
  const parts = raw.split("|");
  if (parts.length !== 3) return null;
  const [linkId, code, clickedAt] = parts;
  if (!linkId || !code || !clickedAt) return null;
  // Sanity check UUID v4-ish
  if (!/^[0-9a-f-]{32,36}$/i.test(linkId)) return null;
  // 30 j window
  const clickedTs = Date.parse(clickedAt);
  if (Number.isNaN(clickedTs)) return null;
  const ageMs = Date.now() - clickedTs;
  if (ageMs > COOKIE_MAX_AGE_SECONDS * 1000) return null;
  return { linkId, code, clickedAt };
}

/** Helpers pour Next.js Server Components / Route Handlers. */
export interface CookieSetOptions {
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  httpOnly?: boolean;
  secure?: boolean;
}

export const INFLUENCER_COOKIE_OPTIONS: Required<CookieSetOptions> = {
  maxAge: COOKIE_MAX_AGE_SECONDS,
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

/** Lit le cookie depuis `cookies()` (App Router). */
export function readInfluencerCookie(
  cookieStore: ReadonlyRequestCookies | { get: (name: string) => { value: string } | undefined }
): InfluencerCookieValue | null {
  const c = cookieStore.get(INFLUENCER_COOKIE_NAME);
  return parseInfluencerCookie(c?.value);
}

/** Set le cookie sur une `NextResponse` (route handler `/i/[code]`). */
export function writeInfluencerCookie(
  cookies: ResponseCookies,
  value: InfluencerCookieValue
): void {
  cookies.set(INFLUENCER_COOKIE_NAME, serializeInfluencerCookie(value), INFLUENCER_COOKIE_OPTIONS);
}

/** Clear (utilisé au signup post-conversion pour ne pas réutiliser). */
export function clearInfluencerCookie(cookies: ResponseCookies): void {
  cookies.set(INFLUENCER_COOKIE_NAME, "", { ...INFLUENCER_COOKIE_OPTIONS, maxAge: 0 });
}
