import { describe, it, expect } from "vitest";
import {
  isoWeekYear,
  isoWeekSlug,
  pickThemeForWeek,
  isoWeekBounds,
} from "./theme-rotation";
import { RITUAL_THEMES } from "@/lib/agent/prompts/ritual-host";

describe("isoWeekYear", () => {
  it("Mon 2026-04-27 → 2026 W18", () => {
    const { year, week } = isoWeekYear(new Date("2026-04-27T12:00:00Z"));
    expect(year).toBe(2026);
    expect(week).toBe(18);
  });

  it("Sun 2026-01-04 → 2026 W01 (semaine ISO contenant le 1er jeudi)", () => {
    const { year, week } = isoWeekYear(new Date("2026-01-04T00:00:00Z"));
    expect(year).toBe(2026);
    expect(week).toBe(1);
  });
});

describe("isoWeekSlug", () => {
  it("formate avec zero-padding", () => {
    expect(isoWeekSlug(new Date("2026-04-27T00:00:00Z"))).toBe("2026-W18");
    expect(isoWeekSlug(new Date("2026-01-12T00:00:00Z"))).toBe("2026-W03");
  });
});

describe("pickThemeForWeek", () => {
  it("retourne toujours un thème de la liste", () => {
    for (let i = 0; i < 60; i++) {
      const d = new Date(2026, 0, 1 + i * 7);
      const t = pickThemeForWeek(d);
      expect(RITUAL_THEMES).toContain(t);
    }
  });

  it("est déterministe pour la même semaine", () => {
    const a = pickThemeForWeek(new Date("2026-04-27T00:00:00Z")); // Lun
    const b = pickThemeForWeek(new Date("2026-05-02T23:59:59Z")); // Sam — même semaine ISO
    expect(a).toBe(b);
  });
});

describe("isoWeekBounds", () => {
  it("retourne lundi 00:00 → dimanche 23:59 UTC", () => {
    const { startsAt, endsAt } = isoWeekBounds(new Date("2026-04-29T15:00:00Z")); // Mer
    expect(startsAt.getUTCDay()).toBe(1); // Lundi
    expect(startsAt.getUTCHours()).toBe(0);
    expect(endsAt.getUTCDay()).toBe(0); // Dimanche
    expect(endsAt.getUTCHours()).toBe(23);
    expect(endsAt.getTime() - startsAt.getTime()).toBeGreaterThan(6 * 86400000);
    expect(endsAt.getTime() - startsAt.getTime()).toBeLessThan(7 * 86400000);
  });
});
