/**
 * CRON `/api/cron/daily-routine-prep`
 *  - Schedule (vercel.json) : `0 4 * * *` (04:00 UTC daily)
 *  - Pour chaque user actif (subscription valid, onboarding terminé) :
 *    1. Vérifie qu'une entrée daily_routines existe pour demain
 *    2. Si absente → génère via Claude (askClaudeJSON) en batch de 50 max
 *    3. Idempotent : on ne recalcule pas si l'entrée existe déjà
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/contests/cron-helpers";
import { askClaudeJSON } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_SIZE = 50;

interface UserProfile {
  user_id: string;
  cycle_phase?: string | null;
  preferred_duration_min?: number | null;
  locale?: string | null;
}

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowDate = tomorrow.toISOString().slice(0, 10);

  // Active users: subscription not expired + onboarding done (profiles table)
  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .select("user_id, cycle_phase, preferred_duration_min, locale")
    .eq("onboarding_completed", true)
    .limit(BATCH_SIZE);

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  const users = (profiles ?? []) as UserProfile[];
  if (!users.length) {
    return NextResponse.json({ ok: true, prepared: 0, skipped: 0 });
  }

  const userIds = users.map((u) => u.user_id);

  // Idempotency: find which ones already have a routine for tomorrow
  const { data: existing } = await admin
    .from("daily_routines")
    .select("user_id")
    .in("user_id", userIds)
    .eq("scheduled_date", tomorrowDate);

  const existingSet = new Set((existing ?? []).map((r) => r.user_id as string));
  const toGenerate = users.filter((u) => !existingSet.has(u.user_id));

  let prepared = 0;
  const errors: string[] = [];

  for (const user of toGenerate) {
    try {
      const phase = user.cycle_phase ?? "follicular";
      const duration = user.preferred_duration_min ?? 20;
      const locale = user.locale ?? "fr";

      const routine = await askClaudeJSON<{
        title: string;
        tagline: string;
        steps: Array<{ id: string; name: string; duration_min: number; practice_type: string }>;
      }>(`Generate a ${duration}-min wellness morning routine for cycle phase "${phase}".
Locale: ${locale}. Return JSON: { title, tagline, steps: [{id, name, duration_min, practice_type}] }.
Keep it realistic, calming, grounding. Respond only with valid JSON.`);

      if (routine) {
        await admin.from("daily_routines").upsert(
          {
            user_id: user.user_id,
            scheduled_date: tomorrowDate,
            title: routine.title,
            tagline: routine.tagline,
            steps: routine.steps,
            cycle_phase: phase,
            duration_min: duration,
            generated_at: now.toISOString(),
          },
          { onConflict: "user_id,scheduled_date", ignoreDuplicates: true },
        );
        prepared++;
      }
    } catch (err) {
      errors.push(`${user.user_id}: ${String(err)}`);
    }
  }

  return NextResponse.json({
    ok: true,
    prepared,
    skipped: existingSet.size,
    errors: errors.length ? errors : undefined,
  });
}

export const POST = GET;
