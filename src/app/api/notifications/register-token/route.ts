import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/notifications/register-token
 *
 * Enregistre le push token (APNs ou FCM) du device pour l'utilisateur connecté.
 * Appelé par Capacitor au démarrage après que l'utilisateur a accepté les
 * permissions push. Idempotent par (user_id, token).
 */

const Body = z.object({
  token: z.string().min(8).max(512),
  platform: z.enum(["ios", "android", "web"]),
  enabled: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connecte-toi pour activer les notifications" }, { status: 401 });
  }

  const { allowed } = await rateLimit(`push-register:${user.id}`, 10, 300);
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

  const { token, platform, enabled } = parsed.data;

  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: user.id,
      token,
      platform,
      enabled,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,token", ignoreDuplicates: false },
  );

  if (error) {
    // Table inexistante ou RLS pas appliquée → on ne bloque pas l'app
    return NextResponse.json({ ok: true, warning: error.message }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
