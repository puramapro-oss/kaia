import { askClaudeJSON } from "@/lib/claude";
import { MEDICAL_CLAIMS_BLOCKLIST } from "@/lib/constants";

const LUNA_FORBIDDEN_PHRASES = [
  ...MEDICAL_CLAIMS_BLOCKLIST,
  "je suis claude",
  "je suis un assistant ia",
  "anthropic",
  "je suis chatgpt",
  "je suis gpt",
  "openai",
  "large language model",
  "llm",
  "je suis une ia",
  "je suis un modèle",
  "garantis",
  "je garantis",
  "certifié médical",
  "cliniquement prouvé",
  "clinically proven",
  "cela va guérir",
  "cela soignera",
  "remplace un médecin",
  "remplacera votre médecin",
  "replace a doctor",
  "cure your",
  "prescribe",
  "je prescris",
] as const;

const SAFETY_MESSAGE_FR =
  "Je suis LUNA, ton guide bien-être. Pour cette question, je te recommande de consulter un professionnel de santé. Je suis là pour t'accompagner dans ton quotidien, pas pour remplacer un avis médical. 🌙";

export interface LunaFilterResult {
  safe: boolean;
  filtered: string;
  reason?: string;
}

function passOne(text: string): string | null {
  const low = text.toLowerCase();
  for (const phrase of LUNA_FORBIDDEN_PHRASES) {
    if (low.includes(phrase)) return phrase;
  }
  return null;
}

async function passTwo(text: string): Promise<boolean> {
  try {
    const result = await askClaudeJSON<{ medical_claim: boolean; reason: string }>(
      `Analyse cette réponse d'un assistant bien-être. Contient-elle une affirmation médicale (diagnostic, prescription, traitement, garantie de guérison) ou révèle-t-elle qu'elle est une IA de type Claude/ChatGPT ?

Réponse à analyser : """${text.slice(0, 1500)}"""

Réponds en JSON : { "medical_claim": boolean, "reason": "explication courte" }`,
      {
        model: "fast",
        maxTokens: 150,
        systemPrompt:
          "Tu es un filtre de sécurité pour une app bien-être. Tu détectes les affirmations médicales inappropriées ou les auto-révélations d'identité IA. Sois précis, pas alarmiste.",
      }
    );
    return result.medical_claim === true;
  } catch {
    return false;
  }
}

export async function filterLunaOutput(text: string): Promise<LunaFilterResult> {
  const blockedPhrase = passOne(text);
  if (blockedPhrase) {
    return { safe: false, filtered: SAFETY_MESSAGE_FR, reason: `local_match:${blockedPhrase}` };
  }

  const isMedicalClaim = await passTwo(text);
  if (isMedicalClaim) {
    return { safe: false, filtered: SAFETY_MESSAGE_FR, reason: "haiku_classifier:medical_claim" };
  }

  return { safe: true, filtered: text };
}
