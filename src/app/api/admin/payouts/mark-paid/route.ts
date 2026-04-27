import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";

const Body = z.object({ payoutId: z.string().uuid() });

export const runtime = "nodejs";

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
  if (!parsed.success) return NextResponse.json({ error: "Invalide." }, { status: 400 });

  const { admin, userId, ip } = guard;

  const { data: payout } = await admin
    .from("influencer_payouts")
    .select("id, status, amount_cents")
    .eq("id", parsed.data.payoutId)
    .maybeSingle();
  if (!payout) return NextResponse.json({ error: "Payout introuvable." }, { status: 404 });
  if (payout.status === "paid") {
    return NextResponse.json({ error: "Déjà payé." }, { status: 409 });
  }

  await admin
    .from("influencer_payouts")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", parsed.data.payoutId);

  await admin.rpc("log_admin_audit", {
    p_admin_user_id: userId,
    p_action: "payout_marked_paid",
    p_target_table: "influencer_payouts",
    p_target_id: parsed.data.payoutId,
    p_before: { status: payout.status },
    p_after: { status: "paid", amount_cents: payout.amount_cents },
    p_ip: ip,
  });

  return NextResponse.json({ ok: true });
}
