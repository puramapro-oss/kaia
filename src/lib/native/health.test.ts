import { describe, it, expect } from "vitest";
import { normalizeCycleSamples, normalizeWellnessSamples } from "./health";

describe("health normalizers", () => {
  it("normalise le flux menstruel (clamp 0-4) et l'ovulation", () => {
    expect(normalizeCycleSamples([
      { type: "menstrualFlow", value: 7 },
      { type: "ovulationTestResult", value: 1 },
    ])).toEqual({ menstrualFlow: 4, ovulationPositive: true });

    expect(normalizeCycleSamples([{ type: "ovulationTestResult", value: 0 }]))
      .toEqual({ menstrualFlow: null, ovulationPositive: false });
  });

  it("renvoie null si aucun échantillon pertinent", () => {
    expect(normalizeCycleSamples([])).toEqual({ menstrualFlow: null, ovulationPositive: null });
  });

  it("somme les minutes de pleine conscience et lit la HRV", () => {
    expect(normalizeWellnessSamples([
      { type: "mindfulSession", value: 10 },
      { type: "mindfulSession", value: 5 },
      { type: "heartRateVariability", value: 48.6 },
    ])).toEqual({ mindfulMinutes: 15, hrvMs: 49 });
  });
});
