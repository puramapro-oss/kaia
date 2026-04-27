/**
 * POST /api/admin/login-pin
 *  - Body : { pin: string }
 *  - Vérifie PIN bcrypt
 *  - Si TOTP enabled → délivre cookie pre2fa (5 min), client redirige vers /admin/login (re-load step 2)
 *  - Si TOTP disabled (cas exceptionnel) → crée session direct + cookie session 8h
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  ADMIN_PRE2FA_COOKIE,
  ADMIN_SESSION_COOKIE,
  isAdminEmail,
  verifyPin,
} from "@/lib/admin/auth";
import { createAdminSession } from "@/lib/admin/session";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({ pin: z.string().min(4).max(10) });

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "PIN requis." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = await rateLimit(`admin-login-pin:${user.id}`, 5, 300);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives — patiente 5 min." },
      { status: 429 }
    );
  }

  const admin = createServiceClient();
  const { data: creds } = await admin
    .from("admin_credentials")
    .select("pin_hash, totp_enabled")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!creds) {
    return NextResponse.json({ error: "Setup requis." }, { status: 404 });
  }

  const ok = await verifyPin(parsed.data.pin, creds.pin_hash as string);
  if (!ok) {
    return NextResponse.json({ error: "PIN incorrect." }, { status: 401 });
  }

  const cookieStore = await cookies();
  if (creds.totp_enabled) {
    // Cookie pre-2FA 5min
    cookieStore.set(ADMIN_PRE2FA_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });
    return NextResponse.json({ ok: true, next: "totp" });
  }

  // Pas de TOTP : login direct
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  const ua = (await headers()).get("user-agent") ?? undefined;
  const created = await createAdminSession({
    admin,
    userId: user.id,
    ip,
    userAgent: ua ?? undefined,
  });
  if (!created) {
    return NextResponse.json({ error: "Session création échouée." }, { status: 500 });
  }
  cookieStore.set(ADMIN_SESSION_COOKIE, created.rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: created.expiresAt,
    path: "/",
  });
  await admin
    .from("admin_credentials")
    .update({ last_login_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true, next: "admin" });
}
