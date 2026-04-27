/**
 * KAÏA — i18n locales (35 langues, BRIEF §16)
 *
 * Cookie-based locale switching (pas de [locale] segment routing pour préserver
 * les routes existantes). Détection auto navigator.language au signup, override
 * manuel via /dashboard/settings/language.
 */

export const SUPPORTED_LOCALES = [
  // Top 5 (humain-revus, qualité maximale)
  "fr",
  "en",
  "es",
  "ar",
  "zh",
  // Europe
  "de",
  "it",
  "pt",
  "nl",
  "pl",
  "sv",
  "no",
  "da",
  "fi",
  "el",
  "ro",
  "hu",
  "cs",
  "uk",
  "ru",
  // Asie
  "ja",
  "ko",
  "hi",
  "bn",
  "id",
  "vi",
  "th",
  "tr",
  // Moyen-Orient + Afrique
  "fa",
  "he",
  "ur",
  "sw",
  // Amériques
  "pt-BR",
  "es-MX",
  // Asie supplémentaire
  "tl",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_COOKIE = "kaia_locale";

/** Locales nécessitant l'écriture droite-à-gauche (CSS logical properties + dir="rtl"). */
export const RTL_LOCALES: Locale[] = ["ar", "fa", "he", "ur"];

/** Mapping locale → label natif affiché dans le sélecteur. */
export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  ar: "العربية",
  zh: "中文",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  sv: "Svenska",
  no: "Norsk",
  da: "Dansk",
  fi: "Suomi",
  el: "Ελληνικά",
  ro: "Română",
  hu: "Magyar",
  cs: "Čeština",
  uk: "Українська",
  ru: "Русский",
  ja: "日本語",
  ko: "한국어",
  hi: "हिन्दी",
  bn: "বাংলা",
  id: "Bahasa Indonesia",
  vi: "Tiếng Việt",
  th: "ไทย",
  tr: "Türkçe",
  fa: "فارسی",
  he: "עברית",
  ur: "اردو",
  sw: "Kiswahili",
  "pt-BR": "Português (Brasil)",
  "es-MX": "Español (México)",
  tl: "Filipino",
};

/** Mapping locale → BCP-47 (utilisé pour Web Speech API + html lang attribute). */
export const BCP47_MAP: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  ar: "ar-SA",
  zh: "zh-CN",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
  nl: "nl-NL",
  pl: "pl-PL",
  sv: "sv-SE",
  no: "no-NO",
  da: "da-DK",
  fi: "fi-FI",
  el: "el-GR",
  ro: "ro-RO",
  hu: "hu-HU",
  cs: "cs-CZ",
  uk: "uk-UA",
  ru: "ru-RU",
  ja: "ja-JP",
  ko: "ko-KR",
  hi: "hi-IN",
  bn: "bn-BD",
  id: "id-ID",
  vi: "vi-VN",
  th: "th-TH",
  tr: "tr-TR",
  fa: "fa-IR",
  he: "he-IL",
  ur: "ur-PK",
  sw: "sw-KE",
  "pt-BR": "pt-BR",
  "es-MX": "es-MX",
  tl: "tl-PH",
};

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Sélectionne la locale supportée la plus proche depuis Accept-Language.
 * Fallback DEFAULT_LOCALE si aucune correspondance.
 */
export function pickLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const candidates = acceptLanguage
    .split(",")
    .map((entry) => {
      const [tag, qPart] = entry.trim().split(";");
      const quality = qPart?.startsWith("q=") ? Number.parseFloat(qPart.slice(2)) : 1;
      return { tag: tag.toLowerCase(), quality: Number.isFinite(quality) ? quality : 0 };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of candidates) {
    // Exact match (e.g. pt-br → pt-BR)
    const exact = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === tag);
    if (exact) return exact;
    // Primary tag match (e.g. de-AT → de)
    const primary = tag.split("-")[0];
    const primaryMatch = SUPPORTED_LOCALES.find((l) => l === primary);
    if (primaryMatch) return primaryMatch;
  }

  return DEFAULT_LOCALE;
}
