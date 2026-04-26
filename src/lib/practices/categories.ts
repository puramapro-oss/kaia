/**
 * 7 catégories de pratiques KAÏA — BRIEF §3.4.
 *
 * Chaque catégorie a :
 * - une icône Lucide (string name pour `lucide-react`)
 * - une couleur d'accent dérivée de la palette KAÏA
 * - un slug ambiance nature mappé (`motion-tokens.ts` `natureForPractice`)
 * - un label FR + EN (P5 i18n complet)
 */

import type { NatureSlug } from "@/lib/multisensorial/motion-tokens";

export type PracticeCategory =
  | "meditation"
  | "breathing"
  | "mantra"
  | "mudra"
  | "movement"
  | "learning"
  | "reprogramming";

export interface CategorySpec {
  category: PracticeCategory;
  icon: string;
  accent: string;
  defaultNature: NatureSlug;
  labelFr: string;
  labelEn: string;
  shortFr: string;
}

export const PRACTICE_CATEGORIES: Record<PracticeCategory, CategorySpec> = {
  meditation: {
    category: "meditation",
    icon: "Sparkles",
    accent: "#7C3AED",
    defaultNature: "forest",
    labelFr: "Méditation",
    labelEn: "Meditation",
    shortFr: "Pose, observe, reviens.",
  },
  breathing: {
    category: "breathing",
    icon: "Wind",
    accent: "#06B6D4",
    defaultNature: "ocean",
    labelFr: "Respiration",
    labelEn: "Breathing",
    shortFr: "Inspire, suspend, expire.",
  },
  mantra: {
    category: "mantra",
    icon: "Music2",
    accent: "#F4C430",
    defaultNature: "mountain",
    labelFr: "Mantra",
    labelEn: "Mantra",
    shortFr: "Une phrase, encore et encore.",
  },
  mudra: {
    category: "mudra",
    icon: "Hand",
    accent: "#D4906A",
    defaultNature: "savanna",
    labelFr: "Mudra",
    labelEn: "Mudra",
    shortFr: "Le geste, simple.",
  },
  movement: {
    category: "movement",
    icon: "Activity",
    accent: "#1A4D3A",
    defaultNature: "waterfall",
    labelFr: "Mouvement",
    labelEn: "Movement",
    shortFr: "Le corps qui se relâche.",
  },
  learning: {
    category: "learning",
    icon: "BookOpen",
    accent: "#E8DCC4",
    defaultNature: "meadow",
    labelFr: "Apprentissage",
    labelEn: "Learning",
    shortFr: "Une petite idée, posée.",
  },
  reprogramming: {
    category: "reprogramming",
    icon: "Stars",
    accent: "#F472B6",
    defaultNature: "stars",
    labelFr: "Reprogrammation",
    labelEn: "Reprogramming",
    shortFr: "Affirmer, visualiser, ancrer.",
  },
};

export const CATEGORY_LIST: PracticeCategory[] = [
  "meditation",
  "breathing",
  "mantra",
  "mudra",
  "movement",
  "learning",
  "reprogramming",
];

export function getCategorySpec(category: PracticeCategory): CategorySpec {
  return PRACTICE_CATEGORIES[category];
}

export function isValidCategory(value: string): value is PracticeCategory {
  return value in PRACTICE_CATEGORIES;
}

/** 6 objectifs de routine — BRIEF §5.1. */
export const ROUTINE_GOALS = ["calme", "energie", "sommeil", "focus", "spiritualite", "memoire"] as const;
export type RoutineGoalSlug = (typeof ROUTINE_GOALS)[number];

export const GOAL_LABELS_FR: Record<RoutineGoalSlug, string> = {
  calme: "Calme",
  energie: "Énergie",
  sommeil: "Sommeil",
  focus: "Concentration",
  spiritualite: "Spiritualité",
  memoire: "Mémoire",
};

export const GOAL_EMOJI: Record<RoutineGoalSlug, string> = {
  calme: "🌿",
  energie: "✨",
  sommeil: "🌙",
  focus: "🎯",
  spiritualite: "🕊️",
  memoire: "📖",
};

/** Mapping objectif → catégories prioritaires (utilisé par routine-generator + builder). */
export const GOAL_PREFERRED_CATEGORIES: Record<RoutineGoalSlug, PracticeCategory[]> = {
  calme: ["breathing", "meditation", "mantra"],
  energie: ["movement", "breathing", "mantra"],
  sommeil: ["breathing", "meditation", "reprogramming"],
  focus: ["meditation", "mudra", "learning"],
  spiritualite: ["mantra", "meditation", "reprogramming"],
  memoire: ["learning", "meditation", "mudra"],
};
