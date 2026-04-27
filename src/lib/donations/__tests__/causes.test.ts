import { describe, it, expect } from "vitest";
import { computeDonationRewards, getCause, DONATION_CAUSES } from "../causes";

describe("donation rewards", () => {
  it("10€ = 100 tokens + 1 ticket", () => {
    const r = computeDonationRewards(1000);
    expect(r.tokens).toBe(100);
    expect(r.tickets).toBe(1);
  });
  it("5€ = 50 tokens + 0 ticket", () => {
    const r = computeDonationRewards(500);
    expect(r.tokens).toBe(50);
    expect(r.tickets).toBe(0);
  });
  it("25€ = 250 tokens + 2 tickets", () => {
    const r = computeDonationRewards(2500);
    expect(r.tokens).toBe(250);
    expect(r.tickets).toBe(2);
  });
  it("0€ = 0", () => {
    expect(computeDonationRewards(0)).toEqual({ tokens: 0, tickets: 0 });
  });
  it("getCause connaît asso-vida + trees + ocean + peace", () => {
    expect(getCause("asso-vida")).toBeDefined();
    expect(getCause("trees")).toBeDefined();
    expect(getCause("ocean")).toBeDefined();
    expect(getCause("peace")).toBeDefined();
    expect(getCause("invalid")).toBeUndefined();
  });
  it("4 causes exposées", () => {
    expect(DONATION_CAUSES).toHaveLength(4);
  });
});
