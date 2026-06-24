/**
 * POST /api/contests/draw
 *  - Body : { contestId: uuid }
 *  - Auth : admin session (requireAdmin) OU CRON_SECRET (Vercel cron)
 *  - Déclenche runContestDraw pour un concours spécifique
 *  - Idempotent : retourne already_drawn si déjà complété
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/admin";
import { runContestDraw } from "@/lib/contests/run-draw";
import { isCronAuthorized } from "@/lib/contests/cron-helpers";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  contestId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  // Accept either admin session or cron secret
  const isCron = isCronAuthorized(request);
  if (!isCron) {
    const guard = await requireAdmin();
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "contestId UUID requis." }, { status: 400 });
  }

  const admin = createServiceClient();
  const result = await runContestDraw({ admin, contestId: parsed.data.contestId });

  if (!result.drew) {
    const status =
      result.reason === "contest_not_found"
        ? 404
        : result.reason === "already_drawn"
          ? 409
          : result.reason === "window_open"
            ? 422
            : 400;
    return NextResponse.json({ ok: false, reason: result.reason }, { status });
  }

  return NextResponse.json({
    ok: true,
    winnersCount: result.winnersCount,
    totalParticipants: result.totalParticipants,
    totalTickets: result.totalTickets,
    signature: result.signature,
  });
}
