/**
 * CRON `/api/cron/reactivation` — emails de réactivation lifecycle.
 * Schedule (vercel.json) : `30 9 * * *` (quotidien 09:30 UTC).
 *
 * Sélection pure : `reactivationKindForDate` (lib/email/reactivation.ts, testée) —
 * match exact J14 / J30 sur `profiles.streak_last_at` (un envoi par palier).
 * RGPD : on saute les utilisatrices ayant `email_marketing` dans
 * `notification_prefs.opted_out`. Envoi via `sendKaiaEmail` (no-op gracieux
 * sans RESEND_API_KEY — le cron reste fonctionnel et observable).
 */
import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { reactivationTargetDates, reactivationKindForDate } from "@/lib/email/reactivation";
import { runLifecycleBatch } from "@/lib/email/lifecycle-batch";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createServiceClient();
    const now = Date.now();
    const targets = reactivationTargetDates(now);

    // Candidates : dernière activité exactement à J14 ou J30.
    const { data: candidates } = await admin
      .from("profiles")
      .select("id, email, full_name, streak_last_at")
      .in("streak_last_at", [targets.reactivation_j14, targets.reactivation_j30])
      .limit(1000);

    const result = await runLifecycleBatch(admin, candidates ?? [], (c) =>
      reactivationKindForDate(c.streak_last_at, now)
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Reactivation cron error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export const POST = GET;
