/**
 * CRON `/api/cron/onboarding-drip` — drip lifecycle J3 (guide) + J7 (AURORA).
 * Schedule (vercel.json) : `0 10 * * *` (quotidien 10:00 UTC).
 *
 * Sélection pure : `dripKindForDate` (lib/email/onboarding-drip.ts, testée) —
 * match exact J3 / J7 sur `profiles.onboarded_at`. Requête bornée par
 * `dripQueryWindow`. RGPD : skip `EMAIL_OPT_OUT_MARKER`. Envoi `sendKaiaEmail`
 * (no-op gracieux sans RESEND_API_KEY → cron fonctionnel et observable).
 */
import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { dripQueryWindow, dripKindForDate } from "@/lib/email/onboarding-drip";
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
    const win = dripQueryWindow(now);

    const { data: candidates } = await admin
      .from("profiles")
      .select("id, email, full_name, onboarded_at")
      .gte("onboarded_at", win.startISO)
      .lt("onboarded_at", win.endISO)
      .limit(1000);

    const result = await runLifecycleBatch(admin, candidates ?? [], (c) =>
      dripKindForDate(c.onboarded_at, now)
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Onboarding drip cron error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export const POST = GET;
