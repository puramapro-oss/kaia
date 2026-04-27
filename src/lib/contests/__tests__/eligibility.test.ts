import { describe, it, expect } from "vitest";
import { computeEligibleTickets } from "../eligibility";

describe("computeEligibleTickets", () => {
  it("0 input → 0 ticket", () => {
    const r = computeEligibleTickets({
      routinesCompleted: 0,
      isActiveSubscriber: false,
      referralsConverted: 0,
      ritualsParticipated: 0,
      tokensSpentShop: 0,
    });
    expect(r.total).toBe(0);
    expect(r.breakdown).toEqual([]);
  });

  it("abonné + 5 routines → 5 + 5 = 10 tickets", () => {
    const r = computeEligibleTickets({
      routinesCompleted: 5,
      isActiveSubscriber: true,
      referralsConverted: 0,
      ritualsParticipated: 0,
      tokensSpentShop: 0,
    });
    expect(r.total).toBe(10);
    expect(r.breakdown.find((b) => b.source === "practice")?.tickets).toBe(5);
    expect(r.breakdown.find((b) => b.source === "subscription")?.tickets).toBe(5);
  });

  it("100 tokens shop = 1 ticket, 250 = 2", () => {
    expect(
      computeEligibleTickets({
        routinesCompleted: 0,
        isActiveSubscriber: false,
        referralsConverted: 0,
        ritualsParticipated: 0,
        tokensSpentShop: 100,
      }).total
    ).toBe(1);
    expect(
      computeEligibleTickets({
        routinesCompleted: 0,
        isActiveSubscriber: false,
        referralsConverted: 0,
        ritualsParticipated: 0,
        tokensSpentShop: 250,
      }).total
    ).toBe(2);
  });

  it("rituels + parrainages cumulent", () => {
    const r = computeEligibleTickets({
      routinesCompleted: 0,
      isActiveSubscriber: false,
      referralsConverted: 3,
      ritualsParticipated: 2,
      tokensSpentShop: 0,
    });
    expect(r.total).toBe(5);
  });

  it("plafond 50 tickets respecté", () => {
    const r = computeEligibleTickets({
      routinesCompleted: 100,
      isActiveSubscriber: true,
      referralsConverted: 0,
      ritualsParticipated: 0,
      tokensSpentShop: 0,
    });
    expect(r.total).toBe(50);
  });

  it("inputs négatifs / décimaux → safe floor", () => {
    const r = computeEligibleTickets({
      routinesCompleted: -3,
      isActiveSubscriber: false,
      referralsConverted: 1.7,
      ritualsParticipated: 0,
      tokensSpentShop: 0,
    });
    expect(r.total).toBe(1);
  });
});
