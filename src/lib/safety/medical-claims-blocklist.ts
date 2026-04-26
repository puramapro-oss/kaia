import { MEDICAL_CLAIMS_BLOCKLIST, FORBIDDEN_REWARDS_KEYWORDS } from "@/lib/constants";

export interface SafetyViolation {
  kind: "medical_claim" | "forbidden_reward";
  matched: string;
  position: number;
}

export function detectMedicalClaims(input: string): SafetyViolation[] {
  if (!input) return [];
  const lower = input.toLowerCase();
  const violations: SafetyViolation[] = [];

  for (const term of MEDICAL_CLAIMS_BLOCKLIST) {
    const idx = lower.indexOf(term);
    if (idx >= 0) {
      violations.push({ kind: "medical_claim", matched: term, position: idx });
    }
  }
  for (const term of FORBIDDEN_REWARDS_KEYWORDS) {
    const idx = lower.indexOf(term);
    if (idx >= 0) {
      violations.push({ kind: "forbidden_reward", matched: term, position: idx });
    }
  }
  return violations;
}

export function isSafeText(input: string): boolean {
  return detectMedicalClaims(input).length === 0;
}

export function sanitizeText(input: string, replacement = "[…]"): string {
  let out = input;
  for (const term of [...MEDICAL_CLAIMS_BLOCKLIST, ...FORBIDDEN_REWARDS_KEYWORDS]) {
    const re = new RegExp(`\\b${term}\\b`, "gi");
    out = out.replace(re, replacement);
  }
  return out;
}
