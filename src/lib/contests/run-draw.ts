/**
 * Exécute le tirage d'un concours :
 *  1. Vérifie que la fenêtre est close (now >= ends_at)
 *  2. Vérifie que le concours n'est pas déjà 'completed'
 *  3. Charge les entries
 *  4. Calcule winners + signature via drawContest()
 *  5. (best-effort) stamp OpenTimestamps
 *  6. Enregistre via record_contest_winners et exige son accusé de succès
 *  7. Crédite les gains aux gagnants (tokens via apply_token_event ; subscription_credit → notif Resend en P8)
 */
import type { createServiceClient } from "@/lib/supabase/admin";
import { drawContest } from "./draw-rules";
import type { ContestPrize, ContestRow } from "./types";
import { stampHashHex } from "@/lib/opentimestamps";

type AdminClient = ReturnType<typeof createServiceClient>;

export interface RunDrawResult {
  drew: boolean;
  reason?: string;
  /** A write may already be committed: inspect persisted winners/events before retrying. */
  reconciliationRequired?: boolean;
  winnersCount?: number;
  totalParticipants?: number;
  totalTickets?: number;
  signature?: string;
}

function acknowledgement(value: unknown): { applied: boolean; reason: string } | null {
  const row = Array.isArray(value) ? (value.length === 1 ? value[0] : null) : value;
  if (!row || typeof row !== "object") return null;
  const result = row as { applied?: unknown; reason?: unknown };
  return typeof result.applied === "boolean" && typeof result.reason === "string"
    ? { applied: result.applied, reason: result.reason }
    : null;
}

export async function runContestDraw(params: {
  admin: AdminClient;
  contestId: string;
  now?: Date;
}): Promise<RunDrawResult> {
  const { admin, contestId } = params;
  const now = params.now ?? new Date();

  const { data: contest, error: cErr } = await admin
    .from("contests")
    .select("*")
    .eq("id", contestId)
    .maybeSingle<ContestRow>();
  if (cErr) return { drew: false, reason: "contest_read_failed" };
  if (!contest) return { drew: false, reason: "contest_not_found" };
  if (contest.status === "completed") return { drew: false, reason: "already_drawn" };
  if (new Date(contest.ends_at) > now) return { drew: false, reason: "window_open" };

  const { data: entries, error: entriesError } = await admin
    .from("contest_entries")
    .select("user_id, tickets")
    .eq("contest_id", contestId);
  if (entriesError || !Array.isArray(entries)) return { drew: false, reason: "entries_unavailable" };

  const drawInput = entries.map((e) => ({
    userId: e.user_id as string,
    tickets: e.tickets as number,
  }));
  const prizes = (contest.prizes ?? []) as ContestPrize[];
  const prizesCount = Math.max(1, prizes.length);

  const draw = drawContest({
    contestId: contest.id,
    endsAtIso: contest.ends_at,
    entries: drawInput,
    prizesCount,
  });

  // Best-effort receipt, bounded by the shared transport. A receipt is provisional;
  // failed calendars must not persist a bare proof as a successful timestamp.
  const otsBase64 = (await stampHashHex(draw.signature)) ?? "";

  // Only the atomic RPC may decide which request owns this draw. A transport
  // failure can be ambiguous; a direct UPDATE must never bypass its lock.
  const winnersJson = draw.winners as unknown as Array<Record<string, unknown>>;
  const rpc = await admin.rpc("record_contest_winners", {
    p_contest_id: contestId,
    p_winners: winnersJson,
    p_signature: draw.signature,
    p_ots: otsBase64,
  });
  if (rpc.error) {
    return { drew: false, reason: "draw_recording_failed", reconciliationRequired: true };
  }
  const recorded = acknowledgement(rpc.data);
  if (recorded?.applied === false && ["already_drawn", "contest_not_found", "invalid_winners", "invalid_signature"].includes(recorded.reason)) {
    return { drew: false, reason: recorded.reason };
  }
  if (!recorded?.applied || recorded.reason !== "ok") {
    return { drew: false, reason: "draw_recording_unconfirmed", reconciliationRequired: true };
  }

  // These writes are not part of the recording transaction. Their failures
  // require reconciliation; never claim all prizes were applied or replay them.
  const { data: seedRow, error: seedError } = await admin
    .from("contests")
    .update({ draw_seed: draw.seed })
    .eq("id", contestId)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (seedError || seedRow?.id !== contestId) return { drew: false, reason: "draw_recorded_seed_failed", reconciliationRequired: true };

  // Crédits aux gagnants — tokens uniquement en Phase 1
  for (const w of draw.winners) {
    const prize = prizes[w.prizeIndex];
    if (!prize) continue;
    if (prize.type === "tokens") {
      const idemp = `contest_${contestId}_winner_${w.userId}_${w.rank}`;
      const credit = await admin.rpc("apply_token_event", {
        p_user_id: w.userId,
        p_delta: prize.value,
        p_reason: "contest_win_tokens",
        p_metadata: { contestId, rank: w.rank, signature: draw.signature },
        p_idempotency_key: idemp,
      });
      if (credit.error) return { drew: false, reason: "draw_recorded_credit_failed", reconciliationRequired: true };
      const applied = acknowledgement(credit.data);
      if (!applied || !((applied.applied && applied.reason === "ok") || (!applied.applied && applied.reason === "idempotent_replay"))) {
        return { drew: false, reason: "draw_recorded_credit_unconfirmed", reconciliationRequired: true };
      }
    }
    // subscription_credit → handled in P8 (admin process Stripe credit balance)
  }

  return {
    drew: true,
    winnersCount: draw.winners.length,
    totalParticipants: draw.totalParticipants,
    totalTickets: draw.totalTickets,
    signature: draw.signature,
  };
}
