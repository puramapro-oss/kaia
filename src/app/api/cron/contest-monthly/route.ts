/**
 * CRON `/api/cron/contest-monthly`
 *  - Schedule (vercel.json) : `5 12 1 * *` (1er du mois 12:05 UTC)
 *  - 1) Tire le concours mensuel du mois précédent
 *  - 2) Crée le concours mensuel du mois courant
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
    .eq("kind", "monthly")
    .lte("ends_at", now.toISOString())
    .neq("status", "completed")
    .order("ends_at", { ascending: false })
    .limit(3);

  const drawnReports: Array<{ slug: string; result: unknown }> = [];
  for (const c of pendingDraws ?? []) {
    const r = await runContestDraw({ admin, contestId: c.id as string, now });
    drawnReports.push({ slug: c.slug as string, result: r });
  }

  const ensured = await ensurePeriodContest({ admin, cadence: "monthly", now });

  return NextResponse.json({
    ok: true,
    drawn: drawnReports,
    currentMonthContest: ensured,
  });
}
