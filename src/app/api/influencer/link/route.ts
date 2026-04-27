/**
 * GET /api/influencer/link — Récupère le lien actif de l'influenceur courant.
 * POST /api/influencer/link — Crée le lien si l'application est `approved` et qu'aucun lien n'existe encore.
 *
 * BRIEF §9.2 : code unique + promo activée 7 jours.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { previewCodeFor } from "@/lib/influencer/codes";

export const runtime = "nodejs";

const PROMO_DAYS = 7;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Auth requise." }, { status: 401 });
  }

  const { data: link, error } = await supabase
    .from("influencer_links")
    .select(
      "id, code, campaign, active, promo_active_until, promo_discount_percent, base_commission_first, lifetime_commission, created_at"
    )
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Lecture impossible.", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ link: link ?? null });
}

export async function POST(request: NextRequest) {
  void request;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Auth requise." }, { status: 401 });
  }

  // 1. Application doit être approved
  const { data: application } = await supabase
    .from("influencer_applications")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!application) {
    return NextResponse.json(
      {
        error:
          "Aucune candidature trouvée. Postule d'abord via le formulaire `/influencer`.",
      },
      { status: 403 }
    );
  }
  if (application.status !== "approved") {
    return NextResponse.json(
      {
        error:
          "Candidature en attente de validation. Tu seras notifié·e dès qu'elle est approuvée.",
        status: application.status,
      },
      { status: 403 }
    );
  }

  // 2. Si lien actif existe déjà, retourne-le
  const { data: existing } = await supabase
    .from("influencer_links")
    .select("id, code, promo_active_until")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ link: existing, alreadyExisted: true });
  }

  // 3. Profile : full_name pour générer le code
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const baseName = profile?.full_name ?? user.email ?? "kaia";

  // 4. Tente la RPC SQL d'abord (atomique). Si échec (migration 0003 absente), fallback JS.
  const admin = createServiceClient();

  // Tentative via RPC
  const rpcResult = await admin.rpc("create_influencer_link", {
    p_user_id: user.id,
    p_campaign: null as string | null,
  });

  if (!rpcResult.error && Array.isArray(rpcResult.data) && rpcResult.data.length > 0) {
    const row = rpcResult.data[0] as { id: string; code: string };
    // Active la promo 7j
    const promoUntil = new Date(Date.now() + PROMO_DAYS * 86_400_000).toISOString();
    await admin
      .from("influencer_links")
      .update({ promo_active_until: promoUntil })
      .eq("id", row.id);
    return NextResponse.json({
      link: {
        id: row.id,
        code: row.code,
        promo_active_until: promoUntil,
      },
      created: true,
    });
  }

  // Fallback JS (migration 0003 pas appliquée → pas de RPC)
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = previewCodeFor(baseName);
    const inserted = await admin
      .from("influencer_links")
      .insert({
        user_id: user.id,
        code,
        campaign: null,
        active: true,
      })
      .select("id, code")
      .maybeSingle();

    if (!inserted.error && inserted.data) {
      return NextResponse.json({
        link: { id: inserted.data.id, code: inserted.data.code, promo_active_until: null },
        created: true,
        fallbackMode: true,
      });
    }
    if (inserted.error?.code !== "23505") {
      // Pas une collision → erreur réelle
      return NextResponse.json(
        { error: "Création du lien impossible.", details: inserted.error?.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: "Trop de collisions de code, réessaie dans une minute." },
    { status: 503 }
  );
}
