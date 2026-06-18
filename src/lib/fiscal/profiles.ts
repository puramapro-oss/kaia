/**
 * Module fiscal — détection du profil fiscal et récapitulatif annuel des revenus
 * KAÏA (KARMA + primes + parrainage). Informationnel uniquement, jamais un
 * conseil fiscal personnalisé. Fonctions pures.
 */

export type FiscalProfileKey =
  | "etudiant"
  | "salarie_standard"
  | "freelance_ae"
  | "salarie_portage";

export type EmploymentStatus = "student" | "employee" | "freelance" | "portage" | "other";

export interface FiscalProfile {
  key: FiscalProfileKey;
  label: string;
  description: string;
  /** Régime des revenus complémentaires KAÏA. */
  revenueRegime: string;
}

export const FISCAL_PROFILES: Record<FiscalProfileKey, FiscalProfile> = {
  etudiant: {
    key: "etudiant",
    label: "Étudiant·e",
    description: "Revenus complémentaires modestes, souvent rattachés au foyer fiscal.",
    revenueRegime: "Micro-BNC (abattement 34%) si dépassement du seuil de non-déclaration.",
  },
  salarie_standard: {
    key: "salarie_standard",
    label: "Salarié·e",
    description: "Revenu principal salarié, KAÏA en complément à déclarer.",
    revenueRegime: "BNC non professionnels — à reporter sur la déclaration annuelle.",
  },
  freelance_ae: {
    key: "freelance_ae",
    label: "Auto-entrepreneur·e",
    description: "Activité indépendante déclarée, KAÏA intégrable au chiffre d'affaires.",
    revenueRegime: "Micro-BNC (abattement 34%) + cotisations URSSAF.",
  },
  salarie_portage: {
    key: "salarie_portage",
    label: "Salarié·e porté·e",
    description: "Activité via société de portage salarial.",
    revenueRegime: "Salaire porté — frais de gestion société de portage.",
  },
};

export interface ProfileInput {
  isStudent?: boolean;
  employmentStatus?: EmploymentStatus;
}

/** Détecte le profil fiscal par défaut à partir du statut déclaré. */
export function detectFiscalProfile(input: ProfileInput): FiscalProfile {
  if (input.isStudent || input.employmentStatus === "student") return FISCAL_PROFILES.etudiant;
  if (input.employmentStatus === "freelance") return FISCAL_PROFILES.freelance_ae;
  if (input.employmentStatus === "portage") return FISCAL_PROFILES.salarie_portage;
  return FISCAL_PROFILES.salarie_standard;
}

export interface RevenueInput {
  karmaCents: number;
  primesCents: number;
  referralCents: number;
}

export interface RevenueSummary {
  karmaCents: number;
  primesCents: number;
  referralCents: number;
  totalCents: number;
  /** Base imposable estimée en micro-BNC (abattement 34%). */
  microBncTaxableCents: number;
}

const MICRO_BNC_ALLOWANCE = 0.34;

/** Récapitulatif annuel des revenus KAÏA + base imposable micro-BNC estimée. */
export function summarizeAnnualRevenue(input: RevenueInput): RevenueSummary {
  const karma = Math.max(0, Math.round(input.karmaCents));
  const primes = Math.max(0, Math.round(input.primesCents));
  const referral = Math.max(0, Math.round(input.referralCents));
  const total = karma + primes + referral;
  return {
    karmaCents: karma,
    primesCents: primes,
    referralCents: referral,
    totalCents: total,
    microBncTaxableCents: Math.round(total * (1 - MICRO_BNC_ALLOWANCE)),
  };
}
