/**
 * POST /api/community/groups/[groupId]/join — rejoindre un groupe pratique.
 * Idempotent (PK group_id+user_id). Vérifie capacity.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Params = z.object({ groupId: z.string().uuid() });

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Auth requise." }, { status: 401 });
  }

  const params = await ctx.params;
  const parsed = Params.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  const rl = await rateLimit(`groups-join:${user.id}`, 10, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop d'inscriptions. Réessaie." }, { status: 429 });
  }

  // Vérif group + capacity
  const { data: group } = await supabase
    .from("practice_groups")
    .select("id, capacity, meet_url, active")
    .eq("id", parsed.data.groupId)
    .maybeSingle();

  if (!group || !group.active) {
    return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
  }

  // Si déjà membre → idempotent
  const { data: existing } = await supabase
    .from("group_memberships")
    .select("group_id")
    .eq("group_id", parsed.data.groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      alreadyMember: true,
      meetUrl: group.meet_url,
    });
  }

  // Capacity check
  const { count } = await supabase
    .from("group_memberships")
    .select("group_id", { count: "exact", head: true })
    .eq("group_id", parsed.data.groupId);

  if ((count ?? 0) >= group.capacity) {
    return NextResponse.json(
      { error: "Ce groupe est complet pour l'instant." },
      { status: 409 },
    );
  }

  const { error: insertErr } = await supabase.from("group_memberships").insert({
    group_id: parsed.data.groupId,
    user_id: user.id,
  });

  if (insertErr) {
    return NextResponse.json(
      { error: "Inscription impossible.", details: insertErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ joined: true, meetUrl: group.meet_url });
}
