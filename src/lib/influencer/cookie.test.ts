import { describe, expect, it } from "vitest";
import {
  serializeInfluencerCookie,
  parseInfluencerCookie,
  INFLUENCER_COOKIE_TTL_DAYS,
} from "./cookie";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("influencer/cookie", () => {
  it("serialise + parse round-trip", () => {
    const value = {
      linkId: VALID_UUID,
      code: "TISSMA50WK",
      clickedAt: new Date().toISOString(),
    };
    const raw = serializeInfluencerCookie(value);
    const parsed = parseInfluencerCookie(raw);
    expect(parsed).toEqual(value);
  });

  it("retourne null si raw absent ou format invalide", () => {
    expect(parseInfluencerCookie(null)).toBeNull();
    expect(parseInfluencerCookie(undefined)).toBeNull();
    expect(parseInfluencerCookie("")).toBeNull();
    expect(parseInfluencerCookie("oops")).toBeNull();
    expect(parseInfluencerCookie("uuid|code")).toBeNull(); // 2 parts au lieu de 3
  });

  it("retourne null si linkId pas un UUID-ish", () => {
    expect(
      parseInfluencerCookie(`not-a-uuid|CODE|${new Date().toISOString()}`)
    ).toBeNull();
  });

  it("retourne null si clickedAt invalide", () => {
    expect(
      parseInfluencerCookie(`${VALID_UUID}|CODE|not-a-date`)
    ).toBeNull();
  });

  it("retourne null si cookie expiré (> 30j)", () => {
    const oldDate = new Date(
      Date.now() - (INFLUENCER_COOKIE_TTL_DAYS + 1) * 24 * 60 * 60 * 1000
    ).toISOString();
    expect(parseInfluencerCookie(`${VALID_UUID}|CODE|${oldDate}`)).toBeNull();
  });
});
