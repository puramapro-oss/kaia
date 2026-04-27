import { describe, it, expect } from "vitest";
import { isAccountAgeOk, isProofUrlValid, isAllowedHintDomain, ACCOUNT_AGE_DAYS } from "../anti-fraud";

describe("isAccountAgeOk", () => {
  it("compte créé il y a 30j → ok", () => {
    const old = new Date(Date.now() - 30 * 86400 * 1000);
    expect(isAccountAgeOk(old)).toBe(true);
  });
  it("compte créé hier → ko", () => {
    const yesterday = new Date(Date.now() - 86400 * 1000);
    expect(isAccountAgeOk(yesterday)).toBe(false);
  });
  it("seuil 7 jours respecté", () => {
    expect(ACCOUNT_AGE_DAYS).toBe(7);
  });
  it("date invalide → false", () => {
    expect(isAccountAgeOk("invalid")).toBe(false);
  });
});

describe("isProofUrlValid", () => {
  it("https valide", () => {
    expect(isProofUrlValid("https://www.instagram.com/p/ABC123/")).toEqual({ valid: true });
  });
  it("http valide", () => {
    expect(isProofUrlValid("http://example.com/x")).toEqual({ valid: true });
  });
  it("javascript: rejeté", () => {
    const r = isProofUrlValid("javascript:alert(1)");
    expect(r.valid).toBe(false);
  });
  it("vide → invalide", () => {
    expect(isProofUrlValid("")).toEqual({ valid: false, reason: "empty" });
  });
  it("texte simple → invalide", () => {
    const r = isProofUrlValid("not a url");
    expect(r.valid).toBe(false);
  });
});

describe("isAllowedHintDomain", () => {
  it("instagram.com → true", () => {
    expect(isAllowedHintDomain("https://www.instagram.com/p/abc")).toBe(true);
  });
  it("tiktok.com → true", () => {
    expect(isAllowedHintDomain("https://www.tiktok.com/@user/video/123")).toBe(true);
  });
  it("random domain → false", () => {
    expect(isAllowedHintDomain("https://random-spam.io/x")).toBe(false);
  });
});
