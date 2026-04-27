/**
 * GET /api/newsletter/unsubscribe?token=...
 *  - Désabo en 1 clic (RGPD)
 *  - Renvoie une page HTML simple confirmant le désabo
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return new NextResponse("Token manquant.", { status: 400 });
  }

  const admin = createServiceClient();
  const { data: sub } = await admin
    .from("newsletter_subscriptions")
    .select("id, email, status")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!sub) {
    return new NextResponse("Lien de désabonnement invalide ou expiré.", { status: 404 });
  }

  if (sub.status !== "unsubscribed") {
    await admin
      .from("newsletter_subscriptions")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("id", sub.id as string);
  }

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Désabonnement KAÏA</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;background:#0A0A0F;color:#FFFEF7;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center;}h1{color:#F4C430;font-size:22px;margin:0 0 12px;}p{font-size:15px;line-height:1.6;color:rgba(255,254,247,0.8);max-width:420px;}a{color:#06B6D4;}</style>
</head><body>
<div>
  <h1>C'est fait 🌿</h1>
  <p>Tu ne recevras plus de Living Newsletter.<br>Si tu changes d'avis, tu peux te réabonner depuis tes <a href="https://kaia.purama.dev/dashboard/settings">réglages KAÏA</a>.</p>
</div>
</body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
