/**
 * CRON `/api/cron/notifications` — compose le batch quotidien personnalisé.
 * Schedule (vercel.json) : `0 8 * * *` (08:00 UTC, début de fenêtre 8h-21h).
 *
 * Sélection : `selectNotifications` (lib/notifications/scheduler.ts, testée) —
 * max 2/jour, fenêtre horaire, opt-out par type, priorité.
 * DÉFÉRÉ (pending deploy) : tant que `ENABLE_NOTIFICATIONS !== "true"`, pas de
 * mise en file ni d'envoi. À l'activation : générer les candidats par
 * utilisatrice (phase cycle, CORE "now", cercle, KARMA…), filtrer via
 * selectNotifications, insérer kaia.notifications (status 'queued'), puis push.
 */
import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.ENABLE_NOTIFICATIONS !== "true") {
    return NextResponse.json({ ok: true, action: "deferred" });
  }

  // TODO(deploy): batch par utilisatrice → selectNotifications → insert queue → push.
  return NextResponse.json({ ok: true, action: "pending_implementation" });
}

export const POST = GET;
