import { createServiceClient } from "@/lib/supabase/admin";
import { verifyUnsubToken } from "@/lib/email/unsub-token";
import { EMAIL_OPT_OUT_MARKER } from "@/lib/email/kaia-emails";

export const dynamic = "force-dynamic";

function html(message: string, ok: boolean): Response {
  return new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Désinscription KAÏA</title></head>
<body style="margin:0;font-family:-apple-system,system-ui,sans-serif;background:#0A0A0F;color:#F5F5FA;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;">
  <div style="max-width:420px;text-align:center;background:#14141C;border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:40px;">
    <div style="font-size:32px;margin-bottom:12px;">${ok ? "🌙" : "⚠️"}</div>
    <p style="font-size:15px;line-height:1.6;color:rgba(245,245,250,0.8);">${message}</p>
    <a href="https://kaia.purama.dev" style="display:inline-block;margin-top:20px;color:#C8B9F0;font-size:14px;">Retour à KAÏA</a>
  </div>
</body></html>`,
    { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

/** Désinscription 1-clic (RGPD) — lien signé, sans authentification requise. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const userId = token ? verifyUnsubToken(token) : null;
  if (!userId) {
    return html("Ce lien de désinscription est invalide ou expiré.", false);
  }

  try {
    const admin = createServiceClient();
    const { data: prefs } = await admin
      .from("notification_prefs")
      .select("opted_out")
      .eq("user_id", userId)
      .maybeSingle();

    const optedOut = new Set<string>(prefs?.opted_out ?? []);
    optedOut.add(EMAIL_OPT_OUT_MARKER);

    const { error } = await admin
      .from("notification_prefs")
      .upsert({ user_id: userId, opted_out: Array.from(optedOut), updated_at: new Date().toISOString() });

    if (error) {
      console.error("Unsubscribe error:", error);
      return html("Impossible de te désinscrire pour le moment. Réessaie plus tard.", false);
    }
    return html("Tu es désinscrite des emails KAÏA. Tu peux revenir quand tu le souhaites. 💜", true);
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return html("Une erreur est survenue. Réessaie plus tard.", false);
  }
}
