/**
 * Safety classifier — détecte les signaux de détresse dans un message user
 * et déclenche la modal SOS quand nécessaire.
 *
 *  - Pass 1 : blocklist locale FR/EN (mots clés idéation suicidaire + violences)
 *  - Pass 2 : Claude haiku-4-5 si Pass 1 ambigu
 *
 * Module pur : rend `{ category, confidence, suggestSos }`.
 */
import { askClaudeJSON } from "@/lib/claude";

export type SafetyCategory =
  | "safe"
  | "distress_high"
  | "distress_medium"
  | "out_of_scope"
  | "abuse";

export interface SafetyResult {
  category: SafetyCategory;
  confidence: number;
  suggestSos: boolean;
  reason?: string;
}

const HIGH_DISTRESS_FR = [
  "me suicider",
  "suicide",
  "me tuer",
  "en finir",
  "en finir avec la vie",
  "je veux mourir",
  "je vais me tuer",
  "scarification",
  "automutilation",
];
const HIGH_DISTRESS_EN = [
  "kill myself",
  "killing myself",
  "want to die",
  "self harm",
  "self-harm",
  "end my life",
  "suicidal",
];
const ABUSE_KEYWORDS = [
  "violence conjugale",
  "il me bat",
  "elle me bat",
  "domestic violence",
  "abuse me",
];

export function quickLocalCheck(message: string): SafetyResult {
  const low = message.toLowerCase();
  for (const k of [...HIGH_DISTRESS_FR, ...HIGH_DISTRESS_EN]) {
    if (low.includes(k)) {
      return {
        category: "distress_high",
        confidence: 0.95,
        suggestSos: true,
        reason: `local_match:${k}`,
      };
    }
  }
  for (const k of ABUSE_KEYWORDS) {
    if (low.includes(k)) {
      return {
        category: "abuse",
        confidence: 0.9,
        suggestSos: true,
        reason: `local_match:${k}`,
      };
    }
  }
  return {
    category: "safe",
    confidence: 0.5,
    suggestSos: false,
  };
}

export async function deepClassify(message: string): Promise<SafetyResult> {
  // On appelle haiku uniquement si quickLocalCheck n'a pas tranché distress_high
  const local = quickLocalCheck(message);
  if (local.category === "distress_high" || local.category === "abuse") {
    return local;
  }
  try {
    const resp = await askClaudeJSON<{
      category: SafetyCategory;
      confidence: number;
      reason: string;
    }>(
      `Message à classer : """${message.slice(0, 1000)}"""

Réponds en JSON strict avec ce shape :
{ "category": "safe" | "distress_high" | "distress_medium" | "out_of_scope" | "abuse",
  "confidence": 0.0..1.0,
  "reason": "explication courte FR" }`,
      {
        model: "fast",
        maxTokens: 200,
        systemPrompt: SAFETY_SYSTEM,
      }
    );
    return {
      category: resp.category,
      confidence: resp.confidence ?? 0.5,
      suggestSos:
        resp.category === "distress_high" ||
        resp.category === "abuse" ||
        (resp.category === "distress_medium" && resp.confidence > 0.7),
      reason: resp.reason,
    };
  } catch {
    return local;
  }
}

const SAFETY_SYSTEM = `Tu es un classificateur de sécurité pour KAÏA, une app bien-être française.
Tu détectes les signaux de détresse (idées suicidaires, automutilation, violences conjugales)
et tu détermines si le message sort du scope app/bien-être.

Catégories :
- "safe" : message normal sur l'app, méditation, routine, parrainage, etc.
- "distress_high" : risque vital immédiat, idéation suicidaire claire, plan d'action
- "distress_medium" : tristesse profonde, désespoir, isolement, mention indirecte de mort
- "abuse" : violences conjugales, maltraitance enfants, agression
- "out_of_scope" : médical (hors bien-être), politique, légal, technique non-app, NSFW

Sois vigilant mais pas alarmiste : "j'en ai marre" ≠ distress_high.
Si confidence < 0.7 sur distress, classe en distress_medium.`;
