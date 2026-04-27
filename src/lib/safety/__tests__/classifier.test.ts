import { describe, it, expect } from "vitest";
import { quickLocalCheck } from "../classifier";

describe("quickLocalCheck", () => {
  it("message normal → safe", () => {
    const r = quickLocalCheck("Comment fonctionne le parrainage ?");
    expect(r.category).toBe("safe");
    expect(r.suggestSos).toBe(false);
  });

  it("idéation suicidaire FR → distress_high + suggestSos", () => {
    const r = quickLocalCheck("je veux mourir ce soir");
    expect(r.category).toBe("distress_high");
    expect(r.suggestSos).toBe(true);
  });

  it("idéation suicidaire EN → distress_high", () => {
    const r = quickLocalCheck("I want to kill myself");
    expect(r.category).toBe("distress_high");
    expect(r.suggestSos).toBe(true);
  });

  it("violence conjugale → abuse + suggestSos", () => {
    const r = quickLocalCheck("Mon mari il me bat tous les soirs");
    expect(r.category).toBe("abuse");
    expect(r.suggestSos).toBe(true);
  });

  it('"en finir" trigger même fragmenté', () => {
    const r = quickLocalCheck("J'aimerais en finir avec la vie tellement c'est dur");
    expect(r.category).toBe("distress_high");
  });

  it("message neutre triste → safe (pas surcatégorisation)", () => {
    const r = quickLocalCheck("J'en ai marre de cette journée");
    expect(r.category).toBe("safe");
  });
});
