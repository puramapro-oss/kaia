/**
 * CRON `/api/cron/contest-yearly`
 *  - Schedule (vercel.json) : `35 23 31 12 *` (31/12 23:35 UTC)
 *  - 1) Tire le concours annuel de l'année qui se termine
 *  - 2) Crée le concours annuel de l'année suivante
 *
 * Aussi appelable manuellement par admin (re-run ne casse rien).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { ensurePeriodContest } from "@/lib/contests/ensure-period-contest";
import { runContestDraw } from "@/lib/contests/run-draw";
import { isCronAuthorized } from "@/lib/contests/cron-helpers";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createServiceClient();
  const now = new Date();

  const { data: pendingDraws } = await admin
    .from("contests")
    .select("id, slug, ends_at, status")
    .eq("kind", "yearly")
    .lte("ends_at", now.toISOString())
    .neq("status", "completed")
    .order("ends_at", { ascending: false })
    .limit(2);

  const drawnReports: Array<{ slug: string; result: unknown }> = [];
  for (const c of pendingDraws ?? []) {
    const r = await runContestDraw({ admin, contestId: c.id as string, now });
    drawnReports.push({ slug: c.slug as string, result: r });
  }

  // Concours année suivante (now + 1 jour pour basculer vers l'année prochaine)
  const nextYearStart = new Date(now.getTime() + 86400 * 1000);
  const ensured = await ensurePeriodContest({ admin, cadence: "yearly", now: nextYearStart });

  return NextResponse.json({
    ok: true,
    drawn: drawnReports,
    nextYearContest: ensured,
  });
}
