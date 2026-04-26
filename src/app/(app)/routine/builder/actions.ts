"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LIST, ROUTINE_GOALS, type RoutineGoalSlug } from "@/lib/practices/categories";

const PrefsSchema = z.object({
  dailyTimeMinutes: z.number().int().min(1).max(30),
  goal: z.enum(ROUTINE_GOALS).optional(),
  preferredCategories: z.array(z.enum(CATEGORY_LIST as [string, ...string[]])).max(7),
  audioMode: z.enum(["silence", "nature", "binaural", "voice"]),
});

export interface BuilderPrefsResult {
  ok: boolean;
  error?: string;
}

export async function saveRoutinePreferences(
  input: z.infer<typeof PrefsSchema>,
): Promise<BuilderPrefsResult> {
  const parsed = PrefsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Préférences invalides." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tu dois être connecté·e." };

  const updates: Record<string, unknown> = {
    daily_time_minutes: parsed.data.dailyTimeMinutes,
    preferred_practices: parsed.data.preferredCategories,
    multisensorial_binaural: parsed.data.audioMode === "binaural",
  };
  if (parsed.data.goal) {
    updates.preferred_goals = [parsed.data.goal];
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
  if (error) {
    return { ok: false, error: "Sauvegarde impossible." };
  }

  revalidatePath("/home");
  revalidatePath("/routine/builder");
  return { ok: true };
}

const SurpriseSchema = z.object({
  dailyTimeMinutes: z.number().int().min(1).max(30),
  goal: z.enum(ROUTINE_GOALS),
  preferredCategories: z.array(z.string()).max(7).optional(),
  audioMode: z.enum(["silence", "nature", "binaural", "voice"]).optional(),
  pulse: z
    .object({
      stress: z.number().int().min(1).max(5),
      energy: z.number().int().min(1).max(5),
      mood: z.number().int().min(1).max(5),
    })
    .optional(),
});

export interface SurpriseResult {
  ok: boolean;
  error?: string;
  routineId?: string;
  practicesCount?: number;
}

export async function generateAndSaveRoutine(
  input: z.infer<typeof SurpriseSchema>,
): Promise<SurpriseResult> {
  const parsed = SurpriseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Paramètres invalides." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tu dois être connecté·e." };

  // Cookies forwarding nécessaires pour que la route /api/agent/* récupère la session.
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://kaia.purama.dev";
  const { headers } = await import("next/headers");
  const cookieStore = await headers();
  const cookieHeader = cookieStore.get("cookie") ?? "";

  const res = await fetch(`${origin}/api/agent/routine-generate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify({
      durationMinutes: parsed.data.dailyTimeMinutes,
      goal: parsed.data.goal,
      pulse: parsed.data.pulse,
      preferredCategories: parsed.data.preferredCategories,
      audioMode: parsed.data.audioMode,
      locale: "fr",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    return { ok: false, error: "L'IA n'a pas répondu, réessaie dans une minute." };
  }
  const data = (await res.json()) as {
    intro: string;
    practices: Array<{
      slug: string;
      title: string;
      category: string;
      durationSeconds: number;
      why: string;
      steps: string[];
    }>;
    totalSeconds: number;
  };

  // Map les pratiques générées sur le catalogue : on cherche un slug correspondant ;
  // sinon on conserve le slug IA + crée à la volée une "virtual practice" (sans persister).
  const slugs = data.practices.map((p) => p.slug);
  const { data: matched } = await supabase
    .from("practices")
    .select("id, slug")
    .in("slug", slugs);
  const slugToId = new Map<string, string>();
  for (const row of matched ?? []) slugToId.set(row.slug, row.id);

  const enriched = data.practices.map((p) => ({
    practice_id: slugToId.get(p.slug) ?? null,
    slug: p.slug,
    title: p.title,
    category: p.category,
    duration_seconds: p.durationSeconds,
    why: p.why,
    steps: p.steps,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const { data: upserted, error } = await supabase
    .from("daily_routines")
    .upsert(
      {
        user_id: user.id,
        routine_date: today,
        practices: enriched,
        total_seconds: data.totalSeconds,
        generated_by_ai: true,
        ai_model: process.env.ANTHROPIC_MODEL_MAIN ?? "claude-sonnet-4-6",
      },
      { onConflict: "user_id,routine_date" },
    )
    .select("id")
    .single();

  if (error || !upserted) {
    return { ok: false, error: "Sauvegarde de la routine impossible." };
  }

  revalidatePath("/home");
  return { ok: true, routineId: upserted.id, practicesCount: enriched.length };
}
