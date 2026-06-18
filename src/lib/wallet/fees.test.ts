import { describe, it, expect } from "vitest";
import { quoteWithdrawal, feeRateFor, MIN_WITHDRAWAL_CENTS } from "./fees";

describe("feeRateFor", () => {
  it("applies the tiered rates", () => {
    expect(feeRateFor(20_00)).toBe(8.7);
    expect(feeRateFor(50_00)).toBe(4.8);
    expect(feeRateFor(200_00)).toBe(3.0);
    expect(feeRateFor(500_00)).toBe(3.0);
  });
});

describe("quoteWithdrawal", () => {
  it("rejects amounts below the minimum", () => {
    expect(quoteWithdrawal(MIN_WITHDRAWAL_CENTS - 1)).toBeNull();
    expect(quoteWithdrawal(0)).toBeNull();
  });

  it("rejects amounts above the maximum", () => {
    expect(quoteWithdrawal(1000_00)).not.toBeNull(); // exactly max → ok
    expect(quoteWithdrawal(1000_01)).toBeNull();
  });

  it("quotes a 20€ withdrawal at 8.7%", () => {
    const q = quoteWithdrawal(20_00)!;
    expect(q.ratePct).toBe(8.7);
    expect(q.feeCents).toBe(174); // ceil(2000 * 0.087)
    expect(q.netCents).toBe(20_00 - 174);
  });

  it("quotes a 200€ withdrawal at 3.0%", () => {
    const q = quoteWithdrawal(200_00)!;
    expect(q.feeCents).toBe(600);
    expect(q.netCents).toBe(200_00 - 600);
  });

  it("net + fee always equals the gross amount", () => {
    for (const amt of [20_00, 49_99, 50_00, 199_99, 1000_00]) {
      const q = quoteWithdrawal(amt)!;
      expect(q.netCents + q.feeCents).toBe(amt);
    }
  });
});
