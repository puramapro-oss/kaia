/**
 * GET /api/referral/link — Renvoie le code de parrainage du user (auto-généré au signup).
 *
 * Le code vit dans `profiles.referral_code` (trigger `handle_new_auth_user` 0001).
 * Si pour une raison X le code est absent → on en génère un nouveau atomiquement.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Auth requise." }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Lecture impossible.", details: error.message },
      { status: 500 }
    );
  }

  let code = profile?.referral_code ?? null;
  if (!code) {
    // Fallback : génère un nouveau code (8 chars hex). Trigger SQL devrait éviter ce cas.
    const generated = Math.random().toString(36).slice(2, 10);
    const upd = await supabase
      .from("profiles")
      .update({ referral_code: generated })
      .eq("id", user.id)
      .select("referral_code")
      .maybeSingle();
    code = upd.data?.referral_code ?? generated;
  }

  return NextResponse.json({ code });
}
