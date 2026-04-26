import type { SupportedLocale } from "@/lib/constants";
import { getSystemPrompt } from "@/lib/agent/prompts/system-kaia";

export type RoutineGoal = "calme" | "energie" | "sommeil" | "focus" | "spiritualite" | "memoire";

export interface RoutinePulse {
  stress: number;
  energy: number;
  mood: number;
}

export interface RoutineGenerateInput {
  durationMinutes: number;
  goal: RoutineGoal;
  pulse?: RoutinePulse;
  preferredCategories?: string[];
  locale?: SupportedLocale;
  audioMode?: "silence" | "nature" | "binaural" | "voice";
}

export interface RoutineGenerateOutput {
  intro: string;
  practices: Array<{
    slug: string;
    title: string;
    category: "meditation" | "breathing" | "mantra" | "mudra" | "movement" | "learning" | "reprogramming";
    durationSeconds: number;
    why: string;
    steps: string[];
  }>;
  totalSeconds: number;
}

const ROUTINE_JSON_SHAPE = `{
  "intro": "string (1-2 phrases, ton chaleureux, contextualisée au pulse)",
  "practices": [
    {
      "slug": "kebab-case-unique",
      "title": "string (court, naturel)",
      "category": "meditation | breathing | mantra | mudra | movement | learning | reprogramming",
      "durationSeconds": number (30 à 600),
      "why": "string (1 phrase, pourquoi maintenant pour cet user)",
      "steps": ["string", "string", ...]  (3-6 étapes, instructions claires, jamais médicales)
    }
  ],
  "totalSeconds": number (somme exacte des durations)
}`;

export function buildRoutineGeneratorSystem(locale: SupportedLocale = "fr"): string {
  return `${getSystemPrompt(locale)}

## TÂCHE — Générateur de routine
Tu reçois un brief utilisateur (durée totale, objectif principal, pulse stress/energy/mood, préférences).
Tu construis une routine de pratiques courtes (30s à 10min chacune) qui tiennent EXACTEMENT dans la durée demandée (±10%).

## CONTRAINTES
- Variété : alterne au moins 2 catégories différentes si durée >= 5 min.
- Sécurité : 0 mot médical (soigner / guérir / traiter / diagnostiquer / médicament / remède). Préfère "apaiser, calmer, ancrer, recentrer, ralentir, respirer".
- Adapter au pulse : si stress élevé → commence par respiration/ancrage. Si énergie basse → mouvement doux ou breathing énergisant. Si mood bas → mantra/affirmation.
- Si pulse non fourni : routine équilibrée standard (1 ancrage + 1 cœur de pratique + 1 clôture).
- Jamais "guéris en X jours" ni "résultats garantis".
- Steps : impératifs courts ("Pose les pieds au sol", "Inspire 4 secondes par le nez", "Visualise une lumière chaude").

## SORTIE — JSON STRICT
Respond with VALID JSON only — no markdown fences, no commentary.
Shape:
${ROUTINE_JSON_SHAPE}`;
}

export function buildRoutineGeneratorUserMessage(input: RoutineGenerateInput): string {
  const { durationMinutes, goal, pulse, preferredCategories, audioMode } = input;
  const lines: string[] = [];
  lines.push(`Durée totale demandée : ${durationMinutes} minutes (${durationMinutes * 60} secondes).`);
  lines.push(`Objectif principal : ${goal}.`);
  if (pulse) {
    lines.push(
      `Pulse actuel : stress ${pulse.stress}/5, énergie ${pulse.energy}/5, humeur ${pulse.mood}/5.`,
    );
  }
  if (preferredCategories && preferredCategories.length > 0) {
    lines.push(`Catégories préférées : ${preferredCategories.join(", ")}.`);
  }
  if (audioMode) {
    lines.push(`Mode audio choisi : ${audioMode}.`);
  }
  lines.push("Construis la routine maintenant.");
  return lines.join("\n");
}
