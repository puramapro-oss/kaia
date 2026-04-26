import { describe, expect, it } from "vitest";
import {
  SUBSCRIPTION_DISCOUNTS,
  CONTEST_TICKET_COST,
  validateSpend,
  tokensToEuros,
  eurosToTokens,
} from "./spend-rules";

describe("spend-rules", () => {
  it("conversions tokens↔euros (1€ = 100 tokens, BRIEF §11.2)", () => {
    expect(tokensToEuros(100)).toBe(1);
    expect(tokensToEuros(2500)).toBe(25);
    expect(tokensToEuros(0)).toBe(0);
    expect(eurosToTokens(1)).toBe(100);
    expect(eurosToTokens(0.5)).toBe(50);
  });

  it("validateSpend refuse le solde insuffisant", () => {
    const r = validateSpend("contest_ticket", 100);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("insufficient_balance");
      expect(r.needed).toBe(CONTEST_TICKET_COST);
      expect(r.have).toBe(100);
    }
  });

  it("validateSpend autorise un ticket contest si solde suffisant", () => {
    const r = validateSpend("contest_ticket", 1000);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.cost).toBe(CONTEST_TICKET_COST);
  });

  it("validateSpend gère les paliers de réduction abonnement", () => {
    for (const pct of [10, 20, 30, 50] as const) {
      const r = validateSpend("promo_subscription_pct", 100000, { discountPct: pct });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.cost).toBe(SUBSCRIPTION_DISCOUNTS[pct].tokens);
    }
  });

  it("validateSpend rejette un kind invalide", () => {
    const r = validateSpend("promo_subscription_pct", 100000); // sans discountPct
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invalid_kind");
  });

  it("validateSpend exige itemCostTokens pour shop_product", () => {
    const r = validateSpend("shop_product", 1000);
    expect(r.ok).toBe(false);
    const r2 = validateSpend("shop_product", 1000, { itemCostTokens: 500 });
    expect(r2.ok).toBe(true);
    if (r2.ok) expect(r2.cost).toBe(500);
  });
});
