/**
 * Génération + validation de codes influenceur (P6).
 *
 * Format : `<base ASCII slug 3-12 chars><suffix random 4 chars>` en MAJUSCULES.
 * Exemples : `TISSMA50WK`, `LUNAA9F2`.
 *
 * La RPC SQL `kaia.create_influencer_link` fait la même normalisation côté DB
 * et garantit l'unicité — ces fonctions servent à la validation côté front
 * + aux tests Vitest (TS pur).
 */

const SLUG_BLOCKED_PATTERN = /[^A-Z0-9]/g;
const MIN_LEN = 3;
const MAX_LEN = 16;
const SUFFIX_LEN = 4;

/**
 * Slugifie un nom (espaces, accents, caractères spéciaux → uppercase ASCII).
 * Retourne `""` si rien d'utilisable (caller doit fallback).
 */
export function slugifyForCode(input: string): string {
  if (!input) return "";
  // Normalise les accents → décompose puis enlève les diacritiques
  const ascii = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const upper = ascii.toUpperCase().replace(SLUG_BLOCKED_PATTERN, "");
  return upper.slice(0, 12);
}

/** Génère un suffix random hex 4 chars en uppercase. */
export function randomSuffix(rng: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < SUFFIX_LEN; i++) {
    const n = Math.floor(rng() * 16);
    out += n.toString(16).toUpperCase();
  }
  return out;
}

/**
 * Compose un code à partir d'un base + suffix.
 * Si base trop court (< 3) → fallback `KAIA`.
 */
export function composeCode(baseSlug: string, suffix: string): string {
  const base = baseSlug.length >= MIN_LEN ? baseSlug : "KAIA";
  return (base + suffix).slice(0, MAX_LEN);
}

/** Validation format pour user-facing input. */
export function isValidCodeFormat(code: string): boolean {
  if (typeof code !== "string") return false;
  if (code.length < MIN_LEN || code.length > MAX_LEN) return false;
  return /^[A-Z0-9]+$/.test(code);
}

/** Génère un code complet à partir d'un nom (pour preview UI uniquement). */
export function previewCodeFor(fullName: string, rng: () => number = Math.random): string {
  return composeCode(slugifyForCode(fullName), randomSuffix(rng));
}
