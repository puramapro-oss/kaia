import { describe, it, expect } from "vitest";
import {
  isValidBudget,
  remainingBudget,
  adIsServable,
  pickAdToServe,
  AD_MIN_BUDGET_TOKENS,
  AD_MAX_BUDGET_TOKENS,
  type ServableAd,
} from "./rules";

const NOW = Date.UTC(2026, 5, 18, 12, 0, 0);

function ad(over: Partial<ServableAd>): ServableAd {
  return {
    id: "a",
    placement: "feed",
    active: true,
    moderation_status: "approved",
    budget_tokens: 100,
    spent_tokens: 0,
    start_at: null,
    end_at: null,
    ...over,
  };
}

describe("ads rules", () => {
  it("valide les bornes de budget", () => {
    expect(isValidBudget(AD_MIN_BUDGET_TOKENS)).toBe(true);
    expect(isValidBudget(AD_MAX_BUDGET_TOKENS)).toBe(true);
    expect(isValidBudget(AD_MIN_BUDGET_TOKENS - 1)).toBe(false);
    expect(isValidBudget(AD_MAX_BUDGET_TOKENS + 1)).toBe(false);
    expect(isValidBudget(100.5)).toBe(false);
  });

  it("remainingBudget ne descend jamais sous 0", () => {
    expect(remainingBudget({ budget_tokens: 100, spent_tokens: 130 })).toBe(0);
    expect(remainingBudget({ budget_tokens: 100, spent_tokens: 40 })).toBe(60);
  });

  it("adIsServable respecte statut, placement, budget, fenêtre", () => {
    expect(adIsServable(ad({}), "feed", NOW)).toBe(true);
    expect(adIsServable(ad({ moderation_status: "pending" }), "feed", NOW)).toBe(false);
    expect(adIsServable(ad({ active: false }), "feed", NOW)).toBe(false);
    expect(adIsServable(ad({}), "home", NOW)).toBe(false);
    expect(adIsServable(ad({ budget_tokens: 100, spent_tokens: 100 }), "feed", NOW)).toBe(false);
    expect(adIsServable(ad({ start_at: "2026-06-19" }), "feed", NOW)).toBe(false);
    expect(adIsServable(ad({ end_at: "2026-06-17" }), "feed", NOW)).toBe(false);
  });

  it("pickAdToServe choisit la moins servie puis le plus gros budget restant", () => {
    const a = ad({ id: "a", spent_tokens: 10 });
    const b = ad({ id: "b", spent_tokens: 5 });
    const c = ad({ id: "c", spent_tokens: 5, budget_tokens: 500 });
    expect(pickAdToServe([a, b, c], "feed", NOW)?.id).toBe("c");
    expect(pickAdToServe([], "feed", NOW)).toBeNull();
    expect(pickAdToServe([ad({ active: false })], "feed", NOW)).toBeNull();
  });
});
