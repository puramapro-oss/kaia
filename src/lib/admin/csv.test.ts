import { describe, it, expect } from "vitest";
import { toCsv } from "./csv";

interface Row {
  email: string;
  name: string | null;
  n: number;
}

const cols = [
  { key: "email", header: "Email", value: (r: Row) => r.email },
  { key: "name", header: "Nom", value: (r: Row) => r.name },
  { key: "n", header: "N", value: (r: Row) => r.n },
];

describe("toCsv", () => {
  it("écrit l'entête + les lignes", () => {
    const csv = toCsv([{ email: "a@b.c", name: "Léa", n: 3 }], cols);
    expect(csv).toBe("Email,Nom,N\r\na@b.c,Léa,3");
  });

  it("échappe virgules, guillemets, retours ligne (RFC 4180)", () => {
    const csv = toCsv([{ email: 'x"y', name: "a,b\nc", n: 1 }], cols);
    expect(csv).toContain('"x""y"');
    expect(csv).toContain('"a,b\nc"');
  });

  it("neutralise l'injection de formule et gère null", () => {
    const csv = toCsv([{ email: "=cmd()", name: null, n: 0 }], cols);
    expect(csv).toContain("'=cmd()");
    expect(csv).toBe("Email,Nom,N\r\n'=cmd(),,0");
  });
});
