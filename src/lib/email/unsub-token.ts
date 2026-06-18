/**
 * Token de désinscription email — HMAC-SHA256 signé (pas de stockage requis).
 * Format : base64url(userId).base64url(hmac). Permet une désinscription
 * 1-clic conforme RGPD sans exposer d'autre donnée que l'identifiant.
 */
import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  return process.env.EMAIL_TOKEN_SECRET || process.env.CRON_SECRET || "kaia-dev-unsub-secret";
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sign(userId: string): string {
  return b64url(createHmac("sha256", secret()).update(userId).digest());
}

export function signUnsubToken(userId: string): string {
  return `${b64url(Buffer.from(userId))}.${sign(userId)}`;
}

/** Vérifie le token et renvoie l'userId, ou null si invalide. */
export function verifyUnsubToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  let userId: string;
  try {
    userId = Buffer.from(parts[0].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(userId);
  const a = Buffer.from(parts[1]);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? userId : null;
}
