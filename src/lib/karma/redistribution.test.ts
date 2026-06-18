import { describe, it, expect } from "vitest";
import { computeDistribution, distributionPeriodSlug } from "./redistribution";

describe("distributionPeriodSlug", () => {
  it("formats YYYY-MM in UTC", () => {
    expect(distributionPeriodSlug(new Date("2026-06-18T00:00:00Z"))).toBe("2026-06");
    expect(distributionPeriodSlug(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01");
  });
});

describe("computeDistribution", () => {
  it("applies the 50/10/40 split", () => {
    const d = computeDistribution(10_000, [{ userId: "a", activity: 1 }]);
    expect(d.users).toBe(5_000);
    expect(d.asso).toBe(1_000);
    expect(d.sasu).toBe(4_000);
  });

  it("distributes the users pool pro-rata to activity", () => {
    const d = computeDistribution(10_000, [
      { userId: "a", activity: 3 },
      { userId: "b", activity: 1 },
    ]);
    const a = d.shares.find((s) => s.userId === "a")!;
    const b = d.shares.find((s) => s.userId === "b")!;
    expect(a.shareCents).toBe(3_750);
    expect(b.shareCents).toBe(1_250);
  });

  it("conserves the users pool exactly (remainder to top contributor)", () => {
    const d = computeDistribution(10_000, [
      { userId: "a", activity: 1 },
      { userId: "b", activity: 1 },
      { userId: "c", activity: 1 },
    ]);
    const sum = d.shares.reduce((s, x) => s + x.shareCents, 0);
    expect(sum).toBe(d.users);
  });

  it("returns no shares when there is no activity", () => {
    const d = computeDistribution(10_000, [{ userId: "a", activity: 0 }]);
    expect(d.shares).toHaveLength(0);
    expect(d.users).toBe(5_000);
  });

  it("returns no shares for an empty cohort", () => {
    const d = computeDistribution(10_000, []);
    expect(d.shares).toHaveLength(0);
  });

  it("ignores negative activity", () => {
    const d = computeDistribution(10_000, [
      { userId: "a", activity: 2 },
      { userId: "b", activity: -5 },
    ]);
    expect(d.shares.find((s) => s.userId === "a")!.shareCents).toBe(5_000);
    expect(d.shares.find((s) => s.userId === "b")!.shareCents).toBe(0);
  });
});
