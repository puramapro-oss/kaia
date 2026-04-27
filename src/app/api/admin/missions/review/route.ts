/**
 * POST /api/admin/missions/review
 *  - Body : { completionId: uuid, decision: 'approved'|'rejected', userId: uuid }
 *  - Approve : update mission_completions + RPC apply_token_event(reward_tokens) idempotent
 *  - Reject : update mission_completions
 *  - Audit log obligatoire
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";

const Body = z.object({
  completionId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  userId: z.string().uuid(),
});

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
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { admin, userId: adminUserId, ip } = guard;

  const { data: completion, error: cErr } = await admin
    .from("mission_completions")
    .select("id, mission_id, user_id, status, missions(reward_tokens)")
    .eq("id", parsed.data.completionId)
    .maybeSingle();
  if (cErr || !completion) {
    return NextResponse.json({ error: "Completion introuvable." }, { status: 404 });
  }
  if (completion.status !== "pending") {
    return NextResponse.json({ error: "Déjà traitée." }, { status: 409 });
  }

  const before = { status: completion.status };
  const missionsRel = (completion as unknown as {
    missions: { reward_tokens: number } | { reward_tokens: number }[] | null;
  }).missions;
  const missionMeta = Array.isArray(missionsRel) ? missionsRel[0] : missionsRel;
  const reward = missionMeta?.reward_tokens ?? 0;

  await admin
    .from("mission_completions")
    .update({
      status: parsed.data.decision,
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
      reward_paid_at: parsed.data.decision === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.completionId);

  if (parsed.data.decision === "approved" && reward > 0) {
    await admin.rpc("apply_token_event", {
      p_user_id: parsed.data.userId,
      p_delta: reward,
      p_reason: "mission_approved",
      p_metadata: { completionId: parsed.data.completionId, missionId: completion.mission_id },
      p_idempotency_key: `mission_completion_${parsed.data.completionId}`,
    });
  }

  await admin.rpc("log_admin_audit", {
    p_admin_user_id: adminUserId,
    p_action: `mission_${parsed.data.decision}`,
    p_target_table: "mission_completions",
    p_target_id: parsed.data.completionId,
    p_before: before,
    p_after: { status: parsed.data.decision, reward_tokens: reward },
    p_ip: ip,
  });

  return NextResponse.json({ ok: true });
}
