import { describe, it, expect } from "vitest";
import { RECONCILIATION_MODULES, getReconciliationModule } from "./reconciliation";

describe("reconciliation", () => {
  it("expose 4 modules à clés uniques avec prompts non vides", () => {
    expect(RECONCILIATION_MODULES).toHaveLength(4);
    const keys = RECONCILIATION_MODULES.map((m) => m.key);
    expect(new Set(keys).size).toBe(4);
    for (const m of RECONCILIATION_MODULES) {
      expect(m.intro.length).toBeGreaterThan(0);
      expect(m.prompts.length).toBeGreaterThanOrEqual(2);
      expect(m.prompts.every((q) => q.trim().length > 0)).toBe(true);
    }
  });

  it("le module ménopause utilise le mode LUNA caregiver_support", () => {
    expect(getReconciliationModule("menopause")?.lunaMode).toBe("caregiver_support");
  });

  it("renvoie undefined pour une clé inconnue", () => {
    // @ts-expect-error clé volontairement invalide
    expect(getReconciliationModule("inconnu")).toBeUndefined();
  });
});
