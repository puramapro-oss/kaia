import { describe, it, expect } from "vitest";
import {
  buildInvite,
  invitePath,
  parseInviteParams,
  isInviteValid,
  INVITE_TTL_MS,
  GUEST_ACCESS_MIN_AGE,
} from "./invite";

const base = { spaceId: "sp-1", token: "tok-abc", issuedAt: 1_000_000 };

describe("transmission invite", () => {
  it("roundtrip lien → parse", () => {
    const inv = buildInvite({ ...base, role: "fille" });
    const url = invitePath(inv);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(parseInviteParams(params)).toEqual({ spaceId: "sp-1", token: "tok-abc", role: "fille" });
  });

  it("guestAllowed seulement pour une mère ≥ 50 ans", () => {
    expect(buildInvite({ ...base, role: "mere", inviteeAge: GUEST_ACCESS_MIN_AGE }).guestAllowed).toBe(true);
    expect(buildInvite({ ...base, role: "mere", inviteeAge: 40 }).guestAllowed).toBe(false);
    expect(buildInvite({ ...base, role: "fille", inviteeAge: 60 }).guestAllowed).toBe(false);
    expect(buildInvite({ ...base, role: "mere" }).guestAllowed).toBe(false);
  });

  it("parseInviteParams rejette les paramètres incomplets ou rôle invalide", () => {
    expect(parseInviteParams(new URLSearchParams("s=sp-1&t=tok"))).toBeNull();
    expect(parseInviteParams(new URLSearchParams("s=sp-1&t=tok&r=cousine"))).toBeNull();
  });

  it("isInviteValid respecte la fenêtre TTL et refuse le futur", () => {
    const inv = buildInvite({ ...base, role: "fille" });
    expect(isInviteValid(inv, base.issuedAt)).toBe(true);
    expect(isInviteValid(inv, base.issuedAt + INVITE_TTL_MS)).toBe(true);
    expect(isInviteValid(inv, base.issuedAt + INVITE_TTL_MS + 1)).toBe(false);
    expect(isInviteValid(inv, base.issuedAt - 1)).toBe(false);
  });
});
