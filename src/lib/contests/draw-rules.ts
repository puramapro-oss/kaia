/**
 * Tirage au sort pondéré déterministe + signature crypto.
 *
 *  - Seed = sha256(contest_id + ends_at_iso) → reproductible & auditable
 *  - PRNG = mulberry32 dérivée du seed (32-bit)
 *  - Pondération = nombre de tickets de chaque utilisateur
 *  - Sélection N gagnants distincts (sans remise)
 *  - Signature = sha256(seed + winners[].userId|tickets joined) → écrite dans contests.proof_signature
 *  - OpenTimestamps : on stamp le hash signature (côté serveur, lazy si lib absente)
 *
 * Module TS pur · testable · zéro I/O de DB.
 */
import { createHash } from "node:crypto";

export interface ContestEntry {
  userId: string;
  tickets: number;
}

export interface DrawWinner {
  rank: number;
  userId: string;
  tickets: number;
  prizeIndex: number;
}

export interface DrawResult {
  seed: string;
  winners: DrawWinner[];
  signature: string;
  totalParticipants: number;
  totalTickets: number;
}

export function deriveSeed(contestId: string, endsAtIso: string): string {
  return createHash("sha256").update(`${contestId}|${endsAtIso}`).digest("hex");
}

// PRNG mulberry32 (32-bit, déterministe, suffisant pour audit non-cryptographique)
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedToInt(hex: string): number {
  // On prend les 8 premiers chars hex → uint32
  return parseInt(hex.slice(0, 8), 16);
}

/**
 * Tirage pondéré sans remise : N gagnants distincts.
 * - prizesCount : combien de gagnants on tire (1..N, plafonné à entries.length)
 * - Renvoie également la signature crypto pour audit.
 */
export function drawContest(input: {
  contestId: string;
  endsAtIso: string;
  entries: ContestEntry[];
  prizesCount: number;
}): DrawResult {
  const { contestId, endsAtIso, entries, prizesCount } = input;
  const seed = deriveSeed(contestId, endsAtIso);
  const rng = mulberry32(seedToInt(seed));

  // Aggrège les tickets par user (au cas où des doublons traînent)
  const map = new Map<string, number>();
  for (const e of entries) {
    if (!e.userId || e.tickets <= 0) continue;
    map.set(e.userId, (map.get(e.userId) ?? 0) + e.tickets);
  }
  const pool: ContestEntry[] = Array.from(map.entries()).map(([userId, tickets]) => ({
    userId,
    tickets,
  }));
  const totalTickets = pool.reduce((s, p) => s + p.tickets, 0);
  const totalParticipants = pool.length;

  const winners: DrawWinner[] = [];
  const remaining = pool.map((p) => ({ ...p }));
  let rank = 1;
  const limit = Math.min(prizesCount, remaining.length);

  while (winners.length < limit) {
    const total = remaining.reduce((s, p) => s + p.tickets, 0);
    if (total <= 0) break;
    const pick = rng() * total;
    let acc = 0;
    let chosenIdx = -1;
    for (let i = 0; i < remaining.length; i++) {
      acc += remaining[i].tickets;
      if (pick < acc) {
        chosenIdx = i;
        break;
      }
    }
    if (chosenIdx === -1) chosenIdx = remaining.length - 1;
    const w = remaining[chosenIdx];
    winners.push({
      rank,
      userId: w.userId,
      tickets: w.tickets,
      prizeIndex: rank - 1,
    });
    remaining.splice(chosenIdx, 1);
    rank++;
  }

  const sigBase = seed + winners.map((w) => `${w.userId}:${w.tickets}`).join("|");
  const signature = createHash("sha256").update(sigBase).digest("hex");

  return {
    seed,
    winners,
    signature,
    totalParticipants,
    totalTickets,
  };
}
