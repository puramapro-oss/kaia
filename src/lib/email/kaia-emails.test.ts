import { describe, it, expect } from "vitest";
import { buildKaiaEmail, unsubscribeUrl, type KaiaEmailKind } from "./kaia-emails";

const KINDS: KaiaEmailKind[] = [
  "welcome",
  "first_cycle_guide",
  "aurora_invitation",
  "prime_j1",
  "weekly_recap",
  "reactivation_j14",
  "reactivation_j30",
];

describe("kaia lifecycle emails", () => {
  it("chaque email a un sujet, du HTML et un lien de désinscription RGPD", () => {
    for (const kind of KINDS) {
      const { subject, html } = buildKaiaEmail(kind, { firstName: "Léa", unsubToken: "tk-1", phase: "luteale" });
      expect(subject.length).toBeGreaterThan(0);
      expect(html).toContain("<!doctype html>");
      expect(html).toContain(unsubscribeUrl("tk-1"));
      expect(html).toContain("Me désinscrire");
      // Identité LUNA préservée : jamais "Claude"/"Anthropic" dans le contenu.
      expect(/claude|anthropic|gpt/i.test(html)).toBe(false);
    }
  });

  it("prime_j1 affiche le montant fourni", () => {
    const { subject, html } = buildKaiaEmail("prime_j1", { unsubToken: "t", primeEur: 25 });
    expect(subject).toContain("25");
    expect(html).toContain("+25€");
  });

  it("se rabat sur 'toi' si aucun prénom", () => {
    const { html } = buildKaiaEmail("welcome", { unsubToken: "t" });
    expect(html).toContain("Bienvenue, toi");
  });
});
