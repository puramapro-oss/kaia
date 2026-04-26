import { createClient } from "@/lib/supabase/server";
import { AuraGlow } from "@/components/universe/AuraGlow";
import { LifeTimeline, type TimelineEvent } from "@/components/universe/LifeTimeline";
import { UniverseStats } from "@/components/universe/UniverseStats";
import { Badges } from "@/components/universe/Badges";
import { computeAxes } from "@/lib/impact/aggregate";

export const metadata = {
  title: "Mon univers — KAÏA",
  description: "Ton fil de vie, ta progression intérieure, ton aura.",
};

interface PracticeWithCategory {
  id: string;
  category: string;
}

export default async function UniversePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    { data: profile },
    { data: tokens },
    { data: sessions },
    { data: routines },
    { data: tokenEvents },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, awakening_level, streak_days, streak_last_at, created_at, plan",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_tokens")
      .select("balance, lifetime_earned")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("practice_sessions")
      .select("id, practice_id, completed_at, duration_seconds, status, practices(category, title, slug)")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(50),
    supabase
      .from("daily_routines")
      .select("id, routine_date, total_seconds")
      .eq("user_id", user.id)
      .order("routine_date", { ascending: false })
      .limit(20),
    supabase
      .from("token_events")
      .select("id, delta, reason, created_at")
      .eq("user_id", user.id)
      .in("reason", ["streak_7_bonus", "streak_30_bonus", "onboarding_complete", "first_routine"])
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Stats
  const totalSeconds = (routines ?? []).reduce(
    (s, r) => s + (typeof r.total_seconds === "number" ? r.total_seconds : 0),
    0,
  );
  const daysActive = new Set(
    (sessions ?? [])
      .map((s) => (typeof s.completed_at === "string" ? s.completed_at.slice(0, 10) : null))
      .filter((d): d is string => d !== null),
  ).size;

  // Catégories pour les axes.
  const categoryCounts: Record<string, number> = {
    meditation: 0,
    breathing: 0,
    mantra: 0,
    mudra: 0,
    movement: 0,
    learning: 0,
    reprogramming: 0,
  };
  for (const s of sessions ?? []) {
    const p = s.practices as unknown as PracticeWithCategory | PracticeWithCategory[] | null;
    const cat = Array.isArray(p) ? p[0]?.category : p?.category;
    if (cat && cat in categoryCounts) categoryCounts[cat]++;
  }

  const axes = computeAxes({
    practicesCount: sessions?.length ?? 0,
    meditationCount: categoryCounts.meditation,
    breathingCount: categoryCounts.breathing,
    learningCount: categoryCounts.learning,
    reprogrammingCount: categoryCounts.reprogramming,
    movementCount: categoryCounts.movement,
    streakDays: profile?.streak_days ?? 0,
    awakeningLevel: profile?.awakening_level ?? 1,
  });

  // Timeline events
  const events: TimelineEvent[] = [];
  for (const s of sessions ?? []) {
    if (!s.completed_at) continue;
    const p = s.practices as unknown as { title?: string; slug?: string } | { title?: string; slug?: string }[] | null;
    const practiceObj = Array.isArray(p) ? p[0] : p;
    events.push({
      id: `practice-${s.id}`,
      kind: "practice",
      title: practiceObj?.title ?? "Pratique terminée",
      subtitle:
        typeof s.duration_seconds === "number" && s.duration_seconds > 0
          ? `${Math.round(s.duration_seconds / 60)} min`
          : undefined,
      at: String(s.completed_at),
    });
  }
  for (const t of tokenEvents ?? []) {
    const reason = String(t.reason);
    let title = "+ tokens";
    let kind: TimelineEvent["kind"] = "tokens";
    if (reason === "streak_7_bonus") {
      title = "Série de 7 jours";
      kind = "streak";
    } else if (reason === "streak_30_bonus") {
      title = "Série de 30 jours";
      kind = "streak";
    } else if (reason === "onboarding_complete") {
      title = "Bienvenue dans KAÏA";
      kind = "onboarding";
    } else if (reason === "first_routine") {
      title = "Première routine";
      kind = "first_routine";
    }
    events.push({
      id: `token-${t.id}`,
      kind,
      title,
      subtitle: typeof t.delta === "number" ? `+${t.delta} tokens` : undefined,
      at: String(t.created_at),
    });
  }
  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const trimmed = events.slice(0, 30);

  const firstName = profile?.full_name?.split(" ")[0] ?? "toi";
  const awakeningLevel = profile?.awakening_level ?? 1;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">Mon univers</span>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Ton chemin, {firstName}.
        </h1>
        <p className="text-white/55 max-w-2xl">
          Aucun classement vs autres. Juste ce que tu fais, ce que tu construis — à ton rythme.
        </p>
      </header>

      <section
        aria-label="Aura"
        className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-6"
      >
        <AuraGlow level={awakeningLevel} />
      </section>

      <UniverseStats
        stats={[
          { label: "Jours actifs", value: daysActive, hint: "1 jour = 1 session minimum" },
          { label: "Pratiques", value: sessions?.length ?? 0 },
          { label: "Minutes pour toi", value: Math.round(totalSeconds / 60) },
          { label: "Tokens à vie", value: tokens?.lifetime_earned ?? 0 },
        ]}
      />

      <Badges axes={axes} />

      <section className="space-y-3" aria-label="Cross-apps">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/45">Mon écosystème</h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="font-display text-base text-white/85">D'autres apps PURAMA bientôt.</p>
          <p className="text-sm text-white/55 mt-1 leading-relaxed">
            MIDAS (finances), AKASHA (savoir), VIDA (santé), PRANA (souffle) — ton univers
            complet, en un seul compte. Connexion en cours.
          </p>
        </div>
      </section>

      <section className="space-y-3" aria-label="Fil de vie">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/45">Ton fil de vie</h2>
        <LifeTimeline events={trimmed} />
      </section>
    </div>
  );
}
