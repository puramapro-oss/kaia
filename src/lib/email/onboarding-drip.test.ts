import { describe, it, expect } from "vitest";
import { dripTargetDates, dripKindForDate, dripQueryWindow } from "./onboarding-drip";

// 2026-06-18T12:00:00Z
const NOW = Date.UTC(2026, 5, 18, 12, 0, 0);

describe("onboarding drip", () => {
  it("cible J3 (guide) et J7 (AURORA)", () => {
    const t = dripTargetDates(NOW);
    expect(t.first_cycle_guide).toBe("2026-06-15");
    expect(t.aurora_invitation).toBe("2026-06-11");
  });

  it("mappe la date d'onboarding au bon palier", () => {
    expect(dripKindForDate("2026-06-15", NOW)).toBe("first_cycle_guide");
    expect(dripKindForDate("2026-06-11T09:00:00Z", NOW)).toBe("aurora_invitation");
    expect(dripKindForDate("2026-06-17", NOW)).toBeNull();
    expect(dripKindForDate(null, NOW)).toBeNull();
  });

  it("fenêtre de requête couvre J3..J7", () => {
    const w = dripQueryWindow(NOW);
    // start avant J7, end après J3 → contient les deux jours cibles.
    expect(new Date(w.startISO).getTime()).toBeLessThan(Date.parse("2026-06-11"));
    expect(new Date(w.endISO).getTime()).toBeGreaterThanOrEqual(Date.parse("2026-06-15"));
  });
});
