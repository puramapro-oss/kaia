import { describe, it, expect } from "vitest";
import { reactivationTargetDates, reactivationKindForDate } from "./reactivation";

// 2026-06-18T12:00:00Z
const NOW = Date.UTC(2026, 5, 18, 12, 0, 0);

describe("reactivation selection", () => {
  it("cible J14 et J30 en arrière depuis aujourd'hui", () => {
    const t = reactivationTargetDates(NOW);
    expect(t.reactivation_j14).toBe("2026-06-04");
    expect(t.reactivation_j30).toBe("2026-05-19");
  });

  it("mappe une date de dernière activité au bon palier", () => {
    expect(reactivationKindForDate("2026-06-04", NOW)).toBe("reactivation_j14");
    expect(reactivationKindForDate("2026-05-19", NOW)).toBe("reactivation_j30");
    expect(reactivationKindForDate("2026-06-04T08:30:00Z", NOW)).toBe("reactivation_j14");
  });

  it("renvoie null hors palier ou si activité inconnue", () => {
    expect(reactivationKindForDate("2026-06-10", NOW)).toBeNull(); // 8j
    expect(reactivationKindForDate("2026-06-17", NOW)).toBeNull(); // 1j
    expect(reactivationKindForDate(null, NOW)).toBeNull();
  });
});
