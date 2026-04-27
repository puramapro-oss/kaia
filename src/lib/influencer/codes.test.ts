import { describe, expect, it } from "vitest";
import {
  slugifyForCode,
  randomSuffix,
  composeCode,
  isValidCodeFormat,
  previewCodeFor,
} from "./codes";

describe("influencer/codes", () => {
  it("slugifie un nom standard en uppercase ASCII", () => {
    expect(slugifyForCode("Tissma Frasne")).toBe("TISSMAFRASNE");
    expect(slugifyForCode("Luna  Lou")).toBe("LUNALOU");
  });

  it("retire les accents (NFD decomposition)", () => {
    expect(slugifyForCode("Émilie Côté")).toBe("EMILIECOTE");
    expect(slugifyForCode("Naïma")).toBe("NAIMA");
  });

  it("retire les caractères spéciaux", () => {
    expect(slugifyForCode("@tissma_42!")).toBe("TISSMA42");
    expect(slugifyForCode("hello world.com")).toBe("HELLOWORLDCO");
  });

  it("tronque à 12 chars max", () => {
    expect(slugifyForCode("aaaaaaaaaaaaaaaaaaaa")).toBe("AAAAAAAAAAAA");
    expect(slugifyForCode("aaaaaaaaaaaaaaaaaaaa").length).toBe(12);
  });

  it("retourne vide si rien d'utilisable", () => {
    expect(slugifyForCode("!@#$%^&*()")).toBe("");
    expect(slugifyForCode("")).toBe("");
  });

  it("randomSuffix génère 4 chars hex uppercase", () => {
    const s = randomSuffix();
    expect(s).toHaveLength(4);
    expect(s).toMatch(/^[0-9A-F]{4}$/);
  });

  it("randomSuffix avec rng déterministe", () => {
    const rng = (() => {
      let i = 0;
      const seq = [0, 0.5, 0.99, 0.1];
      return () => seq[i++ % seq.length];
    })();
    const s = randomSuffix(rng);
    // 0 → 0, 0.5*16=8 → 8, 0.99*16=15 → F, 0.1*16=1 → 1
    expect(s).toBe("08F1");
  });

  it("composeCode utilise base + suffix", () => {
    expect(composeCode("TISSMA", "ABCD")).toBe("TISSMAABCD");
  });

  it("composeCode fallback KAIA si base trop court", () => {
    expect(composeCode("AB", "1234")).toBe("KAIA1234");
    expect(composeCode("", "1234")).toBe("KAIA1234");
  });

  it("composeCode tronque à 16 chars", () => {
    expect(composeCode("AAAAAAAAAAAA", "BBBB").length).toBe(16);
  });

  it("isValidCodeFormat valide A-Z 0-9 longueur 3-16", () => {
    expect(isValidCodeFormat("TISSMA50")).toBe(true);
    expect(isValidCodeFormat("AB")).toBe(false);
    expect(isValidCodeFormat("TISSMA-50")).toBe(false);
    expect(isValidCodeFormat("tissma50")).toBe(false);
    expect(isValidCodeFormat("AAAAAAAAAAAAAAAAA")).toBe(false);
  });

  it("previewCodeFor produit un code complet conforme format", () => {
    const code = previewCodeFor("Tissma Frasne", () => 0);
    expect(isValidCodeFormat(code)).toBe(true);
    expect(code).toBe("TISSMAFRASNE0000".slice(0, 16));
  });
});
