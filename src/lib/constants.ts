export const KAIA_SLUG = "kaia";
export const KAIA_NAME = "KAÏA";
export const KAIA_DOMAIN = "kaia.purama.dev";
export const KAIA_URL = "https://kaia.purama.dev";

export const SUPER_ADMIN_EMAIL = "matiss.frasne@gmail.com";
export const ADMIN_EMAIL = "matiss.frasne@gmail.com";

export const TOKENS_TO_EUR = 0.01;
export const EUR_TO_TOKENS = 100;
export const DAILY_TOKEN_CAP = 200;

export const WALLET_MIN_WITHDRAWAL_EUR = 20;
export const WALLET_MAX_WITHDRAWAL_EUR = 1000;

export const TRIAL_DAYS = 14;

export const CPA_KAIA_EUR = 115;
export const RETRACTION_DAYS = 30;
export const KARMA_COMMISSION_PCT = 9;
export const JACKPOT_TERRE_CAP_EUR = 25_000;
export const GRAINE_TO_EUR = 0.01;

export const PRIME_AMOUNTS = {
  j1: 25_00,
  j30: 25_00,
  j60: 50_00,
} as const;

export const VITAE_PLAN_KEYS = {
  ESSENTIEL: "essentiel",
  INFINI: "infini",
  LEGENDE: "legende",
} as const;
export type VitaePlanKey = (typeof VITAE_PLAN_KEYS)[keyof typeof VITAE_PLAN_KEYS];

export const VITAE_MULTIPLIERS: Record<VitaePlanKey, number> = {
  essentiel: 1,
  infini: 5,
  legende: 10,
};

export const PURITY_LEVELS = ["aube", "croissant", "pleine", "sagesse"] as const;
export type PurityLevel = (typeof PURITY_LEVELS)[number];

export const AURORA_LEVELS = ["brume", "onde", "aura", "polaris"] as const;
export type AuroraLevel = (typeof AURORA_LEVELS)[number];

export const KAIA_PALETTE = {
  night: "#0D0D1A",
  moon: "#C8B9F0",
  gold: "#E8C87A",
  rose: "#F0B0C0",
  nature: "#1A2D1A",
} as const;

export const PLAN_KEYS = {
  FREE: "free",
  ESSENTIEL: "essentiel",
  INFINI: "infini",
  LEGENDE: "legende",
  CANCELED: "canceled",
} as const;

export const COMPANY_INFO = {
  name: "SASU PURAMA",
  address: "8 Rue de la Chapelle, 25560 Frasne, France",
  vatRegime: "Art. 293 B (franchise en base de TVA)",
  rcs: "Besançon",
};

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
  "prescris",
  "ordonnance",
  "posologie",
  "dosage",
  "dose",
  "contre-indication",
  "effets secondaires",
  "side effects",
  "drug",
  "antibiotic",
  "antibiotique",
  "antidépresseur",
  "antidepressant",
  "analgésique",
  "analgesic",
  "painkiller",
  "sédatif",
  "sedative",
  "anxiolytique",
  "anxiolytic",
  "hormones synthétiques",
  "pilule contraceptive",
  "traitement hormonal",
  "thérapie hormonale",
  "chirurgie",
  "surgery",
  "opération",
  "biopsie",
  "biopsy",
  "examens médicaux",
  "analyse sanguine",
  "blood test",
  "IRM",
  "scanner",
  "radiographie",
  "x-ray",
  "urgences",
  "emergency",
] as const;

export const FORBIDDEN_REWARDS_KEYWORDS = [
  "rate on store",
  "rate the app",
  "review on app store",
  "review on play store",
  "note l'app",
  "note sur store",
] as const;
