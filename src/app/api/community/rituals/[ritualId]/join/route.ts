/**
 * POST /api/community/rituals/[ritualId]/join — participer au rituel hebdo.
 * RPC join_weekly_ritual atomique (idempotent + bumps counter).
 * Si succès → +30 tokens via apply_token_event (idempotency_key dérivée).
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getEarnAmount } from "@/lib/tokens/earn-rules";

export const runtime = "nodejs";

const Params = z.object({ ritualId: z.string().uuid() });

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ ritualId: string }> },
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

  const rl = await rateLimit(`ritual-join:${user.id}`, 5, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessaie." }, { status: 429 });
  }

  const { data, error } = await supabase.rpc("join_weekly_ritual", {
    p_ritual_id: parsed.data.ritualId,
  });

  if (error) {
    if (error.code === "P0002") {
      return NextResponse.json({ error: "Rituel introuvable." }, { status: 404 });
    }
    if (error.code === "P0010") {
      return NextResponse.json({ error: "Le rituel n'a pas encore commencé." }, { status: 409 });
    }
    if (error.code === "P0011") {
      return NextResponse.json({ error: "Le rituel est terminé." }, { status: 410 });
    }
    return NextResponse.json(
      { error: "Participation impossible.", details: error.message },
      { status: 500 },
    );
  }

  const result = Array.isArray(data) ? data[0] : data;
  const isFirstJoin = result?.status === "joined";

  // Si vraiment nouveau → tokens +30
  let tokensCredited = 0;
  if (isFirstJoin) {
    const admin = createServiceClient();
    const amount = getEarnAmount("ritual_completed"); // 30
    const idempotencyKey = `ritual-${parsed.data.ritualId}-${user.id}`;

    const { error: tokensErr } = await admin.rpc("apply_token_event", {
      p_user_id: user.id,
      p_delta: amount,
      p_reason: "ritual_completed",
      p_metadata: { ritual_id: parsed.data.ritualId },
      p_idempotency_key: idempotencyKey,
    });

    if (!tokensErr) {
      tokensCredited = amount;
    }
    // Si l'idempotency frappe (déjà crédité), on ignore silencieusement.
  }

  return NextResponse.json({
    status: result?.status ?? "joined",
    participantsCount: result?.participants_count ?? 0,
    tokensCredited,
    alreadyJoined: !!result?.already_joined,
  });
}
