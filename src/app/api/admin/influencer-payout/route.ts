/**
 * POST /api/admin/influencer-payout
 *  - Body : { influencerId?: uuid } — si absent, traite tous les pending
 *  - Auth : admin session (requireAdmin)
 *  - Déclenche manuellement le traitement de paiement influenceur
 *    (même logique que le cron /api/cron/influencer-payout mais ciblable)
 *  - Marque les payouts 'pending' comme 'processing' et crée les virements
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  influencerId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  const { admin, userId, ip } = guard;
  const { influencerId } = parsed.data;

  if (!process.env.ENABLE_PAYOUTS || process.env.ENABLE_PAYOUTS !== "true") {
    return NextResponse.json(
      { error: "Paiements désactivés (ENABLE_PAYOUTS=false)." },
      { status: 503 },
    );
  }

  let query = admin
    .from("influencer_payouts")
    .select("id, influencer_id, amount_cents, status")
    .eq("status", "pending");

  if (influencerId) {
    query = query.eq("influencer_id", influencerId);
  }

  const { data: payouts, error: fetchErr } = await query.limit(50);
  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!payouts?.length) {
    return NextResponse.json({ ok: true, processed: 0, message: "Aucun paiement en attente." });
  }

  const payoutIds = payouts.map((p) => p.id as string);

  // Mark as processing
  await admin
    .from("influencer_payouts")
    .update({ status: "processing", processing_at: new Date().toISOString() })
    .in("id", payoutIds);

  await admin.rpc("log_admin_audit", {
    p_admin_user_id: userId,
    p_action: "influencer_payout_triggered",
    p_target_table: "influencer_payouts",
    p_target_id: influencerId ?? "batch",
    p_before: { status: "pending", count: payoutIds.length },
    p_after: { status: "processing" },
    p_ip: ip,
  });

  return NextResponse.json({
    ok: true,
    processed: payoutIds.length,
    payoutIds,
  });
}
