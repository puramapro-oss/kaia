import { describe, expect, it } from "vitest";
import { computeStreakAfterRoutine } from "./streak";

const utcDate = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

describe("streak", () => {
  it("démarre à 1 si lastRoutineDate est null", () => {
    const r = computeStreakAfterRoutine({
      currentStreak: 0,
      lastRoutineDate: null,
      today: utcDate(2026, 4, 26),
    });
    expect(r.newStreak).toBe(1);
    expect(r.shouldUpdate).toBe(true);
  });

  it("incrémente quand routine d'hier", () => {
    const r = computeStreakAfterRoutine({
      currentStreak: 6,
      lastRoutineDate: utcDate(2026, 4, 25),
      today: utcDate(2026, 4, 26),
    });
    expect(r.newStreak).toBe(7);
    expect(r.shouldUpdate).toBe(true);
    expect(r.bonuses).toContain("streak_7_bonus");
  });

  it("ne re-déclenche pas le bonus 7 si déjà passé", () => {
    const r = computeStreakAfterRoutine({
      currentStreak: 8,
      lastRoutineDate: utcDate(2026, 4, 25),
      today: utcDate(2026, 4, 26),
    });
    expect(r.newStreak).toBe(9);
    expect(r.bonuses).not.toContain("streak_7_bonus");
  });

  it("déclenche le bonus 30 au passage 29→30", () => {
    const r = computeStreakAfterRoutine({
      currentStreak: 29,
      lastRoutineDate: utcDate(2026, 4, 25),
      today: utcDate(2026, 4, 26),
    });
    expect(r.newStreak).toBe(30);
    expect(r.bonuses).toContain("streak_30_bonus");
  });

  it("reset à 1 si gap >= 2 jours", () => {
    const r = computeStreakAfterRoutine({
      currentStreak: 12,
      lastRoutineDate: utcDate(2026, 4, 23),
      today: utcDate(2026, 4, 26),
    });
    expect(r.newStreak).toBe(1);
    expect(r.shouldUpdate).toBe(true);
    expect(r.bonuses).toEqual([]);
  });

  it("no-op si routine déjà comptée aujourd'hui", () => {
    const r = computeStreakAfterRoutine({
      currentStreak: 5,
      lastRoutineDate: utcDate(2026, 4, 26),
      today: utcDate(2026, 4, 26),
    });
    expect(r.newStreak).toBe(5);
    expect(r.shouldUpdate).toBe(false);
    expect(r.bonuses).toEqual([]);
  });

  it("gère le passage 0→1 sans bonus", () => {
    const r = computeStreakAfterRoutine({
      currentStreak: 0,
      lastRoutineDate: null,
      today: utcDate(2026, 4, 26),
    });
    expect(r.bonuses).toEqual([]);
  });
});
