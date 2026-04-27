/**
 * Cookie tracking PARRAINAGE (P6).
 *  - Nom : `kaia_ref`
 *  - Stocke : referral_code (déjà dans `profiles.referral_code` du parrain)
 *  - Durée : 30 jours
 *  - Lu par /api/stripe/checkout pour ajouter `referral_code` à `subscription.metadata`
 *    + lu par `/auth/callback` pour insérer `kaia.referrals` à l'inscription.
 */

import type { ResponseCookies } from "next/dist/server/web/spec-extension/cookies";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const REFERRAL_COOKIE_NAME = "kaia_ref";
export const REFERRAL_COOKIE_TTL_DAYS = 30;
const COOKIE_MAX_AGE_SECONDS = REFERRAL_COOKIE_TTL_DAYS * 24 * 60 * 60;

export interface ReferralCookieValue {
  /** `profiles.referral_code` du parrain. */
  code: string;
  clickedAt: string;
}

export function serializeReferralCookie(value: ReferralCookieValue): string {
  return `${value.code}|${value.clickedAt}`;
}

export function parseReferralCookie(raw: string | undefined | null): ReferralCookieValue | null {
  if (!raw) return null;
  const parts = raw.split("|");
  if (parts.length !== 2) return null;
  const [code, clickedAt] = parts;
  if (!code || code.length < 4 || code.length > 32) return null;
  if (!/^[a-zA-Z0-9-]+$/.test(code)) return null;
  const clickedTs = Date.parse(clickedAt);
  if (Number.isNaN(clickedTs)) return null;
  if (Date.now() - clickedTs > COOKIE_MAX_AGE_SECONDS * 1000) return null;
  return { code, clickedAt };
}

export const REFERRAL_COOKIE_OPTIONS = {
  maxAge: COOKIE_MAX_AGE_SECONDS,
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

export function readReferralCookie(
  cookieStore: ReadonlyRequestCookies | { get: (name: string) => { value: string } | undefined }
): ReferralCookieValue | null {
  const c = cookieStore.get(REFERRAL_COOKIE_NAME);
  return parseReferralCookie(c?.value);
}

export function writeReferralCookie(cookies: ResponseCookies, value: ReferralCookieValue): void {
  cookies.set(REFERRAL_COOKIE_NAME, serializeReferralCookie(value), REFERRAL_COOKIE_OPTIONS);
}

export function clearReferralCookie(cookies: ResponseCookies): void {
  cookies.set(REFERRAL_COOKIE_NAME, "", { ...REFERRAL_COOKIE_OPTIONS, maxAge: 0 });
}
