import { describe, it, expect } from "vitest";
import {
  currentWeeklyWindow,
  currentMonthlyWindow,
  currentYearlyWindow,
  windowFor,
} from "../period";

describe("period windows", () => {
  it("weekly : lundi 00:00 → dimanche 23:59:59", () => {
    // 2026-04-29 mercredi
    const w = currentWeeklyWindow(new Date("2026-04-29T15:00:00Z"));
    expect(w.startsAt.getUTCDay()).toBe(1); // lundi
    expect(w.endsAt.getUTCDay()).toBe(0); // dimanche
    expect(w.drawAt.getUTCHours()).toBe(20);
    expect(w.slug).toMatch(/^2026-W\d{2}$/);
  });

  it("weekly slug zero-pad la semaine", () => {
    const w = currentWeeklyWindow(new Date("2026-01-08T00:00:00Z")); // S2 2026
    expect(w.slug).toBe("2026-W02");
  });

  it("monthly : 1er du mois → dernier jour 23:59:59", () => {
    const m = currentMonthlyWindow(new Date("2026-04-15T12:00:00Z"));
    expect(m.startsAt.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(m.slug).toBe("2026-04");
    expect(m.drawAt.getUTCMonth()).toBe(4); // mai (0-indexed)
    expect(m.drawAt.getUTCDate()).toBe(1);
    expect(m.drawAt.getUTCHours()).toBe(12);
  });

  it("yearly : 1er janvier → 31 décembre", () => {
    const y = currentYearlyWindow(new Date("2026-07-12T00:00:00Z"));
    expect(y.slug).toBe("2026");
    expect(y.startsAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(y.drawAt.toISOString()).toBe("2026-12-31T23:30:00.000Z");
  });

  it("windowFor() route vers la bonne cadence", () => {
    const now = new Date("2026-04-29T00:00:00Z");
    expect(windowFor("weekly", now).slug).toMatch(/^2026-W/);
    expect(windowFor("monthly", now).slug).toBe("2026-04");
    expect(windowFor("yearly", now).slug).toBe("2026");
  });
});
