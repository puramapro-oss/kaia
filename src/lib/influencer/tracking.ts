/**
 * Hashing IP/UA anonymisé pour analytics influenceurs (P6).
 *
 *  - On NE stocke JAMAIS l'IP en clair (RGPD)
 *  - sha256(IP + salt) → 64 hex chars
 *  - sha256(UA) → 64 hex chars
 *
 * Le salt est `KAIA_ANALYTICS_SALT` (env var). Si absent → fallback constant
 * (déploiement de dev seulement, log un warning serveur).
 */

import { createHash } from "node:crypto";

let warned = false;
function getSalt(): string {
  const env = process.env.KAIA_ANALYTICS_SALT;
  if (env && env.length >= 8) return env;
  if (!warned) {
    warned = true;
    console.warn(
      "[KAIA] KAIA_ANALYTICS_SALT manquant ou trop court — fallback dev. À fixer en prod."
    );
  }
  return "kaia-default-dev-salt-change-me";
}

/** Renvoie sha256 hex truncé à 32 chars (suffisant pour analytics). */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const cleaned = ip.split(",")[0]?.trim();
  if (!cleaned) return null;
  return createHash("sha256").update(`${cleaned}:${getSalt()}`).digest("hex").slice(0, 32);
}

export function hashUserAgent(ua: string | null | undefined): string | null {
  if (!ua) return null;
  return createHash("sha256").update(ua).digest("hex").slice(0, 32);
}

/** Extrait l'IP depuis les headers Vercel/Next. */
export function extractIpFromHeaders(headers: Headers): string | null {
  return (
    headers.get("x-forwarded-for") ??
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    null
  );
}

/** Extrait l'ISO country depuis les headers Vercel (`x-vercel-ip-country`). */
export function extractCountryFromHeaders(headers: Headers): string | null {
  const cc = headers.get("x-vercel-ip-country");
  if (cc && /^[A-Z]{2}$/.test(cc)) return cc;
  return null;
}
