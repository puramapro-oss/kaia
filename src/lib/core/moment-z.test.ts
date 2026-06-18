import { describe, it, expect } from "vitest";
import {
  getMomentZ,
  secondsUntilMomentZ,
  isWithinMomentZWindow,
  momentZStatus,
  formatCountdown,
  type MomentZEvent,
} from "./moment-z";

const now: MomentZEvent = { type: "now", starts_at: "2026-06-18T12:00:00.000Z" };
const day: MomentZEvent = {
  type: "24h",
  starts_at: "2026-06-18T00:00:00.000Z",
  ends_at: "2026-06-19T00:00:00.000Z",
};
const explicit: MomentZEvent = {
  type: "7days",
  starts_at: "2026-06-18T00:00:00.000Z",
  ends_at: "2026-06-25T00:00:00.000Z",
  synchronization_moment_z: "2026-06-21T20:00:00.000Z",
};

describe("getMomentZ", () => {
  it("uses starts_at for a 'now' event", () => {
    expect(getMomentZ(now).toISOString()).toBe("2026-06-18T12:00:00.000Z");
  });

  it("uses the midpoint when no explicit moment_z", () => {
    expect(getMomentZ(day).toISOString()).toBe("2026-06-18T12:00:00.000Z");
  });

  it("prefers an explicit synchronization_moment_z", () => {
    expect(getMomentZ(explicit).toISOString()).toBe("2026-06-21T20:00:00.000Z");
  });
});

describe("secondsUntilMomentZ", () => {
  it("is positive before the moment", () => {
    expect(secondsUntilMomentZ(now, new Date("2026-06-18T11:59:00.000Z"))).toBe(60);
  });

  it("is negative after the moment", () => {
    expect(secondsUntilMomentZ(now, new Date("2026-06-18T12:01:00.000Z"))).toBe(-60);
  });
});

describe("isWithinMomentZWindow / momentZStatus", () => {
  it("detects the live window", () => {
    const t = new Date("2026-06-18T12:00:30.000Z");
    expect(isWithinMomentZWindow(now, t)).toBe(true);
    expect(momentZStatus(now, t)).toBe("live");
  });

  it("marks upcoming and passed outside the window", () => {
    expect(momentZStatus(now, new Date("2026-06-18T11:55:00.000Z"))).toBe("upcoming");
    expect(momentZStatus(now, new Date("2026-06-18T12:05:00.000Z"))).toBe("passed");
  });
});

describe("formatCountdown", () => {
  it("formats with hours and clamps negatives to zero", () => {
    expect(formatCountdown(3661)).toBe("1:01:01");
    expect(formatCountdown(75)).toBe("1:15");
    expect(formatCountdown(-10)).toBe("0:00");
  });
});
