import { describe, it, expect } from "vitest";
import { passLocalFilter, detectCrisis, getCrisisResponse } from "./safety";

describe("passLocalFilter", () => {
  it("allows safe cycle text", () => {
    expect(passLocalFilter("J'ai mal au ventre pendant ma phase lutéale")).toBe(true);
  });

  it("blocks 'prescris' (FR)", () => {
    expect(passLocalFilter("je vous prescris de l'ibuprofène")).toBe(false);
  });

  it("blocks 'prescribe' (EN)", () => {
    expect(passLocalFilter("I prescribe you this medication")).toBe(false);
  });

  it("blocks 'antibiotique'", () => {
    expect(passLocalFilter("prends cet antibiotique")).toBe(false);
  });

  it("blocks 'diagnostic confirmé'", () => {
    expect(passLocalFilter("diagnostic confirmé: endométriose")).toBe(false);
  });

  it("allows luna emotional support text", () => {
    expect(passLocalFilter("je suis là pour toi, prends soin de toi")).toBe(true);
  });

  it("is case-insensitive — 'Antibiotique'", () => {
    expect(passLocalFilter("Prends cet Antibiotique")).toBe(false);
  });

  it("allows empty string", () => {
    expect(passLocalFilter("")).toBe(true);
  });
});

describe("detectCrisis", () => {
  it("detects 'mourir' keyword", () => {
    expect(detectCrisis("je veux mourir")).toBe(true);
  });

  it("detects 'suicid' stem", () => {
    expect(detectCrisis("je pense au suicide")).toBe(true);
  });

  it("detects 'end my life' (EN)", () => {
    expect(detectCrisis("I want to end my life")).toBe(true);
  });

  it("returns false for fatigue text", () => {
    expect(detectCrisis("je suis très fatiguée ce matin")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(detectCrisis("Je Veux Mourir")).toBe(true);
  });
});

describe("getCrisisResponse", () => {
  it("mentions 3114", () => {
    expect(getCrisisResponse()).toContain("3114");
  });

  it("mentions SAMU 15 or 112", () => {
    const r = getCrisisResponse();
    expect(r.includes("15") || r.includes("112")).toBe(true);
  });
});
