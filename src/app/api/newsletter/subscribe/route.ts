/**
 * POST /api/newsletter/subscribe
 *  - Body : { email?: string, locale?: string }
 *  - Si user connecté → utilise son email + user_id
 *  - Sinon : email requis (signup public)
 *  - Crée subscription avec unsubscribe_token unique
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  email: z.string().email().optional(),
  locale: z.enum(["fr", "en", "es", "ar", "zh"]).default("fr"),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Email invalide." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = parsed.data.email ?? user?.email;
  if (!email) {
    return NextResponse.json({ error: "Email requis." }, { status: 400 });
  }

  const limited = await rateLimit(`newsletter-sub:${email}`, 3, 600);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives — patiente 10 min." },
      { status: 429 }
    );
  }

  const admin = createServiceClient();

  // Si déjà subscribed → no-op
  const { data: existing } = await admin
    .from("newsletter_subscriptions")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    if (existing.status === "subscribed") {
      return NextResponse.json({ ok: true, already: true });
    }
    // Re-souscription
    await admin
      .from("newsletter_subscriptions")
      .update({
        status: "subscribed",
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      })
      .eq("id", existing.id as string);
    return NextResponse.json({ ok: true, resubscribed: true });
  }

  const token = randomBytes(20).toString("base64url");
  const { error } = await admin.from("newsletter_subscriptions").insert({
    user_id: user?.id ?? null,
    email,
    locale: parsed.data.locale,
    unsubscribe_token: token,
  });
  if (error) {
    return NextResponse.json(
      { error: "Erreur d'inscription.", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
