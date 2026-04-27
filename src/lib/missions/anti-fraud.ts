/**
 * Garde-fous anti-fraude pour les complétions de missions — Phase 1.
 *
 *  - account_age_min : 7 jours min depuis création du compte
 *  - 1 même proof_url ne peut pas valider 2 missions différentes
 *  - max_completions_per_user respecté côté DB
 *  - URL preuve = http(s) only
 */
const ACCOUNT_MIN_AGE_DAYS = 7;
const ALLOWED_DOMAINS_HINT = [
  "instagram.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "youtu.be",
  "facebook.com",
  "fb.com",
  "snapchat.com",
  "pinterest.com",
  "drive.google.com",
  "imgur.com",
  "i.imgur.com",
  "cdn.discordapp.com",
];

export function isAccountAgeOk(createdAt: string | Date): boolean {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  if (Number.isNaN(created.getTime())) return false;
  const ageMs = Date.now() - created.getTime();
  return ageMs >= ACCOUNT_MIN_AGE_DAYS * 86400 * 1000;
}

export const ACCOUNT_AGE_DAYS = ACCOUNT_MIN_AGE_DAYS;

export function isProofUrlValid(url: string): { valid: boolean; reason?: string } {
  if (!url || typeof url !== "string") return { valid: false, reason: "empty" };
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return { valid: false, reason: "non_http_protocol" };
    }
    // On accepte n'importe quel domaine (admin valide visuellement),
    // mais on rejette les URL "javascript:" / "data:" / "file:" / "about:"
    return { valid: true };
  } catch {
    return { valid: false, reason: "invalid_url" };
  }
}

export function isAllowedHintDomain(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return ALLOWED_DOMAINS_HINT.some((d) => u.hostname.endsWith(d));
  } catch {
    return false;
  }
}
