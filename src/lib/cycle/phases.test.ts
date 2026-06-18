import { describe, it, expect } from "vitest";
import { detectPhase, getCycleDay } from "./phases";

describe("detectPhase", () => {
  it("J1 is menstruation", () => {
    const p = detectPhase(1);
    expect(p.phase).toBe("menstruation");
    expect(p.dayInPhase).toBe(1);
  });

  it("J5 is still menstruation", () => {
    expect(detectPhase(5).phase).toBe("menstruation");
  });

  it("J6 is folliculaire", () => {
    expect(detectPhase(6).phase).toBe("folliculaire");
  });

  it("J14 is folliculaire (default 28d cycle)", () => {
    expect(detectPhase(14).phase).toBe("folliculaire");
  });

  it("J15 is ovulation", () => {
    expect(detectPhase(15).phase).toBe("ovulation");
  });

  it("J17 is ovulation (last day)", () => {
    expect(detectPhase(17).phase).toBe("ovulation");
  });

  it("J18 is luteale", () => {
    expect(detectPhase(18).phase).toBe("luteale");
  });

  it("J28 is luteale (last day)", () => {
    expect(detectPhase(28).phase).toBe("luteale");
  });

  it("daysUntilNext is positive", () => {
    const p = detectPhase(10);
    expect(p.daysUntilNext).toBeGreaterThanOrEqual(0);
  });

  it("30-day cycle: J29 is luteale", () => {
    expect(detectPhase(29, 30).phase).toBe("luteale");
  });
});

describe("getCycleDay", () => {
  it("start date today returns J1", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(getCycleDay(today)).toBe(1);
  });

  it("start date 6 days ago returns J7", () => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    expect(getCycleDay(d)).toBe(7);
  });
});
