import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getEarnAmount, EARN_RULES } from "@/lib/tokens/earn-rules";
import { computeMultiplier, applyMultiplier } from "@/lib/tokens/multiplier";
import { computeStreakAfterRoutine } from "@/lib/tokens/streak";
import { DAILY_TOKEN_CAP } from "@/lib/constants";

export const runtime = "nodejs";

const Body = z.object({
  sessionId: z.string().uuid(),
  durationSeconds: z.number().int().min(0).max(3600),
  postState: z
    .object({
      stress: z.number().int().min(1).max(5).optional(),
      energy: z.number().int().min(1).max(5).optional(),
      mood: z.number().int().min(1).max(5).optional(),
      note: z.string().max(280).optional(),
    })
    .optional(),
  /** True si la session termine la routine du jour entière (dernière pratique). */
  completesRoutine: z.boolean().optional(),
});

interface EarnApplied {
  reason: string;
  delta: number;
  applied: boolean;
}

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tu dois être connecté·e." }, { status: 401 });
  }

  const rl = await rateLimit(`practice-complete:${user.id}`, 30, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de complétions rapides." }, { status: 429 });
  }

  // Lire la session + s'assurer qu'elle appartient à l'user et qu'elle n'est pas déjà completed.
  const { data: session, error: sessErr } = await supabase
    .from("practice_sessions")
    .select("id, user_id, status, routine_id, started_at")
    .eq("id", parsed.data.sessionId)
    .maybeSingle();

  if (sessErr || !session) {
    return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
  }
  if (session.user_id !== user.id) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  // Idempotency : si déjà completed → renvoyer l'état actuel sans re-créditer.
  if (session.status === "completed") {
    const { data: tokens } = await supabase
      .from("user_tokens")
      .select("balance, daily_earned, daily_earned_at")
      .eq("user_id", user.id)
      .maybeSingle();
    return NextResponse.json({
      alreadyCompleted: true,
      newBalance: tokens?.balance ?? 0,
      earnedThisSession: 0,
      earns: [],
    });
  }

  // Multiplicateur ancienneté
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, subscription_current_period_end, streak_days, streak_last_at, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const subStarted =
    profile?.subscription_current_period_end ?? null;
  const multiplier = computeMultiplier({
    plan: profile?.plan ?? "free",
    subscriptionStartedAt: profile?.created_at ?? null,
    // On utilise created_at comme proxy d'ancienneté abonné — Phase 2 on stockera la vraie subscription_started_at.
  });

  // Mark session completed (avant earns pour éviter race)
  await supabase
    .from("practice_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      duration_seconds: parsed.data.durationSeconds,
      post_state: parsed.data.postState ?? null,
    })
    .eq("id", session.id)
    .eq("user_id", user.id);

  const admin = createServiceClient();
  const earns: EarnApplied[] = [];

  // 1) Earn pour la pratique
  const practiceBase = getEarnAmount("practice_completed");
  const practiceDelta = applyMultiplier(practiceBase, multiplier);
  const { data: e1 } = await admin.rpc("apply_token_event", {
    p_user_id: user.id,
    p_delta: practiceDelta,
    p_reason: "practice_completed",
    p_metadata: { sessionId: session.id, multiplier, base: practiceBase },
    p_idempotency_key: `session-${session.id}-practice`,
    p_daily_cap: DAILY_TOKEN_CAP,
  });
  const e1Row = Array.isArray(e1) ? e1[0] : e1;
  earns.push({
    reason: "practice_completed",
    delta: practiceDelta,
    applied: e1Row?.applied ?? false,
  });

  // 2) Si dernière pratique de la routine → earn routine_completed + streak update
  let newBalance = e1Row?.new_balance ?? 0;
  let newStreak: number | null = null;

  if (parsed.data.completesRoutine && session.routine_id) {
    const routineBase = getEarnAmount("routine_completed");
    const routineDelta = applyMultiplier(routineBase, multiplier);
    const { data: e2 } = await admin.rpc("apply_token_event", {
      p_user_id: user.id,
      p_delta: routineDelta,
      p_reason: "routine_completed",
      p_metadata: { routineId: session.routine_id, multiplier },
      p_idempotency_key: `routine-${session.routine_id}-complete`,
      p_daily_cap: DAILY_TOKEN_CAP,
    });
    const e2Row = Array.isArray(e2) ? e2[0] : e2;
    earns.push({
      reason: "routine_completed",
      delta: routineDelta,
      applied: e2Row?.applied ?? false,
    });
    if (e2Row?.applied) newBalance = e2Row.new_balance;

    // Streak update
    const streakResult = computeStreakAfterRoutine({
      currentStreak: profile?.streak_days ?? 0,
      lastRoutineDate: profile?.streak_last_at,
    });
    if (streakResult.shouldUpdate) {
      const todayIso = new Date().toISOString().slice(0, 10);
      await supabase
        .from("profiles")
        .update({
          streak_days: streakResult.newStreak,
          streak_last_at: todayIso,
        })
        .eq("id", user.id);
      newStreak = streakResult.newStreak;

      // Bonus streak (streak_7 / streak_30) — un seul, le plus haut atteint.
      for (const bonus of streakResult.bonuses) {
        const base = EARN_RULES[bonus].baseTokens;
        const delta = applyMultiplier(base, multiplier);
        const idemKey = `streak-${bonus}-${user.id}-${streakResult.newStreak}`;
        const { data: eb } = await admin.rpc("apply_token_event", {
          p_user_id: user.id,
          p_delta: delta,
          p_reason: bonus,
          p_metadata: { streak: streakResult.newStreak, multiplier },
          p_idempotency_key: idemKey,
          p_daily_cap: DAILY_TOKEN_CAP,
        });
        const ebRow = Array.isArray(eb) ? eb[0] : eb;
        earns.push({ reason: bonus, delta, applied: ebRow?.applied ?? false });
        if (ebRow?.applied) newBalance = ebRow.new_balance;
      }
    } else {
      newStreak = profile?.streak_days ?? 0;
    }
  }

  const earnedThisSession = earns
    .filter((e) => e.applied)
    .reduce((sum, e) => sum + e.delta, 0);

  return NextResponse.json({
    sessionId: session.id,
    newBalance,
    earnedThisSession,
    earns,
    multiplier,
    streak: newStreak,
    debug: { subStarted },
  });
}
