import { describe, it, expect } from "vitest";
import { EMOTIONS_BY_PHASE, getEmotionsForPhase, findEmotion } from "./emotions";
import type { CyclePhase } from "./phases";

const PHASES: CyclePhase[] = ["menstruation", "folliculaire", "ovulation", "luteale"];

describe("emotions", () => {
  it("fournit des émotions accueillies pour chaque phase", () => {
    for (const phase of PHASES) {
      const list = getEmotionsForPhase(phase);
      expect(list.length).toBeGreaterThanOrEqual(3);
      for (const e of list) {
        expect(e.emotion.length).toBeGreaterThan(0);
        expect(e.context.length).toBeGreaterThan(0);
        expect(e.welcome.length).toBeGreaterThan(0);
      }
    }
  });

  it("findEmotion est insensible à la casse et renvoie undefined si absente", () => {
    const first = EMOTIONS_BY_PHASE.luteale[0];
    expect(findEmotion("luteale", first.emotion.toUpperCase())).toEqual(first);
    expect(findEmotion("luteale", "joie cosmique inexistante")).toBeUndefined();
  });
});
