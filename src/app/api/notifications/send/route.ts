import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";

export const runtime = "nodejs";

/**
 * Envoi d'une notification push.
 *
 * DÉFÉRÉ (pending dep `web-push` + clés VAPID + deploy) : la livraison réelle
 * (Web Push / FCM) est branchée à l'activation. Le scheduler de sélection
 * (lib/notifications/scheduler.ts) est lui déjà testé. Auth cron uniquement.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: false,
    deferred: true,
    message: "Push delivery pending deploy (web-push + VAPID).",
  });
}
