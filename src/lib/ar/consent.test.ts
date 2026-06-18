import { describe, it, expect } from "vitest";
import {
  buildConsentPayload,
  encodeConsent,
  parseConsentPayload,
  isConsentValid,
  CONSENT_TTL_SEC,
} from "./consent";

const base = { userId: "u-1", style: "A" as const, protocolSlug: "calme-interieur", issuedAt: 1_000_000 };

describe("consent encode/parse roundtrip", () => {
  it("rebuilds an identical payload", () => {
    const payload = buildConsentPayload(base);
    const parsed = parseConsentPayload(encodeConsent(payload));
    expect(parsed).toEqual(payload);
  });

  it("rejects malformed or wrong-version payloads", () => {
    expect(parseConsentPayload("not json")).toBeNull();
    expect(parseConsentPayload(JSON.stringify({ ...base, v: 99 }))).toBeNull();
  });
});

describe("isConsentValid", () => {
  it("accepts a fresh consent within the TTL", () => {
    const payload = buildConsentPayload(base);
    expect(isConsentValid(payload, base.issuedAt + CONSENT_TTL_SEC * 1000)).toBe(true);
  });

  it("rejects an expired or future consent", () => {
    const payload = buildConsentPayload(base);
    expect(isConsentValid(payload, base.issuedAt + (CONSENT_TTL_SEC + 1) * 1000)).toBe(false);
    expect(isConsentValid(payload, base.issuedAt - 1000)).toBe(false);
  });
});
