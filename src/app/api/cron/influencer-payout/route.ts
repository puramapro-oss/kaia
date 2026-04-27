/**
 * CRON `/api/cron/influencer-payout` — agrège les commissions du mois écoulé
 * en payouts pending pour validation admin manuelle.
 *
 * Schedule (vercel.json) : `0 3 1 * *` (1er du mois 03:00 UTC).
 *
 * Idempotent : si déjà exécuté pour la même période → no-op (skip influenceurs
 * qui ont déjà un payout `pending`/`processing` couvrant leur dernier mois).
 *
 * Phase 1 (BRIEF §9.5) : crée des payouts `pending`. Validation Tissma manuelle
 * via /admin/payouts (P8). Virement IBAN manuel.
 * Phase 2 : Treezor injecte directement la transaction → status `paid`.
 *
 * Auth : Bearer CRON_SECRET ou ?secret=$CRON_SECRET.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // Pas de CRON_SECRET configuré → on bloque (sécurité par défaut)
    return false;
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === expected;
}

interface ConversionRow {
  id: string;
  link_id: string;
  commission_cents: number;
  created_at: string;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Auth requise." }, { status: 401 });
  }

  const admin = createServiceClient();

  // Période = mois précédent
  const now = new Date();
  const startThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(startThisMonth.getTime() - 1); // 23:59:59 UTC du dernier jour mois précédent
  const periodStart = new Date(
    Date.UTC(periodEnd.getUTCFullYear(), periodEnd.getUTCMonth(), 1)
  );
  const periodStartIso = periodStart.toISOString();
  const periodEndIso = startThisMonth.toISOString();

  // Récupère toutes les conversions PENDING dans la fenêtre, groupées par influencer
  const { data: links, error: linksErr } = await admin
    .from("influencer_links")
    .select("id, user_id, code")
    .eq("active", true);
  if (linksErr) {
    return NextResponse.json(
      { error: "Lecture links impossible.", details: linksErr.message },
      { status: 500 }
    );
  }

  const created: Array<{ user_id: string; amount_cents: number; conversions: number }> = [];
  const skipped: Array<{ user_id: string; reason: string }> = [];

  for (const link of links ?? []) {
    // Conversions pending dans la fenêtre
    const { data: rows, error } = await admin
      .from("influencer_conversions")
      .select("id, link_id, commission_cents, created_at")
      .eq("link_id", link.id)
      .eq("status", "pending")
      .gte("created_at", periodStartIso)
      .lt("created_at", periodEndIso)
      .returns<ConversionRow[]>();
    if (error || !rows || rows.length === 0) continue;

    const amount = rows.reduce((s, r) => s + (r.commission_cents ?? 0), 0);
    if (amount <= 0) continue;

    // Vérifie qu'il n'y a pas déjà un payout pending/processing couvrant cette période
    const { data: existingPayout } = await admin
      .from("influencer_payouts")
      .select("id, status, period_start")
      .eq("user_id", link.user_id)
      .in("status", ["pending", "processing"])
      .eq("period_start", periodStartIso.slice(0, 10))
      .maybeSingle();

    if (existingPayout) {
      skipped.push({ user_id: link.user_id, reason: "payout_already_exists" });
      continue;
    }

    const { data: payout, error: insertErr } = await admin
      .from("influencer_payouts")
      .insert({
        user_id: link.user_id,
        amount_cents: amount,
        status: "pending",
        period_start: periodStartIso.slice(0, 10),
        period_end: periodEndIso.slice(0, 10),
        breakdown: {
          conversions: rows.map((r) => ({ id: r.id, cents: r.commission_cents })),
        },
        notes: `Auto-généré par cron ${new Date().toISOString()}`,
      })
      .select("id, amount_cents")
      .single();

    if (insertErr) {
      skipped.push({
        user_id: link.user_id,
        reason: `insert_failed:${insertErr.message}`,
      });
      continue;
    }

    // Marque les conversions comme 'paid' pour ne pas les re-payer
    const ids = rows.map((r) => r.id);
    await admin
      .from("influencer_conversions")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .in("id", ids);

    created.push({
      user_id: link.user_id,
      amount_cents: payout.amount_cents,
      conversions: rows.length,
    });
  }

  return NextResponse.json({
    ok: true,
    period: { start: periodStartIso, end: periodEndIso },
    payoutsCreated: created.length,
    skipped: skipped.length,
    details: { created, skipped },
  });
}
