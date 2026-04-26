/**
 * Helpers d'agrégation pour /impact et /universe.
 * Pas de business logic spécifique — juste des fonctions pures pour normaliser les données DB.
 */

export interface ImpactCounters {
  treesPlanted: number;
  wasteCollectedKg: number;
  peopleHelped: number;
  waterSavedL: number;
  eurosRedistributed: number;
  totalCo2AvoidedKg: number;
}

export const ZERO_IMPACT: ImpactCounters = {
  treesPlanted: 0,
  wasteCollectedKg: 0,
  peopleHelped: 0,
  waterSavedL: 0,
  eurosRedistributed: 0,
  totalCo2AvoidedKg: 0,
};

export interface ImpactRow {
  trees_planted?: number | null;
  waste_collected_kg?: number | string | null;
  people_helped?: number | null;
  water_saved_l?: number | string | null;
  euros_redistributed?: number | string | null;
  total_co2_avoided_kg?: number | string | null;
  routines_completed?: number | null;
  active_users_30d?: number | null;
}

const toNumber = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export function readImpact(row: ImpactRow | null | undefined): ImpactCounters {
  if (!row) return ZERO_IMPACT;
  return {
    treesPlanted: toNumber(row.trees_planted),
    wasteCollectedKg: toNumber(row.waste_collected_kg),
    peopleHelped: toNumber(row.people_helped),
    waterSavedL: toNumber(row.water_saved_l),
    eurosRedistributed: toNumber(row.euros_redistributed),
    totalCo2AvoidedKg: toNumber(row.total_co2_avoided_kg),
  };
}

export function readGlobalExtras(
  row: ImpactRow | null | undefined,
): { routinesCompleted: number; activeUsers30d: number } {
  return {
    routinesCompleted: row?.routines_completed ?? 0,
    activeUsers30d: row?.active_users_30d ?? 0,
  };
}

/**
 * 4 axes d'éveil (BRIEF §5.5). Chaque axe a une progression 0-100% qu'on dérive
 * des compteurs DB de manière déterministe — pas de magie.
 */
export type AwakeningAxis = "conscience" | "sante" | "savoir" | "liberte";

export interface AxisProgress {
  axis: AwakeningAxis;
  labelFr: string;
  description: string;
  pct: number; // 0-100
  hint: string;
}

export interface AxisInputs {
  practicesCount: number;
  meditationCount: number;
  breathingCount: number;
  learningCount: number;
  reprogrammingCount: number;
  movementCount: number;
  streakDays: number;
  awakeningLevel: number;
}

const cap = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function computeAxes(input: AxisInputs): AxisProgress[] {
  // Pondérations volontairement simples — chaque axe vise ~50 actes pour 100%.
  const conscience = cap(((input.meditationCount + input.reprogrammingCount) / 50) * 100);
  const sante = cap(((input.breathingCount + input.movementCount) / 50) * 100);
  const savoir = cap((input.learningCount / 30) * 100);
  const liberte = cap(((input.streakDays * 2 + input.awakeningLevel * 5) / 100) * 100);

  return [
    {
      axis: "conscience",
      labelFr: "Conscience",
      description: "Méditations + reprogrammation.",
      pct: conscience,
      hint: "Pratiques d'attention et d'affirmation.",
    },
    {
      axis: "sante",
      labelFr: "Santé",
      description: "Respiration + mouvement.",
      pct: sante,
      hint: "Souffle, corps, régulation.",
    },
    {
      axis: "savoir",
      labelFr: "Savoir",
      description: "Apprentissages.",
      pct: savoir,
      hint: "Petites idées, posées.",
    },
    {
      axis: "liberte",
      labelFr: "Liberté",
      description: "Streak + niveau d'éveil.",
      pct: liberte,
      hint: "Régularité + intériorité.",
    },
  ];
}
