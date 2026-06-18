import { describe, it, expect } from "vitest";
import { signUnsubToken, verifyUnsubToken } from "./unsub-token";

describe("unsub token", () => {
  it("roundtrip sign → verify", () => {
    const uid = "user-123e4567";
    expect(verifyUnsubToken(signUnsubToken(uid))).toBe(uid);
  });

  it("rejette un token altéré ou malformé", () => {
    const token = signUnsubToken("user-abc");
    expect(verifyUnsubToken(token.slice(0, -2) + "xy")).toBeNull();
    expect(verifyUnsubToken("garbage")).toBeNull();
    expect(verifyUnsubToken("a.b.c")).toBeNull();
  });
});
