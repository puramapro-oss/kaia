/**
 * URSSAF — stub de Tierce Déclaration (déclaration des revenus complémentaires
 * pour le compte de l'utilisatrice). Réservé à une phase ultérieure : ici on
 * expose seulement l'estimation des cotisations micro-BNC pour information.
 *
 * Taux micro-BNC (prestations BNC) ~22% du CA en 2026 (indicatif, hors options).
 */

export const MICRO_BNC_CONTRIBUTION_RATE = 0.22;

export interface UrssafEstimate {
  ratePct: number;
  contributionCents: number;
}

/** Estimation indicative des cotisations URSSAF micro-BNC sur un CA donné. */
export function estimateUrssafContribution(grossCents: number): UrssafEstimate {
  const base = Math.max(0, Math.round(grossCents));
  return {
    ratePct: MICRO_BNC_CONTRIBUTION_RATE * 100,
    contributionCents: Math.round(base * MICRO_BNC_CONTRIBUTION_RATE),
  };
}
