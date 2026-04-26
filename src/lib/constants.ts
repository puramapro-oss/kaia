export const KAIA_SLUG = "kaia";
export const KAIA_NAME = "KAÏA";
export const KAIA_DOMAIN = "kaia.purama.dev";
export const KAIA_URL = "https://kaia.purama.dev";

export const SUPER_ADMIN_EMAIL = "matiss.frasne@gmail.com";
export const ADMIN_EMAIL = "tissma@purama.dev";

export const TOKENS_TO_EUR = 0.01;
export const EUR_TO_TOKENS = 100;
export const DAILY_TOKEN_CAP = 200;

export const WALLET_MIN_WITHDRAWAL_EUR = 5;
export const WALLET_MAX_WITHDRAWAL_EUR = 1000;

export const TRIAL_DAYS = 14;

export const PRICE_MONTHLY_EUR = 14.99;
export const PRICE_YEARLY_EUR = 125.91;
export const PRICE_YEARLY_DISCOUNT_PCT = 30;

export const PLAN_KEYS = {
  FREE: "free",
  ACTIVE: "active",
  CANCELED: "canceled",
} as const;

export const TIERS = ["bronze", "silver", "gold", "platinum", "diamond", "legend"] as const;

export const COMPANY_INFO = {
  name: "SASU PURAMA",
  address: "8 Rue de la Chapelle, 25560 Frasne, France",
  vatRegime: "Art. 293 B (franchise en base de TVA)",
  rcs: "Besançon",
};

export const KAIA_PALETTE = {
  greenDeep: "#1A4D3A",
  sand: "#E8DCC4",
  goldenSky: "#F4C430",
  terracotta: "#D4906A",
  ivory: "#FFFEF7",
  accent: "#06B6D4",
  bgDark: "#0A0A0F",
} as const;

export const SUPPORTED_LOCALES = ["fr", "en", "es", "ar", "zh"] as const;
export const DEFAULT_LOCALE = "fr";
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const RTL_LOCALES = ["ar", "fa", "he", "ur"] as const;

export const MEDICAL_CLAIMS_BLOCKLIST = [
  "soigner",
  "guérir",
  "guerir",
  "traiter",
  "diagnostiquer",
  "remède",
  "remede",
  "prescription",
  "médicament",
  "medicament",
  "thérapie médicale",
  "cure",
  "heal",
  "treat",
  "diagnose",
  "medication",
] as const;

export const FORBIDDEN_REWARDS_KEYWORDS = [
  "rate on store",
  "rate the app",
  "review on app store",
  "review on play store",
  "note l'app",
  "note sur store",
] as const;
