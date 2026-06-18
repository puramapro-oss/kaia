/**
 * Cohérence Collective — score 0-100 reflétant la synchronisation d'un
 * événement C.O.R.E. (proportion de participantes synchronisées au Moment Z,
 * pondérée par la masse critique du groupe).
 *
 * Fonction pure et déterministe.
 */

export interface CoherenceInput {
  /** Participantes ayant confirmé leur sync au Moment Z. */
  syncedCount: number;
  /** Total de participantes inscrites. */
  totalCount: number;
  /** Masse critique à partir de laquelle le groupe est "plein" (défaut 12). */
  criticalMass?: number;
}

/**
 * Cohérence = ratio de synchronisation × facteur de masse.
 * Le facteur de masse récompense les groupes plus nombreux (jusqu'à
 * `criticalMass`) pour éviter qu'un duo 2/2 affiche 100%.
 */
export function computeCoherence(input: CoherenceInput): number {
  const { syncedCount, totalCount, criticalMass = 12 } = input;
  if (totalCount <= 0 || syncedCount <= 0) return 0;

  const ratio = Math.min(1, syncedCount / totalCount);
  const massFactor = Math.min(1, totalCount / criticalMass);
  // 70% sync ratio + 30% masse → un grand groupe partiellement synchro
  // garde une cohérence visible, un duo parfait reste modéré.
  const score = ratio * 0.7 + ratio * massFactor * 0.3;
  return Math.round(score * 100);
}

export type CoherenceTier = "naissante" | "montante" | "rayonnante" | "unifiée";

/** Palier qualitatif pour l'affichage de la jauge. */
export function coherenceTier(score: number): CoherenceTier {
  if (score >= 85) return "unifiée";
  if (score >= 60) return "rayonnante";
  if (score >= 30) return "montante";
  return "naissante";
}
