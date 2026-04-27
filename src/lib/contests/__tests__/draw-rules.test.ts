import { describe, it, expect } from "vitest";
import { drawContest, deriveSeed } from "../draw-rules";

const ENTRIES = [
  { userId: "u1", tickets: 1 },
  { userId: "u2", tickets: 1 },
  { userId: "u3", tickets: 1 },
  { userId: "u4", tickets: 10 },
  { userId: "u5", tickets: 5 },
];

describe("drawContest", () => {
  it("seed déterministe selon contestId+endsAt", () => {
    const a = deriveSeed("c1", "2026-04-30T23:59:59Z");
    const b = deriveSeed("c1", "2026-04-30T23:59:59Z");
    const c = deriveSeed("c2", "2026-04-30T23:59:59Z");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("tirage reproductible (mêmes inputs → mêmes gagnants)", () => {
    const r1 = drawContest({
      contestId: "c1",
      endsAtIso: "2026-04-30T23:59:59Z",
      entries: ENTRIES,
      prizesCount: 3,
    });
    const r2 = drawContest({
      contestId: "c1",
      endsAtIso: "2026-04-30T23:59:59Z",
      entries: ENTRIES,
      prizesCount: 3,
    });
    expect(r1.signature).toBe(r2.signature);
    expect(r1.winners).toEqual(r2.winners);
  });

  it("N gagnants distincts (sans remise)", () => {
    const r = drawContest({
      contestId: "c1",
      endsAtIso: "2026-04-30T23:59:59Z",
      entries: ENTRIES,
      prizesCount: 3,
    });
    expect(r.winners).toHaveLength(3);
    const ids = new Set(r.winners.map((w) => w.userId));
    expect(ids.size).toBe(3);
  });

  it("tirage plafonné à entries.length si prizesCount > entries", () => {
    const r = drawContest({
      contestId: "c1",
      endsAtIso: "2026-04-30T23:59:59Z",
      entries: [{ userId: "u1", tickets: 1 }],
      prizesCount: 10,
    });
    expect(r.winners).toHaveLength(1);
  });

  it("totalParticipants + totalTickets calculés correctement", () => {
    const r = drawContest({
      contestId: "c1",
      endsAtIso: "2026-04-30T23:59:59Z",
      entries: ENTRIES,
      prizesCount: 1,
    });
    expect(r.totalParticipants).toBe(5);
    expect(r.totalTickets).toBe(18);
  });

  it("entries vides → 0 gagnant", () => {
    const r = drawContest({
      contestId: "c1",
      endsAtIso: "2026-04-30T23:59:59Z",
      entries: [],
      prizesCount: 5,
    });
    expect(r.winners).toHaveLength(0);
    expect(r.totalParticipants).toBe(0);
  });

  it("dédoublonne les entries d'un même user", () => {
    const r = drawContest({
      contestId: "c1",
      endsAtIso: "2026-04-30T23:59:59Z",
      entries: [
        { userId: "u1", tickets: 3 },
        { userId: "u1", tickets: 2 },
      ],
      prizesCount: 1,
    });
    expect(r.totalParticipants).toBe(1);
    expect(r.totalTickets).toBe(5);
    expect(r.winners[0]?.tickets).toBe(5);
  });

  it("signature crypto change si winners changent", () => {
    const a = drawContest({
      contestId: "c1",
      endsAtIso: "2026-04-30T23:59:59Z",
      entries: ENTRIES,
      prizesCount: 3,
    });
    const b = drawContest({
      contestId: "c1",
      endsAtIso: "2026-05-01T23:59:59Z",
      entries: ENTRIES,
      prizesCount: 3,
    });
    expect(a.signature).not.toBe(b.signature);
  });
});
