import { describe, expect, it } from "vitest";
import {
  EARN_RULES,
  getEarnAmount,
  computeShopCashback,
  computeDonationTokens,
} from "./earn-rules";

describe("earn-rules", () => {
  it("expose toutes les raisons attendues du BRIEF §11.1", () => {
    expect(EARN_RULES.routine_completed.baseTokens).toBe(10);
    expect(EARN_RULES.practice_completed.baseTokens).toBe(5);
    expect(EARN_RULES.streak_7_bonus.baseTokens).toBe(50);
    expect(EARN_RULES.streak_30_bonus.baseTokens).toBe(200);
    expect(EARN_RULES.ritual_completed.baseTokens).toBe(30);
    expect(EARN_RULES.referral_converted.baseTokens).toBe(200);
  });

  it("getEarnAmount renvoie le base de la rule par défaut", () => {
    expect(getEarnAmount("routine_completed")).toBe(10);
    expect(getEarnAmount("practice_completed")).toBe(5);
  });

  it("getEarnAmount accepte un override pour les missions à montant variable", () => {
    expect(getEarnAmount("mission_humanitarian", 100)).toBe(100);
    expect(getEarnAmount("mission_humanitarian", 0)).toBe(0);
  });

  it("getEarnAmount ignore un override négatif (sécurité)", () => {
    expect(getEarnAmount("mission_solo", -5)).toBe(50);
  });

  it("computeShopCashback applique 5% du montant en tokens", () => {
    // 1€ = 100 tokens, 5% = 5 tokens.
    expect(computeShopCashback(1)).toBe(5);
    expect(computeShopCashback(20)).toBe(100);
    expect(computeShopCashback(0)).toBe(0);
    expect(computeShopCashback(-5)).toBe(0);
  });

  it("computeDonationTokens renvoie 1 token / 0.10€ (BRIEF §11.1)", () => {
    expect(computeDonationTokens(1)).toBe(10);
    expect(computeDonationTokens(10)).toBe(100);
    expect(computeDonationTokens(0)).toBe(0);
    expect(computeDonationTokens(-1)).toBe(0);
  });

  it("EARN_RULES marque correctement les raisons serverOnly", () => {
    expect(EARN_RULES.donation_per_10cents.serverOnly).toBe(true);
    expect(EARN_RULES.shop_purchase_cashback.serverOnly).toBe(true);
    expect(EARN_RULES.referral_converted.serverOnly).toBe(true);
    expect(EARN_RULES.practice_completed.serverOnly).toBeUndefined();
  });
});
