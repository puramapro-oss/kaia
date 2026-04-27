/**
 * Admin auth helpers — PIN bcrypt + TOTP 2FA + session cookie HttpOnly.
 *
 * Flow d'authentification (côté serveur) :
 *  1. User connecté Supabase + email autorisé (`isAdminEmail`) → peut accéder à /admin/login
 *  2. Step 1 : PIN bcrypt vérifié → délivre cookie temporaire (5 min) demandant TOTP
 *  3. Step 2 : code TOTP vérifié (otplib) → crée admin_session (8h) + cookie signé HttpOnly
 *  4. Middleware admin-only vérifie que la session est valide ET non révoquée
 *
 * Le compte super-admin Tissma (matiss.frasne@gmail.com) doit faire un setup
 * initial via /admin/setup.
 */
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { generateSecret, generateURI, verify } from "otplib";
import { ADMIN_EMAIL } from "@/lib/constants";

export const ADMIN_SESSION_COOKIE = "kaia_admin_session";
export const ADMIN_PRE2FA_COOKIE = "kaia_admin_pre2fa";
export const ADMIN_SESSION_TTL_HOURS = 8;
const PIN_BCRYPT_COST = 12;

/**
 * Liste blanche d'emails admin. Pour l'instant : super-admin uniquement.
 * À élargir via env var KAIA_ADMIN_EMAILS_EXTRA si besoin.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true;
  const extra = (process.env.KAIA_ADMIN_EMAILS_EXTRA ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return extra.includes(email.toLowerCase());
}

export async function hashPin(pin: string): Promise<string> {
  if (!/^\d{4,8}$/.test(pin)) {
    throw new Error("PIN doit faire 4 à 8 chiffres.");
  }
  return bcrypt.hash(pin, PIN_BCRYPT_COST);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  if (!pin || !hash) return false;
  return bcrypt.compare(pin, hash).catch(() => false);
}

export function generateTotpSecret(): string {
  return generateSecret();
}

export function totpUri(secret: string, accountName: string): string {
  return generateURI({
    label: accountName,
    issuer: "KAÏA Admin",
    secret,
  });
}

export async function verifyTotp(token: string, secret: string): Promise<boolean> {
  if (!token || !secret) return false;
  try {
    const result = await verify({ token, secret });
    if (!("valid" in result)) return false;
    return result.valid === true;
  } catch {
    return false;
  }
}

export function generateSessionToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashSessionToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateRecoveryCodes(count: number = 8): string[] {
  return Array.from({ length: count }, () =>
    randomBytes(5).toString("hex").toUpperCase().match(/.{1,5}/g)!.join("-")
  );
}
