import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";
import { ADMIN_SESSION_COOKIE, ADMIN_PRE2FA_COOKIE } from "@/lib/admin/auth";
import { revokeAdminSession } from "@/lib/admin/session";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    const admin = createServiceClient();
    await revokeAdminSession({ admin, rawToken: token });
  }
  cookieStore.set(ADMIN_SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  cookieStore.set(ADMIN_PRE2FA_COOKIE, "", { maxAge: 0, path: "/" });
  return NextResponse.json({ ok: true });
}
