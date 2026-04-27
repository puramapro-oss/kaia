/**
 * GET /api/referral/stats — Stats parrainage de l'utilisateur courant.
 *
 *  - Filleuls actifs / pending / expired
 *  - Commission totale (tous filleuls combinés)
 *  - Liste des 50 derniers filleuls
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .maybeSingle();

  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, status, total_commission_cents, first_payment_at, created_at, referred_user_id")
    .eq("referrer_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const counts = (referrals ?? []).reduce(
    (acc, r) => {
      acc.total += 1;
      if (r.status === "active") acc.active += 1;
      if (r.status === "pending") acc.pending += 1;
      if (r.status === "expired") acc.expired += 1;
      acc.commissionLifetimeCents += r.total_commission_cents ?? 0;
      return acc;
    },
    { total: 0, active: 0, pending: 0, expired: 0, commissionLifetimeCents: 0 }
  );

  // Commissions détaillées (graceful fallback si table absente)
  const commRes = await supabase
    .from("referral_commissions")
    .select("commission_cents, status, source")
    .eq("referrer_user_id", user.id);
  const commissions = commRes.error ? [] : commRes.data ?? [];
  const commPending = commissions
    .filter((c) => c.status === "pending")
    .reduce((s, c) => s + (c.commission_cents ?? 0), 0);
  const commPaid = commissions
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + (c.commission_cents ?? 0), 0);

  return NextResponse.json({
    referralCode: profile?.referral_code ?? null,
    counts,
    commissionPendingCents: commPending,
    commissionPaidCents: commPaid,
    referrals: (referrals ?? []).map((r) => ({
      id: r.id,
      status: r.status,
      totalCommissionCents: r.total_commission_cents ?? 0,
      firstPaymentAt: r.first_payment_at,
      createdAt: r.created_at,
    })),
  });
}
