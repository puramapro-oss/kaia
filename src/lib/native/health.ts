/**
 * Santé native — abstraction HealthKit (iOS) + Health Connect (Android) via
 * Capacitor. JAMAIS Terra API (obsolète, payant — résolution 21/04/2026).
 *
 * Le plugin natif de santé n'est branché que dans le build natif. Hors natif
 * (web) ou si le plugin est absent → no-op gracieux `{ available:false, reason }`
 * (jamais d'écran cassé). Le mapping brut → normalisé est pur (testable).
 */
import { isNative } from "@/lib/native/capacitor-detect";

export interface CycleHealthData {
  /** Intensité de flux menstruel 0-4 (HKCategoryValueMenstrualFlow / Health Connect). */
  menstrualFlow: number | null;
  /** Résultat test d'ovulation (positif/négatif/indeterminé). */
  ovulationPositive: boolean | null;
}

export interface WellnessHealthData {
  mindfulMinutes: number;
  /** Variabilité de fréquence cardiaque (ms), indicateur de récupération. */
  hrvMs: number | null;
}

export interface HealthResult<T> {
  available: boolean;
  data: T | null;
  reason?: string;
}

/** Échantillon brut renvoyé par le plugin natif (forme minimale commune). */
export interface RawHealthSample {
  type: string;
  value: number;
  unit?: string;
}

/** Mapping pur des échantillons bruts → données cycle normalisées. */
export function normalizeCycleSamples(samples: RawHealthSample[]): CycleHealthData {
  const flow = samples.find((s) => s.type === "menstrualFlow");
  const ovulation = samples.find((s) => s.type === "ovulationTestResult");
  return {
    menstrualFlow: flow ? Math.max(0, Math.min(4, Math.round(flow.value))) : null,
    ovulationPositive: ovulation ? ovulation.value > 0 : null,
  };
}

/** Mapping pur des échantillons bruts → données bien-être normalisées. */
export function normalizeWellnessSamples(samples: RawHealthSample[]): WellnessHealthData {
  const mindful = samples.filter((s) => s.type === "mindfulSession").reduce((sum, s) => sum + s.value, 0);
  const hrv = samples.find((s) => s.type === "heartRateVariability");
  return {
    mindfulMinutes: Math.round(mindful),
    hrvMs: hrv ? Math.round(hrv.value) : null,
  };
}

/** Chargement dynamique du plugin santé (absent hors build natif → null). */
async function loadHealthPlugin(): Promise<{ query: (opts: unknown) => Promise<{ samples: RawHealthSample[] }> } | null> {
  if (!(await isNative())) return null;
  if (process.env.NEXT_PUBLIC_ENABLE_HEALTH !== "true") return null;
  try {
    // @ts-expect-error — plugin résolu uniquement dans le build natif.
    const mod = await import("capacitor-health");
    return mod?.Health ?? null;
  } catch {
    return null;
  }
}

const UNAVAILABLE = "Connexion à Apple Santé / Health Connect disponible dans l'app mobile.";

/** Charge le plugin, interroge les `types` puis normalise — déféré gracieux sinon. */
async function queryHealth<T>(
  types: string[],
  dateISO: string,
  normalize: (samples: RawHealthSample[]) => T
): Promise<HealthResult<T>> {
  const plugin = await loadHealthPlugin();
  if (!plugin) return { available: false, data: null, reason: UNAVAILABLE };
  try {
    const { samples } = await plugin.query({ types, date: dateISO });
    return { available: true, data: normalize(samples) };
  } catch {
    return { available: false, data: null, reason: UNAVAILABLE };
  }
}

export function importCycleHealth(dateISO: string): Promise<HealthResult<CycleHealthData>> {
  return queryHealth(["menstrualFlow", "ovulationTestResult"], dateISO, normalizeCycleSamples);
}

export function importWellnessHealth(dateISO: string): Promise<HealthResult<WellnessHealthData>> {
  return queryHealth(["mindfulSession", "heartRateVariability"], dateISO, normalizeWellnessSamples);
}
