import { createClient } from "@/lib/supabase/server";
import { RoutineBuilder } from "./RoutineBuilder";
import {
  CATEGORY_LIST,
  ROUTINE_GOALS,
  type PracticeCategory,
  type RoutineGoalSlug,
} from "@/lib/practices/categories";

export const metadata = {
  title: "Construire ma routine — KAÏA",
};

interface PageProps {
  searchParams: Promise<{ surprise?: string }>;
}

export default async function BuilderPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: profile }, { data: routine }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "daily_time_minutes, preferred_practices, preferred_goals, multisensorial_binaural",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("daily_routines")
      .select("pulse_stress, pulse_energy, pulse_mood")
      .eq("user_id", user.id)
      .eq("routine_date", today)
      .maybeSingle(),
  ]);

  const validCats: PracticeCategory[] = (profile?.preferred_practices ?? []).filter(
    (c: string): c is PracticeCategory => CATEGORY_LIST.includes(c as PracticeCategory),
  );
  const validGoal =
    profile?.preferred_goals && profile.preferred_goals.length > 0
      ? (ROUTINE_GOALS as readonly string[]).includes(profile.preferred_goals[0])
        ? (profile.preferred_goals[0] as RoutineGoalSlug)
        : null
      : null;

  const todayPulse =
    routine?.pulse_stress && routine?.pulse_energy && routine?.pulse_mood
      ? { stress: routine.pulse_stress, energy: routine.pulse_energy, mood: routine.pulse_mood }
      : null;

  const params = await searchParams;
  const autoSurprise = params.surprise === "1";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="space-y-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">Builder</span>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Compose ta routine.
        </h1>
        <p className="text-white/55">
          Ajuste la durée, l'objectif, les catégories. Ou laisse KAÏA imaginer.
        </p>
      </header>

      <RoutineBuilder
        initial={{
          dailyTimeMinutes: profile?.daily_time_minutes ?? 4,
          goal: validGoal,
          preferredCategories: validCats,
          audioMode: profile?.multisensorial_binaural ? "binaural" : "nature",
        }}
        todayPulse={todayPulse}
        autoSurprise={autoSurprise}
      />
    </div>
  );
}
