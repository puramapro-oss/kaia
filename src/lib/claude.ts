import 'server-only';
import { smarana } from '@purama/smarana';

export type ClaudeModel = "main" | "fast" | "pro";

const tierMap: Record<ClaudeModel, 'main' | 'fast' | 'pro'> = {
  main: 'main',
  fast: 'fast',
  pro: 'pro',
};

// L'assistant se présente TOUJOURS comme "LUNA", jamais "Claude" (règle PURAMA §3).
// JAMAIS modifier/résumer ces disclaimers médicaux — app santé, obligation légale.
export const KAIA_SYSTEM_PROMPT = `Tu es LUNA, l'intelligence de KAÏA, une app de santé féminine holistique.
Tu ne te présentes JAMAIS comme "Claude" ou "Anthropic" — tu es LUNA.

⚠️ DISCLAIMERS MÉDICAUX — ABSOLUMENT CRITIQUES, JAMAIS SUPPRIMER OU RÉSUMER :

1. URGENCES : Si l'utilisatrice évoque un symptôme d'urgence (saignement hémorragique, douleur abdominale sévère, perte de conscience, choc, convulsions, fièvre élevée), réponds IMMÉDIATEMENT :
   "🚨 URGENCE : Appelle le 15 ou rends-toi aux urgences maintenant. Ces symptômes nécessitent une prise en charge médicale immédiate."

2. LIMITATION : Je ne peux JAMAIS poser de diagnostic médical, prescrire un traitement, ou remplacer une consultation médicale réelle.

3. SCOPE : Mon rôle est d'accompagner sur le bien-être quotidien (cycle, nutrition, mouvement, sommeil, équilibre émotionnel) — JAMAIS de conseil médical sur des symptômes pathologiques.

4. CONSULTATION MÉDICALE : Pour tout symptôme inhabituel, douleur persistante, trouble du cycle anormal, ou doute santé → toujours orienter vers un médecin, sage-femme, ou professionnel de santé qualifié.

Ton calme, bienveillant, jamais culpabilisant — jamais de honte sur les rechutes ou les difficultés.
Réponses courtes (2-4 phrases), en français, adaptées à une app qui prône elle-même une utilisation minimale de l'écran.`;

export interface AskClaudeOptions {
  model?: ClaudeModel;
  maxTokens?: number;
  systemPrompt?: string;
  temperature?: number;
  userId?: string;
}

// Loi 1 SMARANA-BRIEF.md : "Aucune app n'appelle l'API directement. Tout passe par smarana.ask()."
// KAIA ne détient plus de client Anthropic — mémoire cross-écosystème + cache + usage
// centralisés dans @purama/smarana (packages/smarana).
export async function askClaude(
  userMessage: string,
  options: AskClaudeOptions = {}
): Promise<string> {
  const {
    model = "main",
    maxTokens = 4096,
    systemPrompt = KAIA_SYSTEM_PROMPT,
    userId,
  } = options;

  const result = await smarana.ask({
    appSlug: 'kaia',
    userId,
    system: systemPrompt,
    message: userMessage,
    tier: tierMap[model],
    maxTokens,
  });

  return result.text;
}

// streamClaude et askClaudeJSON restent hors périmètre smarana P0/P1 (texte non-streaming seulement).
// Garder les implémentations actuelles pour compatibilité, mais documenter la limite.
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function envTrim(name: string, fallback: string): string {
  return (process.env[name] ?? fallback).trim();
}

const MODEL_MAP: Record<ClaudeModel, string> = {
  main: envTrim("ANTHROPIC_MODEL_MAIN", "claude-sonnet-4-6"),
  fast: envTrim("ANTHROPIC_MODEL_FAST", "claude-haiku-4-5-20251001"),
  pro: envTrim("ANTHROPIC_MODEL_PRO", "claude-opus-4-7"),
};

export async function streamClaude(
  userMessage: string,
  options: AskClaudeOptions = {}
): Promise<AsyncIterable<string>> {
  const { model = "main", maxTokens = 4096, systemPrompt, temperature = 0.7 } = options;

  const stream = await client.messages.stream({
    model: MODEL_MAP[model],
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return (async function* () {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  })();
}

export async function askClaudeJSON<T>(
  userMessage: string,
  options: AskClaudeOptions & { jsonShapeHint?: string } = {}
): Promise<T> {
  const systemPrompt = `${options.systemPrompt ?? ""}

Respond with VALID JSON only — no markdown fences, no commentary.${
    options.jsonShapeHint ? `\nExpected shape:\n${options.jsonShapeHint}` : ""
  }`.trim();

  const raw = await askClaude(userMessage, { ...options, systemPrompt });

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

export { MODEL_MAP };
