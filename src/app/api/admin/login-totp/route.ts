/**
 * POST /api/admin/login-totp
 *  - Body : { totpCode: string (6 digits) }
 *  - Pré-requis : cookie pre2fa présent
 *  - Vérifie code TOTP, crée admin_session, set cookie HttpOnly
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
  verifyTotp,
} from "@/lib/admin/auth";
import { createAdminSession } from "@/lib/admin/session";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({ totpCode: z.string().regex(/^\d{6}$/) });

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Code requis." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const pre2fa = cookieStore.get(ADMIN_PRE2FA_COOKIE)?.value;
  if (!pre2fa) {
    return NextResponse.json({ error: "Étape PIN requise." }, { status: 400 });
  }

  const limited = await rateLimit(`admin-login-totp:${user.id}`, 6, 300);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives — patiente 5 min." },
      { status: 429 }
    );
  }

  const admin = createServiceClient();
  const { data: creds } = await admin
    .from("admin_credentials")
    .select("totp_secret")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!creds?.totp_secret) {
    return NextResponse.json({ error: "TOTP non configuré." }, { status: 400 });
  }
  if (!(await verifyTotp(parsed.data.totpCode, creds.totp_secret as string))) {
    return NextResponse.json({ error: "Code TOTP invalide." }, { status: 401 });
  }

  // Crée session
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
  cookieStore.set(ADMIN_PRE2FA_COOKIE, "", { maxAge: 0, path: "/" });

  await admin
    .from("admin_credentials")
    .update({ last_login_at: new Date().toISOString() })
    .eq("user_id", user.id);

  await admin.rpc("log_admin_audit", {
    p_admin_user_id: user.id,
    p_action: "admin_login_success",
    p_ip: ip ?? null,
  });

  return NextResponse.json({ ok: true });
}
