import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Anthropic SDK avant l'import du sujet testé.
vi.mock("@/lib/claude", () => ({
  askClaude: vi.fn(),
  askClaudeJSON: vi.fn(),
}));

import { askClaudeJSON } from "@/lib/claude";
import { moderatePost, MAX_POST_LENGTH } from "./moderate";

const askClaudeJSONMock = vi.mocked(askClaudeJSON);

describe("moderatePost", () => {
  beforeEach(() => {
    askClaudeJSONMock.mockReset();
  });

  it("rejects empty content sans appeler Claude", async () => {
    const r = await moderatePost("   ");
    expect(r.decision).toBe("rejected");
    expect(r.source).toBe("format");
    expect(askClaudeJSONMock).not.toHaveBeenCalled();
  });

  it(`rejects content > ${MAX_POST_LENGTH} chars sans appeler Claude`, async () => {
    const long = "a".repeat(MAX_POST_LENGTH + 1);
    const r = await moderatePost(long);
    expect(r.decision).toBe("rejected");
    expect(r.reasons).toContain("too_long");
    expect(askClaudeJSONMock).not.toHaveBeenCalled();
  });

  it("rejects sur claim médical local sans appeler Claude", async () => {
    // 'guérir' est un terme MEDICAL_CLAIMS_BLOCKLIST attendu.
    const r = await moderatePost("Cette pratique m'a permis de guérir mon diabète.");
    expect(r.decision).toBe("rejected");
    expect(r.source).toBe("local_blocklist");
    expect(r.reasons).toContain("medical_claim");
    expect(askClaudeJSONMock).not.toHaveBeenCalled();
  });

  it("appelle Claude pour un texte safe et propage la décision", async () => {
    askClaudeJSONMock.mockResolvedValueOnce({
      decision: "approved",
      reasons: [],
      severity: "low",
      explanation_short: "Témoignage authentique.",
    });
    const r = await moderatePost("J'ai fait 5 minutes de respiration ce matin et je me sens calme.");
    expect(r.decision).toBe("approved");
    expect(r.source).toBe("ai_classifier");
    expect(askClaudeJSONMock).toHaveBeenCalledOnce();
  });

  it("flag si Claude renvoie une erreur (JSON invalide)", async () => {
    askClaudeJSONMock.mockRejectedValueOnce(new SyntaxError("invalid json"));
    const r = await moderatePost("Texte borderline.");
    expect(r.decision).toBe("flagged");
    expect(r.reasons).toContain("ai_classifier_error");
  });
});
