import type { SupportedLocale } from "@/lib/constants";
import { getSystemPrompt } from "@/lib/agent/prompts/system-kaia";

export interface ReprogrammingInput {
  goal: string;
  situation?: string;
  locale?: SupportedLocale;
}

export interface ReprogrammingOutput {
  affirmations: string[];
  visualization: string;
  closingPhrase: string;
}

const REPROG_JSON_SHAPE = `{
  "affirmations": ["string", ...]  (5 à 7 affirmations à la 1ère personne, présent, positives, sobres),
  "visualization": "string (paragraphe 60-120 mots, scène intérieure paisible, sensorielle, jamais médicale)",
  "closingPhrase": "string (1 phrase de clôture, douce, ancrante)"
}`;

export function buildReprogrammingSystem(locale: SupportedLocale = "fr"): string {
  return `${getSystemPrompt(locale)}

## TÂCHE — Génération d'affirmations + visualisation
Tu reçois un objectif personnel et optionnellement une situation. Tu produis :
- 5 à 7 affirmations à la 1ère personne, au présent, positives, sobres ("Je suis", "Je peux", "Je choisis").
- 1 visualisation sensorielle 60-120 mots (vue, ouïe, toucher, odeur — pas de "tu guéris", pas de promesse).
- 1 phrase de clôture douce.

## CONTRAINTES
- Aucune affirmation médicale ("Je guéris de…", "Je traite…").
- Pas de pensée magique ("L'univers va m'apporter X").
- Phrases courtes, simples, accessibles aux sceptiques.
- Affirmations : ancrées dans le possible, pas dans le miracle.

## SORTIE — JSON STRICT
Respond with VALID JSON only — no markdown fences, no commentary.
Shape:
${REPROG_JSON_SHAPE}`;
}

export function buildReprogrammingUserMessage(input: ReprogrammingInput): string {
  const lines: string[] = [];
  lines.push(`Objectif personnel : ${input.goal}.`);
  if (input.situation && input.situation.trim().length > 0) {
    lines.push(`Situation actuelle : ${input.situation.trim()}`);
  }
  lines.push("Génère les affirmations + visualisation maintenant.");
  return lines.join("\n");
}
