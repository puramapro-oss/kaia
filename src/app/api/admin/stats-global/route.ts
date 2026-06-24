/**
 * GET /api/admin/stats-global
 *  - Auth : admin session (requireAdmin)
 *  - Retourne les métriques globales pour le dashboard admin :
 *    users, abonnements actifs, graines distribuées, concours actifs,
 *    influenceurs actifs, revenus Stripe (30j)
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { admin } = guard;

  const [
    { count: totalUsers },
    { count: activeSubscriptions },
    { data: tokenStats },
    { count: activeContests },
    { count: activeInfluencers },
    { data: recentPayments },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("token_events")
      .select("delta")
      .eq("status", "active")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    admin
      .from("contests")
      .select("*", { count: "exact", head: true })
      .eq("status", "live"),
    admin
      .from("influencer_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    admin
      .from("stripe_events")
      .select("amount_cents")
      .eq("event_type", "payment_intent.succeeded")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(500),
  ]);

  const grainesDistributed = (tokenStats ?? []).reduce(
    (sum, row) => sum + Math.max(0, (row.delta as number) ?? 0),
    0,
  );

  const revenue30dCents = (recentPayments ?? []).reduce(
    (sum, row) => sum + ((row.amount_cents as number) ?? 0),
    0,
  );

  return NextResponse.json({
    ok: true,
    stats: {
      totalUsers: totalUsers ?? 0,
      activeSubscriptions: activeSubscriptions ?? 0,
      grainesDistributed30d: grainesDistributed,
      activeContests: activeContests ?? 0,
      activeInfluencers: activeInfluencers ?? 0,
      revenue30dCents,
      revenue30dEur: Number((revenue30dCents / 100).toFixed(2)),
    },
  });
}
