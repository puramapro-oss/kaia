import { describe, expect, it } from "vitest";
import {
  computeMultiplier,
  applyMultiplier,
  MAX_MULTIPLIER,
} from "./multiplier";

describe("multiplier (BRIEF §11.4)", () => {
  it("renvoie 1.0 pour un user free", () => {
    const m = computeMultiplier({
      plan: "free",
      subscriptionStartedAt: new Date("2025-01-01"),
      now: new Date("2026-04-26"),
    });
    expect(m).toBe(1.0);
  });

  it("renvoie 1.0 pour mois 1 (< 30j)", () => {
    const m = computeMultiplier({
      plan: "active",
      subscriptionStartedAt: new Date("2026-04-01"),
      now: new Date("2026-04-20"),
    });
    expect(m).toBe(1.0);
  });

  it("ajoute 10% à partir du 30ème jour (mois 2)", () => {
    // 35 jours d'écart → monthsActive=1 → 1.10
    const m = computeMultiplier({
      plan: "active",
      subscriptionStartedAt: new Date("2026-03-22"),
      now: new Date("2026-04-26"),
    });
    expect(m).toBeCloseTo(1.1, 5);
  });

  it("ajoute 20% au mois 3 (~60j)", () => {
    // 65 jours → monthsActive=2 → 1.20
    const m = computeMultiplier({
      plan: "active",
      subscriptionStartedAt: new Date("2026-02-20"),
      now: new Date("2026-04-26"),
    });
    expect(m).toBeCloseTo(1.2, 5);
  });

  it("plafonne à 3.0 (palier max +200%)", () => {
    const m = computeMultiplier({
      plan: "active",
      subscriptionStartedAt: new Date("2020-01-01"),
      now: new Date("2026-04-26"),
    });
    expect(m).toBe(MAX_MULTIPLIER);
  });

  it("retombe à 1.0 si plan canceled", () => {
    const m = computeMultiplier({
      plan: "canceled",
      subscriptionStartedAt: new Date("2020-01-01"),
      now: new Date("2026-04-26"),
    });
    expect(m).toBe(1.0);
  });

  it("renvoie 1.0 si subscriptionStartedAt manquant", () => {
    const m = computeMultiplier({
      plan: "active",
      subscriptionStartedAt: null,
      now: new Date("2026-04-26"),
    });
    expect(m).toBe(1.0);
  });

  it("applyMultiplier arrondit à l'entier inférieur, ne change pas les valeurs ≤ 0", () => {
    expect(applyMultiplier(10, 1.5)).toBe(15);
    expect(applyMultiplier(10, 1.1)).toBe(11);
    expect(applyMultiplier(10, 1.01)).toBe(10); // floor
    expect(applyMultiplier(0, 2)).toBe(0);
    expect(applyMultiplier(-5, 2)).toBe(-5);
  });
});
