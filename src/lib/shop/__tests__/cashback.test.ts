import { describe, it, expect } from "vitest";
import { computeShopRewards } from "../cashback";

describe("computeShopRewards", () => {
  it("14,99€ → 74 tokens, 0 ticket", () => {
    expect(computeShopRewards(1499)).toEqual({ cashbackTokens: 74, ticketsEarned: 0 });
  });
  it("99,90€ → 499 tokens, 4 tickets", () => {
    expect(computeShopRewards(9990)).toEqual({ cashbackTokens: 499, ticketsEarned: 4 });
  });
  it("0€ = 0/0", () => {
    expect(computeShopRewards(0)).toEqual({ cashbackTokens: 0, ticketsEarned: 0 });
  });
  it("inputs négatifs → 0", () => {
    expect(computeShopRewards(-100)).toEqual({ cashbackTokens: 0, ticketsEarned: 0 });
  });
  it("4,99€ → 24 tokens", () => {
    expect(computeShopRewards(499)).toEqual({ cashbackTokens: 24, ticketsEarned: 0 });
  });
});
