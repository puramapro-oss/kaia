import { describe, expect, it } from "vitest";
import {
  BCP47_MAP,
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  RTL_LOCALES,
  SUPPORTED_LOCALES,
  isLocale,
  isRtl,
  pickLocaleFromHeader,
} from "../locales";

describe("locales — registre", () => {
  it("expose 35 locales supportées", () => {
    expect(SUPPORTED_LOCALES.length).toBe(35);
  });

  it("DEFAULT_LOCALE = fr", () => {
    expect(DEFAULT_LOCALE).toBe("fr");
    expect(SUPPORTED_LOCALES.includes(DEFAULT_LOCALE)).toBe(true);
  });

  it("chaque locale a un label natif", () => {
    for (const l of SUPPORTED_LOCALES) {
      expect(LOCALE_LABELS[l], `label manquant pour ${l}`).toBeTruthy();
      expect(typeof LOCALE_LABELS[l]).toBe("string");
    }
  });

  it("chaque locale a un BCP-47 mapping", () => {
    for (const l of SUPPORTED_LOCALES) {
      expect(BCP47_MAP[l], `BCP-47 manquant pour ${l}`).toMatch(/^[a-z]{2,3}(-[A-Z][a-zA-Z]+)?$/);
    }
  });

  it("RTL_LOCALES = ar, fa, he, ur uniquement", () => {
    expect(RTL_LOCALES.sort()).toEqual(["ar", "fa", "he", "ur"]);
  });
});

describe("isLocale", () => {
  it("accepte une locale supportée", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("zh")).toBe(true);
    expect(isLocale("pt-BR")).toBe(true);
  });

  it("refuse une locale inconnue", () => {
    expect(isLocale("xx")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale("FR")).toBe(false); // case-sensitive
  });
});

describe("isRtl", () => {
  it("ar/fa/he/ur sont RTL", () => {
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("fa")).toBe(true);
    expect(isRtl("he")).toBe(true);
    expect(isRtl("ur")).toBe(true);
  });

  it("fr/en/zh sont LTR", () => {
    expect(isRtl("fr")).toBe(false);
    expect(isRtl("en")).toBe(false);
    expect(isRtl("zh")).toBe(false);
  });
});

describe("pickLocaleFromHeader", () => {
  it("Accept-Language vide → DEFAULT_LOCALE", () => {
    expect(pickLocaleFromHeader(null)).toBe("fr");
    expect(pickLocaleFromHeader("")).toBe("fr");
  });

  it("Match exact pt-BR", () => {
    expect(pickLocaleFromHeader("pt-BR,en;q=0.5")).toBe("pt-BR");
  });

  it("Match primary tag (de-AT → de)", () => {
    expect(pickLocaleFromHeader("de-AT,en;q=0.5")).toBe("de");
  });

  it("Trie par quality (en;q=0.9 > es;q=0.5)", () => {
    expect(pickLocaleFromHeader("zh-Hant;q=0.1,en;q=0.9,es;q=0.5")).toBe("en");
  });

  it("Locale inconnue → DEFAULT_LOCALE", () => {
    expect(pickLocaleFromHeader("xx-YY,zz")).toBe("fr");
  });

  it("Match insensible à la casse pour primary tag", () => {
    expect(pickLocaleFromHeader("ES")).toBe("es");
    expect(pickLocaleFromHeader("AR")).toBe("ar");
  });
});
