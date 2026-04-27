/**
 * GET /api/influencer/stats — Stats agrégées pour l'influenceur courant.
 *
 *  - clicks 30j (depuis influencer_link_clicks si table dispo)
 *  - conversions totales
 *  - commission lifetime + paid + pending
 *
 * Tolère l'absence de migration 0003 (clicks → 0).
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

  const { data: link } = await supabase
    .from("influencer_links")
    .select("id, code, promo_active_until, created_at")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!link) {
    return NextResponse.json({
      hasLink: false,
      clicks30d: 0,
      conversions: 0,
      commissionLifetimeCents: 0,
      commissionPendingCents: 0,
      commissionPaidCents: 0,
    });
  }

  // Conversions
  const { data: conversions } = await supabase
    .from("influencer_conversions")
    .select("commission_cents, status")
    .eq("link_id", link.id);

  const totals = (conversions ?? []).reduce(
    (acc, row) => {
      acc.lifetime += row.commission_cents ?? 0;
      if (row.status === "paid") acc.paid += row.commission_cents ?? 0;
      if (row.status === "pending") acc.pending += row.commission_cents ?? 0;
      return acc;
    },
    { lifetime: 0, paid: 0, pending: 0 }
  );

  // Clicks 30j (graceful si table absente)
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const clicksRes = await supabase
    .from("influencer_link_clicks")
    .select("id", { count: "exact", head: true })
    .eq("link_id", link.id)
    .gte("created_at", since);
  const clicks30d = clicksRes.error ? 0 : clicksRes.count ?? 0;

  return NextResponse.json({
    hasLink: true,
    link: { id: link.id, code: link.code, promoActiveUntil: link.promo_active_until },
    clicks30d,
    conversions: conversions?.length ?? 0,
    commissionLifetimeCents: totals.lifetime,
    commissionPendingCents: totals.pending,
    commissionPaidCents: totals.paid,
  });
}
