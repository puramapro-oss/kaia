import { describe, it, expect } from "vitest";
import {
  isAdminEmail,
  hashPin,
  verifyPin,
  verifyTotp,
  generateSessionToken,
  hashSessionToken,
  generateRecoveryCodes,
} from "./auth";
import { ADMIN_EMAIL } from "@/lib/constants";

describe("isAdminEmail", () => {
  it("accepts the super-admin email (case-insensitive)", () => {
    expect(isAdminEmail(ADMIN_EMAIL)).toBe(true);
    expect(isAdminEmail(ADMIN_EMAIL.toUpperCase())).toBe(true);
  });

  it("rejects null/empty and other emails", () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail("someone@else.com")).toBe(false);
  });
});

describe("PIN hashing", () => {
  it("rejects PINs that are not 4-8 digits", async () => {
    await expect(hashPin("123")).rejects.toThrow();
    await expect(hashPin("abcd")).rejects.toThrow();
    await expect(hashPin("123456789")).rejects.toThrow();
  });

  it("hashes and verifies a valid PIN", async () => {
    const hash = await hashPin("1234");
    expect(hash).not.toBe("1234");
    expect(await verifyPin("1234", hash)).toBe(true);
    expect(await verifyPin("4321", hash)).toBe(false);
  });

  it("verifyPin returns false on empty inputs", async () => {
    expect(await verifyPin("", "x")).toBe(false);
    expect(await verifyPin("1234", "")).toBe(false);
  });
});

describe("verifyTotp", () => {
  it("returns false on empty token or secret", async () => {
    expect(await verifyTotp("", "SECRET")).toBe(false);
    expect(await verifyTotp("123456", "")).toBe(false);
  });
});

describe("session tokens", () => {
  it("hashes a raw token deterministically (sha256)", () => {
    const { raw, hash } = generateSessionToken();
    expect(hash).toHaveLength(64);
    expect(hashSessionToken(raw)).toBe(hash);
  });

  it("generates distinct tokens", () => {
    expect(generateSessionToken().raw).not.toBe(generateSessionToken().raw);
  });
});

describe("recovery codes", () => {
  it("generates the requested count of formatted codes", () => {
    const codes = generateRecoveryCodes(8);
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const c of codes) expect(c).toMatch(/^[0-9A-F]{5}-[0-9A-F]{5}$/);
  });
});
