/**
 * POST /api/influencer/payout-request — Demande de versement (P6, BRIEF §9.5).
 *
 *  - Phase 1 : crée payout `pending`, validation admin manuelle, virement manuel
 *  - Phase 2 (Treezor) : auto-versement via API
 *
 * Validation : montant min 50 €, IBAN obligatoire, pas de payout pending en cours,
 * commissions disponibles >= montant demandé.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MIN_PAYOUT_EUR = 50;
const MIN_PAYOUT_CENTS = MIN_PAYOUT_EUR * 100;

const Body = z.object({
  amountCents: z.number().int().min(MIN_PAYOUT_CENTS),
  iban: z
    .string()
    .trim()
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/, "IBAN invalide (format ISO).")
    .max(34),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Demande invalide.", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Auth requise." }, { status: 401 });
  }

  // 1. Anti double-demande
  const { data: pending } = await supabase
    .from("influencer_payouts")
    .select("id, amount_cents, status, created_at")
    .eq("user_id", user.id)
    .in("status", ["pending", "processing"])
    .maybeSingle();
  if (pending) {
    return NextResponse.json(
      {
        error:
          "Une demande est déjà en cours de traitement. Tu seras notifié·e quand elle est versée.",
        existing: pending,
      },
      { status: 409 }
    );
  }

  // 2. Calcul commissions disponibles (paid pas encore payouted, OR pending)
  const { data: link } = await supabase
    .from("influencer_links")
    .select("id")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (!link) {
    return NextResponse.json(
      { error: "Aucun lien actif trouvé. Crée ton lien d'abord." },
      { status: 403 }
    );
  }

  const { data: conversions } = await supabase
    .from("influencer_conversions")
    .select("commission_cents")
    .eq("link_id", link.id)
    .eq("status", "pending");
  const availableCents = (conversions ?? []).reduce(
    (sum, c) => sum + (c.commission_cents ?? 0),
    0
  );

  if (parsed.data.amountCents > availableCents) {
    return NextResponse.json(
      {
        error: `Montant demandé supérieur aux commissions disponibles (${(availableCents / 100).toFixed(2)} €).`,
        availableCents,
      },
      { status: 422 }
    );
  }

  const { data: payout, error } = await supabase
    .from("influencer_payouts")
    .insert({
      user_id: user.id,
      amount_cents: parsed.data.amountCents,
      iban: parsed.data.iban,
      status: "pending",
    })
    .select("id, amount_cents, status, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Création du payout impossible.", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    payout,
    message:
      "Demande enregistrée. Tissma valide les versements 1 fois par mois (Phase 2 Treezor à venir).",
  });
}
