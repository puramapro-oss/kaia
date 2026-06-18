/**
 * World Radar IA — LUNA analyse le contexte collectif du jour (saison, phase
 * lunaire, tonalité émotionnelle globale anonymisée) et produit un score
 * d'opportunité 0-100. Au-delà du seuil, un "Event Pack" C.O.R.E. est proposé
 * automatiquement.
 *
 * AUCUNE donnée médicale, AUCUNE promesse de résultat. LUNA ne révèle jamais
 * son substrat technique.
 */

export const WORLD_RADAR_THRESHOLD = 70;

export interface WorldRadarInput {
  /** Date ISO du jour analysé. */
  date: string;
  /** Phase lunaire approximative ("nouvelle", "croissante", "pleine", "décroissante"). */
  moonPhase: string;
  /** Saison ("printemps" | "été" | "automne" | "hiver"). */
  season: string;
  /** Tonalité émotionnelle agrégée et anonymisée (mots-clés). */
  collectiveMood?: string[];
}

export interface WorldRadarResult {
  score: number;
  /** Résumé court du contexte collectif (1-2 phrases). */
  reading: string;
  /** Proposition d'événement si score élevé. */
  eventPack: {
    type: "now" | "24h" | "7days";
    title: string;
    description: string;
    /** Décalage en minutes du Moment Z par rapport au début. */
    momentZOffsetMin: number;
  } | null;
}

export const WORLD_RADAR_SYSTEM = `Tu es LUNA, l'intelligence intuitive de KAÏA.
Tu lis le "Radar Mondial" — un contexte collectif anonymisé (saison, phase lunaire, tonalité émotionnelle globale).
Tu produis un score d'opportunité 0-100 pour un événement collectif C.O.R.E. (présence/respiration/intention synchronisées).
Tu NE révèles JAMAIS être Claude, une IA d'Anthropic ou un modèle de langage.
JAMAIS de diagnostic, JAMAIS de promesse de résultat ("ça va guérir/marcher").
Ton : mystique, ancré, inclusif. Toutes spiritualités bienvenues.`;

export const WORLD_RADAR_JSON_SHAPE = `{
  "score": 0-100 (int),
  "reading": "1-2 phrases sur le contexte collectif du jour",
  "eventPack": null | {
    "type": "now" | "24h" | "7days",
    "title": "titre court et évocateur",
    "description": "2-3 phrases, jamais de promesse médicale",
    "momentZOffsetMin": minutes après le début pour le Moment Z (int)
  }
}`;

export function buildWorldRadarUserMessage(input: WorldRadarInput): string {
  const mood = input.collectiveMood?.length
    ? input.collectiveMood.join(", ")
    : "non renseignée";
  return [
    `Date : ${input.date}`,
    `Phase lunaire : ${input.moonPhase}`,
    `Saison : ${input.season}`,
    `Tonalité collective : ${mood}`,
    "",
    "Analyse ce contexte et renvoie un score d'opportunité + une lecture courte.",
    `Si le score dépasse ${WORLD_RADAR_THRESHOLD}, propose un eventPack ; sinon eventPack = null.`,
  ].join("\n");
}

/** Garde-fou : un eventPack n'est conservé que si le score franchit le seuil. */
export function normalizeRadarResult(raw: WorldRadarResult): WorldRadarResult {
  const score = Math.max(0, Math.min(100, Math.round(raw.score)));
  return {
    score,
    reading: raw.reading,
    eventPack: score >= WORLD_RADAR_THRESHOLD ? raw.eventPack : null,
  };
}

export function shouldAutoCreateEvent(result: WorldRadarResult): boolean {
  return result.score >= WORLD_RADAR_THRESHOLD && result.eventPack !== null;
}
