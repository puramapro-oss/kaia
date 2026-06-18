import { describe, it, expect } from "vitest";
import {
  RITUALS_BY_PHASE,
  getRitualsForPhase,
  recommendRitual,
} from "./ritual-recommendations";
import type { CyclePhase } from "./phases";

const PHASES: CyclePhase[] = ["menstruation", "folliculaire", "ovulation", "luteale"];

describe("RITUALS_BY_PHASE", () => {
  it("covers all 4 phases with at least one ritual each", () => {
    for (const p of PHASES) {
      expect(getRitualsForPhase(p).length).toBeGreaterThan(0);
    }
  });

  it("has unique slugs across all phases", () => {
    const slugs = PHASES.flatMap((p) => RITUALS_BY_PHASE[p].map((r) => r.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("recommendRitual", () => {
  it("returns the first ritual by default", () => {
    expect(recommendRitual("menstruation").slug).toBe("repos-sacre");
  });

  it("honors a valid LUNA override within the phase", () => {
    expect(recommendRitual("menstruation", "lacher-prise").slug).toBe("lacher-prise");
  });

  it("ignores an override that does not belong to the phase", () => {
    expect(recommendRitual("ovulation", "repos-sacre").slug).toBe("expression");
  });

  it("ignores an unknown override slug", () => {
    expect(recommendRitual("luteale", "inexistant").slug).toBe("introspection");
  });
});
