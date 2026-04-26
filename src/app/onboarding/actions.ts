"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { ROUTINE_GOALS } from "@/lib/practices/categories";
import { SUPPORTED_LOCALES, DAILY_TOKEN_CAP } from "@/lib/constants";
import { getEarnAmount } from "@/lib/tokens/earn-rules";

const Schema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
  goal: z.enum(ROUTINE_GOALS),
  dailyTimeMinutes: z.coerce.number().int().min(1).max(30),
  audioMode: z.enum(["silence", "nature", "binaural", "voice"]),
  multisensorial: z.object({
    background_video: z.boolean(),
    haptics: z.boolean(),
    binaural: z.boolean(),
    cinematic: z.boolean(),
  }),
  accessibility: z.object({
    high_contrast: z.boolean(),
    dyslexia_font: z.boolean(),
    reduced_motion: z.boolean(),
  }),
});

export interface OnboardingResult {
  ok: boolean;
  error?: string;
  awarded?: number;
}

export async function completeOnboarding(input: z.infer<typeof Schema>): Promise<OnboardingResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Réponses invalides — réessaie." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Tu dois être connecté·e pour finaliser l'onboarding." };
  }

  // Vérifie qu'on n'est pas déjà onboarded (idempotency).
  const { data: existing } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  const alreadyOnboarded = Boolean(existing?.onboarded_at);

  const data = parsed.data;
  const updates = {
    preferred_locale: data.locale,
    preferred_goals: [data.goal],
    daily_time_minutes: data.dailyTimeMinutes,
    multisensorial_background_video: data.multisensorial.background_video,
    multisensorial_haptics: data.multisensorial.haptics,
    multisensorial_binaural: data.multisensorial.binaural,
    multisensorial_cinematic: data.multisensorial.cinematic,
    accessibility_high_contrast: data.accessibility.high_contrast,
    accessibility_dyslexia_font: data.accessibility.dyslexia_font,
    accessibility_reduced_motion: data.accessibility.reduced_motion,
    onboarded_at: alreadyOnboarded ? undefined : new Date().toISOString(),
  };

  const { error: upErr } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (upErr) {
    return { ok: false, error: "Sauvegarde impossible. Réessaie." };
  }

  // Award onboarding tokens — uniquement si c'est la 1ère fois.
  let awarded = 0;
  if (!alreadyOnboarded) {
    const admin = createServiceClient();
    const onboardDelta = getEarnAmount("onboarding_complete");
    const firstRoutineDelta = getEarnAmount("first_routine");
    const today = new Date().toISOString().slice(0, 10);

    const { data: r1 } = await admin.rpc("apply_token_event", {
      p_user_id: user.id,
      p_delta: onboardDelta,
      p_reason: "onboarding_complete",
      p_metadata: { goal: data.goal, dailyTimeMinutes: data.dailyTimeMinutes },
      p_idempotency_key: `onboarding-complete-${user.id}`,
      p_daily_cap: DAILY_TOKEN_CAP,
    });
    const r1Row = Array.isArray(r1) ? r1[0] : r1;
    if (r1Row?.applied) awarded += onboardDelta;

    const { data: r2 } = await admin.rpc("apply_token_event", {
      p_user_id: user.id,
      p_delta: firstRoutineDelta,
      p_reason: "first_routine",
      p_metadata: { date: today },
      p_idempotency_key: `first-routine-${user.id}`,
      p_daily_cap: DAILY_TOKEN_CAP,
    });
    const r2Row = Array.isArray(r2) ? r2[0] : r2;
    if (r2Row?.applied) awarded += firstRoutineDelta;
  }

  revalidatePath("/", "layout");

  return { ok: true, awarded };
}
