/**
 * CRON `/api/cron/contest-weekly`
 *  - Schedule (vercel.json) : `5 20 * * 0` (dimanche 20:05 UTC)
 *  - 1) Tire le concours hebdo de la semaine qui se termine
 *  - 2) Crée le concours hebdo de la semaine suivante
 *
 * Auth : Bearer CRON_SECRET (header) ou ?secret= (URL fallback).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { ensurePeriodContest } from "@/lib/contests/ensure-period-contest";
import { runContestDraw } from "@/lib/contests/run-draw";
import { isCronAuthorized } from "@/lib/contests/cron-helpers";
import { currentWeeklyWindow } from "@/lib/contests/period";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createServiceClient();
  const now = new Date();

  // 1) Tire le concours qui vient de se terminer (window d'avant)
  // On regarde le contest dont ends_at < now et status != completed, kind='weekly', le plus récent
  const { data: pendingDraws } = await admin
    .from("contests")
    .select("id, slug, ends_at, status")
    .eq("kind", "weekly")
    .lte("ends_at", now.toISOString())
    .neq("status", "completed")
    .order("ends_at", { ascending: false })
    .limit(3);

  const drawnReports: Array<{ slug: string; result: unknown }> = [];
  for (const c of pendingDraws ?? []) {
    const r = await runContestDraw({ admin, contestId: c.id as string, now });
    drawnReports.push({ slug: c.slug as string, result: r });
  }

  // 2) Crée le concours de la semaine prochaine (next Monday → Sunday)
  const nextWindowStart = new Date(currentWeeklyWindow(now).endsAt.getTime() + 1500);
  const ensured = await ensurePeriodContest({ admin, cadence: "weekly", now: nextWindowStart });

  return NextResponse.json({
    ok: true,
    drawn: drawnReports,
    nextWeekContest: ensured,
  });
}
