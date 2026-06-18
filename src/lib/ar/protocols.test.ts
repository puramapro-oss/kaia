import { describe, it, expect } from "vitest";
import { AR_PROTOCOLS, getARProtocol, protocolsForTarget } from "./protocols";

describe("AR_PROTOCOLS", () => {
  it("contains exactly 10 protocols mirroring the DB seed", () => {
    expect(AR_PROTOCOLS).toHaveLength(10);
  });

  it("are all crisis-safe with unique slugs", () => {
    expect(AR_PROTOCOLS.every((p) => p.crisisSafe)).toBe(true);
    const slugs = new Set(AR_PROTOCOLS.map((p) => p.slug));
    expect(slugs.size).toBe(10);
  });

  it("resolves a protocol by slug", () => {
    expect(getARProtocol("guerison-coeur")?.name).toBe("Guérison du Cœur");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getARProtocol("inexistant")).toBeUndefined();
  });

  it("filters protocols by target type", () => {
    const animal = protocolsForTarget("animal");
    expect(animal.map((p) => p.slug)).toContain("animal-guide");
    expect(animal.every((p) => p.targetTypes.includes("animal"))).toBe(true);
  });
});
