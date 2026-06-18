import { describe, it, expect } from "vitest";
import { isBanned, evaluateBanGate, BANNED_PATH } from "./ban-gate";

describe("ban gate", () => {
  it("isBanned vrai seulement si banned_at non vide", () => {
    expect(isBanned("2026-06-18T00:00:00Z")).toBe(true);
    expect(isBanned(null)).toBe(false);
    expect(isBanned(undefined)).toBe(false);
    expect(isBanned("")).toBe(false);
  });

  it("non banni → jamais bloqué", () => {
    expect(evaluateBanGate({ bannedAt: null, pathname: "/accueil", isPublic: false }).blocked).toBe(false);
  });

  it("banni sur route privée → redirige vers /banned", () => {
    const d = evaluateBanGate({ bannedAt: "2026-06-18", pathname: "/accueil", isPublic: false });
    expect(d.blocked).toBe(true);
    expect(d.redirectTo).toBe(BANNED_PATH);
  });

  it("banni déjà sur /banned ou route publique → pas de blocage (évite boucle + permet logout)", () => {
    expect(evaluateBanGate({ bannedAt: "x", pathname: BANNED_PATH, isPublic: false }).blocked).toBe(false);
    expect(evaluateBanGate({ bannedAt: "x", pathname: "/login", isPublic: true }).blocked).toBe(false);
  });
});
