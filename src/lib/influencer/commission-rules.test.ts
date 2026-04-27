import { describe, expect, it } from "vitest";
import {
  computeInfluencerCommission,
  computeInfluencerClawback,
  clampPercent,
  DEFAULT_INFLUENCER_FIRST_PERCENT,
  DEFAULT_INFLUENCER_RECURRING_PERCENT,
} from "./commission-rules";

describe("influencer/commission-rules", () => {
  it("calcule 50% du 1er paiement par défaut (BRIEF §9.3)", () => {
    const r = computeInfluencerCommission({ amountCents: 1499, isFirstPayment: true });
    expect(r.kind).toBe("first_payment");
    expect(r.percent).toBe(DEFAULT_INFLUENCER_FIRST_PERCENT);
    expect(r.commissionCents).toBe(749); // 1499 * 0.50 floor
  });

  it("calcule 10% récurrent par défaut", () => {
    const r = computeInfluencerCommission({ amountCents: 1499, isFirstPayment: false });
    expect(r.kind).toBe("recurring");
    expect(r.percent).toBe(DEFAULT_INFLUENCER_RECURRING_PERCENT);
    expect(r.commissionCents).toBe(149); // 1499 * 0.10 floor
  });

  it("respecte les % custom du link (admin override)", () => {
    const r = computeInfluencerCommission({
      amountCents: 10000,
      isFirstPayment: true,
      link: { base_commission_first: 25, lifetime_commission: 5 },
    });
    expect(r.percent).toBe(25);
    expect(r.commissionCents).toBe(2500);
  });

  it("clampe les % hors bornes (sécurité saisie)", () => {
    expect(clampPercent(150, 50)).toBe(100);
    expect(clampPercent(-10, 50)).toBe(0);
    expect(clampPercent(NaN, 50)).toBe(50);
    expect(clampPercent(33.7, 50)).toBe(34);
  });

  it("retourne 0 pour montants <= 0 (sécurité refunds négatifs)", () => {
    expect(computeInfluencerCommission({ amountCents: 0, isFirstPayment: true }).commissionCents).toBe(0);
    expect(computeInfluencerCommission({ amountCents: -100, isFirstPayment: true }).commissionCents).toBe(0);
  });

  it("clawback retourne montant négatif (= 50% du refund)", () => {
    expect(computeInfluencerClawback(1499)).toBe(-749);
    expect(computeInfluencerClawback(0)).toBe(0);
    expect(computeInfluencerClawback(-50)).toBe(0);
  });

  it("floor garanti — jamais sur-créditer (anti-fraud)", () => {
    // 999 * 50/100 = 499.5 → floor 499
    const r = computeInfluencerCommission({ amountCents: 999, isFirstPayment: true });
    expect(r.commissionCents).toBe(499);
  });

  it("link partial (null fields) → fallback aux defaults", () => {
    const r = computeInfluencerCommission({
      amountCents: 1000,
      isFirstPayment: true,
      link: { base_commission_first: null, lifetime_commission: null },
    });
    expect(r.percent).toBe(DEFAULT_INFLUENCER_FIRST_PERCENT);
    expect(r.commissionCents).toBe(500);
  });
});
