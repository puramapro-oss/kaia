/**
 * CRON `/api/cron/token-cleanup`
 *  - Schedule (vercel.json) : `30 3 * * *` (03:30 UTC daily)
 *  - Expire les token_events dont expires_at < now et status != 'expired'
 *  - Met à jour le solde user_token_balance si touché
 *  - Idempotent (WHERE status != 'expired')
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/contests/cron-helpers";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  const now = new Date().toISOString();

  // Tentative via RPC (si migration 0006+ déployée)
  const { data: rpcData, error: rpcErr } = await admin.rpc("expire_old_tokens", {
    p_now: now,
  });

  if (!rpcErr && rpcData !== null) {
    return NextResponse.json({ ok: true, expired: rpcData });
  }

  // Fallback : UPDATE direct sur token_events
  const { data: expiredRows, error: updateErr } = await admin
    .from("token_events")
    .update({ status: "expired" })
    .lt("expires_at", now)
    .neq("status", "expired")
    .select("user_id, delta");

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  const expired = (expiredRows ?? []).length;

  // Recalcul des soldes pour les users touchés (best-effort)
  if (expired > 0) {
    const affectedUserIds = [...new Set((expiredRows ?? []).map((r) => r.user_id as string))];
    for (const userId of affectedUserIds) {
      await admin.rpc("recalculate_token_balance", { p_user_id: userId }).then(() => null, () => null);
    }
  }

  return NextResponse.json({ ok: true, expired });
}

export const POST = GET;
