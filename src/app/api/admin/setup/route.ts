/**
 * POST /api/admin/setup
 *  - Body : { pin: '1234..1234567', enable2fa: boolean }
 *  - Auth : Supabase + isAdminEmail + pas de credentials existantes
 *  - Crée admin_credentials. Si enable2fa : génère totp_secret et le renvoie (1 fois) côté client
 *    pour scan QR. Le user devra ensuite confirmer avec un 1er code TOTP via /api/admin/setup-confirm.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  hashPin,
  isAdminEmail,
  generateTotpSecret,
  totpUri,
  generateRecoveryCodes,
} from "@/lib/admin/auth";

const Body = z.object({
  pin: z.string().regex(/^\d{4,8}$/, "PIN 4-8 chiffres"),
  enable2fa: z.boolean().default(true),
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
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("admin_credentials")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "Setup déjà fait. Utilise /admin/login." },
      { status: 409 }
    );
  }

  const pinHash = await hashPin(parsed.data.pin);
  const totpSecret = parsed.data.enable2fa ? generateTotpSecret() : null;
  const recoveryCodes = generateRecoveryCodes(8);

  const { error: insErr } = await admin.from("admin_credentials").insert({
    user_id: user.id,
    pin_hash: pinHash,
    totp_secret: totpSecret,
    totp_enabled: false, // confirmé après vérif 1er code
    recovery_codes: recoveryCodes,
  });
  if (insErr) {
    return NextResponse.json(
      { error: "Erreur création credentials.", details: insErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    totpUri: totpSecret ? totpUri(totpSecret, user.email!) : null,
    totpSecret, // affiché 1 fois côté client pour saisie manuelle si scan QR KO
    recoveryCodes,
  });
}
