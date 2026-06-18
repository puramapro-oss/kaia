import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";

const Body = z.object({
  userId: z.string().uuid(),
  ban: z.boolean(),
  reason: z.string().max(500).optional(),
});

export const runtime = "nodejs";

/** Bannit / débannit un utilisateur (admin only, audité). */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalide." }, { status: 400 });

  const { admin, userId: adminId, ip } = guard;
  const { userId, ban, reason } = parsed.data;

  // Garde-fou : un admin ne se bannit pas lui-même.
  if (userId === adminId) {
    return NextResponse.json({ error: "Tu ne peux pas te bannir toi-même." }, { status: 400 });
  }

  const { data: target } = await admin
    .from("profiles")
    .select("id, banned_at")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  const { error } = await admin
    .from("profiles")
    .update({
      banned_at: ban ? new Date().toISOString() : null,
      banned_reason: ban ? reason ?? null : null,
    })
    .eq("id", userId);
  if (error) {
    console.error("Ban update error:", error);
    return NextResponse.json({ error: "Action impossible." }, { status: 500 });
  }

  await admin.rpc("log_admin_audit", {
    p_admin_user_id: adminId,
    p_action: ban ? "user_banned" : "user_unbanned",
    p_target_table: "profiles",
    p_target_id: userId,
    p_before: { banned_at: target.banned_at },
    p_after: { banned: ban, reason: ban ? reason ?? null : null },
    p_ip: ip,
  });

  return NextResponse.json({ ok: true, banned: ban });
}
