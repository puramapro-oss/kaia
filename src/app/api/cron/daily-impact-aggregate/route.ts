import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * CRON `/api/cron/daily-impact-aggregate` — recalcule `kaia.global_impact`.
 *
 * Vercel Cron envoie le header `Authorization: Bearer ${CRON_SECRET}`.
 * On accepte aussi un appel manuel (admin debug) avec ?secret=$CRON_SECRET.
 * En l'absence de CRON_SECRET (dev), on rejette tout sauf depuis localhost.
 */
function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // Dev sans secret → autoriser uniquement requêtes locales.
    const host = request.headers.get("host") ?? "";
    return host.startsWith("localhost") || host.startsWith("127.0.0.1");
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return true;
  const url = new URL(request.url);
  if (url.searchParams.get("secret") === expected) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();

  // 1) Aggregate user_impact → totals.
  const { data: impactRows, error: impactErr } = await admin
    .from("user_impact")
    .select(
      "trees_planted, waste_collected_kg, people_helped, water_saved_l, euros_redistributed, total_co2_avoided_kg",
    );
  if (impactErr) {
    return NextResponse.json(
      { error: "Aggregation impact failed", details: impactErr.message },
      { status: 500 },
    );
  }

  const totals = {
    trees_planted: 0,
    waste_collected_kg: 0,
    people_helped: 0,
    water_saved_l: 0,
    euros_redistributed: 0,
    total_co2_avoided_kg: 0,
  };
  for (const r of impactRows ?? []) {
    totals.trees_planted += Number(r.trees_planted ?? 0);
    totals.waste_collected_kg += Number(r.waste_collected_kg ?? 0);
    totals.people_helped += Number(r.people_helped ?? 0);
    totals.water_saved_l += Number(r.water_saved_l ?? 0);
    totals.euros_redistributed += Number(r.euros_redistributed ?? 0);
    totals.total_co2_avoided_kg += Number(r.total_co2_avoided_kg ?? 0);
  }

  // 2) routines_completed = COUNT distinct daily_routines avec total_seconds > 0.
  const { count: routinesCompleted } = await admin
    .from("daily_routines")
    .select("id", { count: "exact", head: true })
    .gt("total_seconds", 0);

  // 3) active_users_30d = COUNT DISTINCT user_id sur practice_sessions completed dans 30j.
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: activeRows } = await admin
    .from("practice_sessions")
    .select("user_id")
    .eq("status", "completed")
    .gte("completed_at", cutoff);
  const activeUsers = new Set((activeRows ?? []).map((r) => r.user_id)).size;

  // 4) Upsert global_impact (singleton row id=1).
  const { error: upErr } = await admin
    .from("global_impact")
    .upsert(
      {
        id: 1,
        ...totals,
        routines_completed: routinesCompleted ?? 0,
        active_users_30d: activeUsers,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (upErr) {
    return NextResponse.json(
      { error: "Upsert global_impact failed", details: upErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    totals,
    routinesCompleted: routinesCompleted ?? 0,
    activeUsers30d: activeUsers,
  });
}

// Permet aussi POST (Vercel Cron utilise GET par défaut, mais flexibilité).
export const POST = GET;
