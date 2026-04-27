/**
 * POST /api/admin/setup-confirm
 *  - Body : { totpCode: string (6 digits) }
 *  - Confirme que l'app TOTP est bien configurée → set totp_enabled=true
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isAdminEmail, verifyTotp } from "@/lib/admin/auth";

const Body = z.object({
  totpCode: z.string().regex(/^\d{6}$/),
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
  if (!parsed.success) return NextResponse.json({ error: "Code invalide." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createServiceClient();
  const { data: creds } = await admin
    .from("admin_credentials")
    .select("totp_secret, totp_enabled")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!creds || !creds.totp_secret) {
    return NextResponse.json({ error: "Setup TOTP requis d'abord." }, { status: 400 });
  }
  if (creds.totp_enabled) {
    return NextResponse.json({ error: "Déjà confirmé." }, { status: 409 });
  }
  if (!(await verifyTotp(parsed.data.totpCode, creds.totp_secret as string))) {
    return NextResponse.json({ error: "Code TOTP invalide." }, { status: 401 });
  }

  await admin
    .from("admin_credentials")
    .update({ totp_enabled: true })
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
