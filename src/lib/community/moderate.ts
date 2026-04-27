/**
 * Pipeline de modération communauté KAÏA.
 *
 * Étapes (rapide → cher) :
 *  1. Validation taille (≤ 280 chars)
 *  2. Blocklist locale (constants.MEDICAL_CLAIMS_BLOCKLIST + FORBIDDEN_REWARDS_KEYWORDS)
 *      → match exact = `rejected` instant, 0 token consommé
 *  3. Claude Haiku (`claude-haiku-4-5-20251001`) classifier JSON
 *
 * La fonction est PURE : elle ne touche pas à la DB. Le caller décide de la suite.
 */
import { askClaudeJSON } from "@/lib/claude";
import { detectMedicalClaims } from "@/lib/safety/medical-claims-blocklist";
import {
  MODERATION_SYSTEM,
  MODERATION_JSON_SHAPE,
  type ModerationDecision,
} from "@/lib/agent/prompts/moderation";

export interface ModerationResult {
  decision: "approved" | "flagged" | "rejected";
  reasons: string[];
  severity: "low" | "medium" | "high";
  source: "local_blocklist" | "ai_classifier" | "format";
  explanation: string;
}

/** Limite stricte (BRIEF §5.7) — la DB le rejette aussi via CHECK constraint. */
export const MAX_POST_LENGTH = 280;

export async function moderatePost(content: string): Promise<ModerationResult> {
  const trimmed = content.trim();

  // 1. Format
  if (trimmed.length === 0) {
    return {
      decision: "rejected",
      reasons: ["empty"],
      severity: "low",
      source: "format",
      explanation: "Le message est vide.",
    };
  }
  if (trimmed.length > MAX_POST_LENGTH) {
    return {
      decision: "rejected",
      reasons: ["too_long"],
      severity: "low",
      source: "format",
      explanation: `Le message dépasse ${MAX_POST_LENGTH} caractères.`,
    };
  }

  // 2. Blocklist locale (rapide, gratuite). Ne touche que les claims médicaux les plus graves.
  const violations = detectMedicalClaims(trimmed);
  if (violations.some((v) => v.kind === "medical_claim")) {
    return {
      decision: "rejected",
      reasons: ["medical_claim"],
      severity: "high",
      source: "local_blocklist",
      explanation: "Ce message contient une promesse médicale interdite.",
    };
  }
  if (violations.some((v) => v.kind === "forbidden_reward")) {
    return {
      decision: "rejected",
      reasons: ["forbidden_reward"],
      severity: "high",
      source: "local_blocklist",
      explanation: "Ce message évoque une récompense interdite.",
    };
  }

  // 3. Claude Haiku classifier
  let aiDecision: ModerationDecision;
  try {
    aiDecision = await askClaudeJSON<ModerationDecision>(
      `Message à modérer :\n"""\n${trimmed}\n"""`,
      {
        model: "fast",
        systemPrompt: MODERATION_SYSTEM,
        jsonShapeHint: MODERATION_JSON_SHAPE,
        maxTokens: 256,
        temperature: 0,
      },
    );
  } catch {
    // Si Claude ne répond pas valide JSON ou time out → on flag par sécurité (pas approve aveugle).
    return {
      decision: "flagged",
      reasons: ["ai_classifier_error"],
      severity: "low",
      source: "ai_classifier",
      explanation: "La modération automatique a rencontré une erreur — message à vérifier.",
    };
  }

  return {
    decision: aiDecision.decision,
    reasons: aiDecision.reasons,
    severity: aiDecision.severity,
    source: "ai_classifier",
    explanation: aiDecision.explanation_short,
  };
}
