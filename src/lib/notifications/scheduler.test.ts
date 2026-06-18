import { describe, it, expect } from "vitest";
import {
  selectNotifications,
  isWithinWindow,
  MAX_PER_DAY,
  type NotificationCandidate,
} from "./scheduler";

const c = (type: NotificationCandidate["type"]): NotificationCandidate => ({
  type,
  title: type,
  body: type,
});

describe("isWithinWindow", () => {
  it("accepts 8h-21h and rejects outside", () => {
    expect(isWithinWindow(8)).toBe(true);
    expect(isWithinWindow(21)).toBe(true);
    expect(isWithinWindow(7)).toBe(false);
    expect(isWithinWindow(22)).toBe(false);
  });
});

describe("selectNotifications", () => {
  it("returns nothing outside the window", () => {
    expect(selectNotifications({ candidates: [c("cycle_phase")], hourLocal: 6 })).toHaveLength(0);
  });

  it("caps at MAX_PER_DAY", () => {
    const out = selectNotifications({
      candidates: [c("cycle_phase"), c("core_now"), c("karma_game")],
      hourLocal: 10,
    });
    expect(out).toHaveLength(MAX_PER_DAY);
  });

  it("respects the remaining daily quota", () => {
    const out = selectNotifications({
      candidates: [c("cycle_phase"), c("core_now")],
      hourLocal: 10,
      sentTodayCount: 1,
    });
    expect(out).toHaveLength(1);
  });

  it("returns nothing when quota already spent", () => {
    const out = selectNotifications({
      candidates: [c("cycle_phase")],
      hourLocal: 10,
      sentTodayCount: MAX_PER_DAY,
    });
    expect(out).toHaveLength(0);
  });

  it("filters opted-out types", () => {
    const out = selectNotifications({
      candidates: [c("karma_game"), c("luna_daily")],
      optOut: new Set(["karma_game"]),
      hourLocal: 12,
    });
    expect(out.map((x) => x.type)).toEqual(["luna_daily"]);
  });

  it("orders by priority (prime_milestone before luna_daily)", () => {
    const out = selectNotifications({
      candidates: [c("luna_daily"), c("prime_milestone")],
      hourLocal: 9,
    });
    expect(out[0].type).toBe("prime_milestone");
  });

  it("dedupes repeated types", () => {
    const out = selectNotifications({
      candidates: [c("core_now"), c("core_now")],
      hourLocal: 9,
    });
    expect(out).toHaveLength(1);
  });
});
