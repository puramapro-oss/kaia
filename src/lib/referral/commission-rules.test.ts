import { describe, expect, it } from "vitest";
import {
  computeReferralCommission,
  computeReferralClawback,
  isSubscriptionSource,
  REFERRAL_FIRST_PERCENT,
  REFERRAL_RECURRING_PERCENT,
  REFERRAL_SHOP_PERCENT,
  REFERRAL_CONVERTED_TOKENS_BONUS,
  REFERRAL_REFEREE_WELCOME_TOKENS,
} from "./commission-rules";

describe("referral/commission-rules", () => {
  it("calcule 50% du 1er paiement (BRIEF §10)", () => {
    const r = computeReferralCommission({ amountCents: 1499, source: "subscription_first" });
    expect(r.percent).toBe(REFERRAL_FIRST_PERCENT);
    expect(r.commissionCents).toBe(749);
  });

  it("calcule 10% des paiements récurrents", () => {
    const r = computeReferralCommission({ amountCents: 1499, source: "subscription_recurring" });
    expect(r.percent).toBe(REFERRAL_RECURRING_PERCENT);
    expect(r.commissionCents).toBe(149);
  });

  it("calcule 5% des achats shop", () => {
    const r = computeReferralCommission({ amountCents: 5000, source: "shop_purchase" });
    expect(r.percent).toBe(REFERRAL_SHOP_PERCENT);
    expect(r.commissionCents).toBe(250);
  });

  it("retourne 0 sur montants <= 0", () => {
    expect(computeReferralCommission({ amountCents: 0, source: "subscription_first" }).commissionCents).toBe(0);
    expect(computeReferralCommission({ amountCents: -100, source: "shop_purchase" }).commissionCents).toBe(0);
  });

  it("clawback retourne montant négatif selon source", () => {
    expect(computeReferralClawback(1499, "subscription_first")).toBe(-749);
    expect(computeReferralClawback(1499, "subscription_recurring")).toBe(-149);
    expect(computeReferralClawback(5000, "shop_purchase")).toBe(-250);
  });

  it("isSubscriptionSource — true pour first/recurring, false pour shop", () => {
    expect(isSubscriptionSource("subscription_first")).toBe(true);
    expect(isSubscriptionSource("subscription_recurring")).toBe(true);
    expect(isSubscriptionSource("shop_purchase")).toBe(false);
  });

  it("constantes de bonus tokens BRIEF §10 + §11.1", () => {
    expect(REFERRAL_CONVERTED_TOKENS_BONUS).toBe(200);
    expect(REFERRAL_REFEREE_WELCOME_TOKENS).toBe(200);
  });

  it("floor garanti — jamais sur-créditer", () => {
    // 999 * 0.10 = 99.9 → floor 99
    expect(computeReferralCommission({ amountCents: 999, source: "subscription_recurring" }).commissionCents).toBe(99);
  });
});
