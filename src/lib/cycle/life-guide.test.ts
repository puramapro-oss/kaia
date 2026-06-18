import { describe, it, expect } from "vitest";
import { LIFE_GUIDE_BY_PHASE, getLifeGuide, getPhaseMantra } from "./life-guide";
import type { CyclePhase } from "./phases";

const PHASES: CyclePhase[] = ["menstruation", "folliculaire", "ovulation", "luteale"];

describe("life-guide", () => {
  it("couvre les 4 phases avec les 4 dimensions et du contenu réel", () => {
    for (const phase of PHASES) {
      const guide = getLifeGuide(phase);
      expect(guide.phase).toBe(phase);
      expect(guide.title.length).toBeGreaterThan(0);
      expect(guide.mantra.length).toBeGreaterThan(0);
      const keys = guide.dimensions.map((d) => d.key).sort();
      expect(keys).toEqual(["alimentation", "energie", "focus", "mouvement"]);
      for (const dim of guide.dimensions) {
        expect(dim.tips.length).toBeGreaterThanOrEqual(2);
        expect(dim.tips.every((t) => t.trim().length > 0)).toBe(true);
        expect(dim.tips.some((t) => /lorem/i.test(t))).toBe(false);
      }
    }
  });

  it("getPhaseMantra renvoie le mantra de la phase", () => {
    expect(getPhaseMantra("menstruation")).toBe(LIFE_GUIDE_BY_PHASE.menstruation.mantra);
  });
});
