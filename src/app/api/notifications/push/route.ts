import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { sendPushServer } from "@/lib/native/onesignal";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/notifications/push
 *
 * Endpoint admin-only pour envoyer un push à 1 user (debug + tests TestFlight).
 * En production, les pushes sont déclenchés par les CRON (rappel routine,
 * rituel hebdo, palier ambassadeur). Ce endpoint reste manuel.
 */

const Body = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(280),
  url: z.string().url().optional(),
});

const ADMIN_EMAIL = "matiss.frasne@gmail.com";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Réservé admin" }, { status: 403 });
  }

  const { allowed } = await rateLimit(`push-send:${user.id}`, 30, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { userId, title, message, url } = parsed.data;

  // Vérifie que la cible existe
  const admin = createServiceClient();
  const { data: profile } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const result = await sendPushServer({
    externalUserIds: [userId],
    title,
    message,
    url,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Envoi échoué" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, recipients: result.recipients });
}
