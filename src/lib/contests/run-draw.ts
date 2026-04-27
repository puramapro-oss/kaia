/**
 * Exécute le tirage d'un concours :
 *  1. Vérifie que la fenêtre est close (now >= ends_at)
 *  2. Vérifie que le concours n'est pas déjà 'completed'
 *  3. Charge les entries
 *  4. Calcule winners + signature via drawContest()
 *  5. (best-effort) stamp OpenTimestamps
 *  6. Insert via RPC record_contest_winners (atomique) — fallback UPDATE direct si RPC absente
 *  7. Crédite les gains aux gagnants (tokens via apply_token_event ; subscription_credit → notif Resend en P8)
 */
import type { createServiceClient } from "@/lib/supabase/admin";
import { drawContest } from "./draw-rules";
import type { ContestPrize, ContestRow } from "./types";

type AdminClient = ReturnType<typeof createServiceClient>;

export interface RunDrawResult {
  drew: boolean;
  reason?: string;
  winnersCount?: number;
  totalParticipants?: number;
  totalTickets?: number;
  signature?: string;
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
  if (cErr || !contest) return { drew: false, reason: "contest_not_found" };
  if (contest.status === "completed") return { drew: false, reason: "already_drawn" };
  if (new Date(contest.ends_at) > now) return { drew: false, reason: "window_open" };

  const { data: entries } = await admin
    .from("contest_entries")
    .select("user_id, tickets")
    .eq("contest_id", contestId);

  const drawInput = (entries ?? []).map((e) => ({
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

  // Best-effort OpenTimestamps stamp (lib optionnelle, pas critique pour le tirage)
  let otsBase64 = "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ots = require("javascript-opentimestamps");
    if (ots && typeof ots.DetachedTimestampFile?.fromHash === "function") {
      const hashBuf = Buffer.from(draw.signature, "hex");
      const detached = ots.DetachedTimestampFile.fromHash(new ots.Ops.OpSHA256(), hashBuf);
      // Stamp est asynchrone et peut échouer hors ligne — on n'attend pas
      try {
        await ots.stamp(detached);
        otsBase64 = Buffer.from(detached.serializeToBytes()).toString("base64");
      } catch {
        otsBase64 = "";
      }
    }
  } catch {
    // Lib indisponible — on poursuit sans
  }

  // Tentative RPC atomique
  const winnersJson = draw.winners as unknown as Array<Record<string, unknown>>;
  const rpc = await admin.rpc("record_contest_winners", {
    p_contest_id: contestId,
    p_winners: winnersJson,
    p_signature: draw.signature,
    p_ots: otsBase64,
  });
  if (rpc.error) {
    // Fallback UPDATE
    await admin
      .from("contests")
      .update({
        status: "completed",
        winners: winnersJson,
        proof_signature: draw.signature,
        proof_timestamp_ots: otsBase64 || null,
        draw_seed: draw.seed,
      })
      .eq("id", contestId);
  } else {
    await admin.from("contests").update({ draw_seed: draw.seed }).eq("id", contestId);
  }

  // Crédits aux gagnants — tokens uniquement en Phase 1
  for (const w of draw.winners) {
    const prize = prizes[w.prizeIndex];
    if (!prize) continue;
    if (prize.type === "tokens") {
      const idemp = `contest_${contestId}_winner_${w.userId}_${w.rank}`;
      await admin.rpc("apply_token_event", {
        p_user_id: w.userId,
        p_delta: prize.value,
        p_reason: "contest_win_tokens",
        p_metadata: { contestId, rank: w.rank, signature: draw.signature },
        p_idempotency_key: idemp,
      });
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
