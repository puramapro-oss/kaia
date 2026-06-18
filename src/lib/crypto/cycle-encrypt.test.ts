import { describe, it, expect, beforeAll } from "vitest";
import { encryptCycleNote, decryptCycleNote } from "./cycle-encrypt";

beforeAll(() => {
  process.env.CYCLE_ENCRYPT_KEY = "a".repeat(64);
});

describe("cycle-encrypt", () => {
  it("encrypts a note (returns non-empty string)", () => {
    const result = encryptCycleNote("test note");
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
    expect((result as string).length).toBeGreaterThan(0);
  });

  it("round-trips plain text", () => {
    const plain = "douleur abdominale légère";
    const enc = encryptCycleNote(plain);
    expect(enc).not.toBeNull();
    const dec = decryptCycleNote(enc as string);
    expect(dec).toBe(plain);
  });

  it("different encryptions produce different ciphertexts", () => {
    const enc1 = encryptCycleNote("hello");
    const enc2 = encryptCycleNote("hello");
    expect(enc1).not.toBe(enc2);
  });

  it("returns null with invalid key length", () => {
    process.env.CYCLE_ENCRYPT_KEY = "short";
    const result = encryptCycleNote("test");
    expect(result).toBeNull();
    process.env.CYCLE_ENCRYPT_KEY = "a".repeat(64);
  });

  it("returns null on tampered ciphertext", () => {
    const enc = encryptCycleNote("secret") as string;
    const tampered = enc.slice(0, -4) + "XXXX";
    const dec = decryptCycleNote(tampered);
    expect(dec).toBeNull();
  });
});
