import Link from "next/link";
import { Sparkles, ArrowRight, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/Card";
import { HapticButton } from "@/components/multisensorial/HapticButton";
import { PulseCheck, type PulseValues } from "@/components/routine/PulseCheck";
import { RoutineCard } from "@/components/routine/RoutineCard";
import {
  ContinueChemin,
  type ContinuePractice,
} from "@/components/routine/ContinueChemin";
import { TokenChip } from "@/components/routine/TokenChip";
import { savePulse } from "./actions";
import { isValidCategory, type PracticeCategory } from "@/lib/practices/categories";
import { DAILY_TOKEN_CAP } from "@/lib/constants";

export const metadata = {
  title: "Routine du jour — KAÏA",
  description: "Ta routine multisensorielle adaptée à ton état du moment.",
};

interface RoutinePractice {
  practice_id: string;
  slug: string;
  title: string;
  category: PracticeCategory;
  duration_seconds: number;
  why?: string;
}

function formatDateFr(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Le layout (app) gère déjà le redirect login, défense en profondeur.
    return null;
  }

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  const [{ data: profile }, { data: tokens }, { data: routine }, { data: continuePool }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, streak_days, plan, daily_time_minutes, preferred_goals")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_tokens")
        .select("balance, daily_earned, daily_earned_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("daily_routines")
        .select("id, practices, pulse_stress, pulse_energy, pulse_mood, generated_by_ai")
        .eq("user_id", user.id)
        .eq("routine_date", todayIso)
        .maybeSingle(),
      supabase
        .from("practices")
        .select("id, slug, title, category, duration_seconds")
        .eq("active", true)
        .eq("premium_only", false)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "toi";
  const streak = profile?.streak_days ?? 0;

  const dailyEarned =
    tokens?.daily_earned_at === todayIso ? tokens?.daily_earned ?? 0 : 0;

  const initialPulse: PulseValues = {
    stress: routine?.pulse_stress ?? null,
    energy: routine?.pulse_energy ?? null,
    mood: routine?.pulse_mood ?? null,
  };

  const rawPractices = Array.isArray(routine?.practices) ? (routine.practices as unknown[]) : [];
  const routinePractices: RoutinePractice[] = rawPractices.flatMap((p): RoutinePractice[] => {
    if (typeof p !== "object" || p === null) return [];
    const obj = p as Record<string, unknown>;
    const category = obj.category;
    if (typeof category !== "string" || !isValidCategory(category)) return [];
    const id = typeof obj.practice_id === "string" ? obj.practice_id : String(obj.id ?? "");
    const slug = typeof obj.slug === "string" ? obj.slug : "";
    const title = typeof obj.title === "string" ? obj.title : "Pratique";
    const duration = typeof obj.duration_seconds === "number" ? obj.duration_seconds : 60;
    const why = typeof obj.why === "string" ? obj.why : undefined;
    if (!id || !slug) return [];
    const entry: RoutinePractice = {
      practice_id: id,
      slug,
      title,
      category,
      duration_seconds: duration,
    };
    if (why !== undefined) entry.why = why;
    return [entry];
  });

  const totalSeconds = routinePractices.reduce((s, p) => s + p.duration_seconds, 0);

  const continueList: ContinuePractice[] = (continuePool ?? [])
    .filter((p): p is { id: string; slug: string; title: string; category: string; duration_seconds: number } =>
      Boolean(p) && typeof p.category === "string" && isValidCategory(p.category),
    )
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category as PracticeCategory,
      durationSeconds: p.duration_seconds,
    }));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">
              {formatDateFr(today)}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight mt-1">
              Bonjour, {firstName}.
            </h1>
            <p className="text-white/55 mt-1">
              Quelques respirations, un petit geste pour toi.
            </p>
          </div>
          <TokenChip
            balance={tokens?.balance ?? 0}
            dailyEarned={dailyEarned}
            dailyCap={DAILY_TOKEN_CAP}
          />
        </div>
        {streak > 0 && (
          <p className="text-sm text-[var(--color-kaia-gold)]">
            🔥 {streak} {streak === 1 ? "jour" : "jours"} d'affilée — joli·e.
          </p>
        )}
      </header>

      <section aria-label="Pulse Check" className="space-y-4">
        <div>
          <h2 className="font-display text-xl text-white/95 tracking-tight">
            Comment tu te sens, là, maintenant&nbsp;?
          </h2>
          <p className="text-sm text-white/45 mt-1">
            Tape une fois — ça suffit. KAÏA adapte ta routine au pulse.
          </p>
        </div>
        <GlassCard>
          <PulseCheck initial={initialPulse} saveAction={savePulse} />
        </GlassCard>
      </section>

      <section aria-label="Routine du jour" className="space-y-4">
        <div className="flex items-baseline justify-between flex-wrap gap-3">
          <h2 className="font-display text-xl text-white/95 tracking-tight">
            Ta routine du jour
          </h2>
          {routinePractices.length > 0 && (
            <p className="text-sm text-white/45 tabular-nums">
              {routinePractices.length} pratique{routinePractices.length > 1 ? "s" : ""} ·{" "}
              {Math.max(1, Math.round(totalSeconds / 60))} min
            </p>
          )}
        </div>

        {routinePractices.length === 0 && (
          <GlassCard className="text-center py-10 space-y-4">
            <Wand2
              className="w-8 h-8 text-[var(--color-kaia-gold)] mx-auto"
              strokeWidth={1.5}
              aria-hidden
            />
            <div className="space-y-1">
              <p className="font-display text-xl text-white/90 tracking-tight">
                Pas encore de routine pour aujourd'hui.
              </p>
              <p className="text-sm text-white/55">
                Construis-la en 30 secondes, ou laisse KAÏA te surprendre.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Link href="/routine/builder">
                <HapticButton
                  variant="primary"
                  size="md"
                  hapticIntensity="success"
                >
                  <Sparkles className="w-4 h-4" strokeWidth={1.7} />
                  Construire ma routine
                </HapticButton>
              </Link>
              <Link href="/routine/builder?surprise=1">
                <HapticButton
                  variant="ghost"
                  size="md"
                  hapticIntensity="selection"
                >
                  Surprends-moi
                </HapticButton>
              </Link>
            </div>
          </GlassCard>
        )}

        {routinePractices.length > 0 && (
          <>
            <div className="grid gap-3">
              {routinePractices.map((p, idx) => (
                <RoutineCard
                  key={`${p.practice_id}-${idx}`}
                  index={idx}
                  total={routinePractices.length}
                  practiceId={p.practice_id}
                  practiceSlug={p.slug}
                  category={p.category}
                  title={p.title}
                  durationSeconds={p.duration_seconds}
                  why={p.why}
                  status="pending"
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href={`/routine/start?routineId=${routine?.id ?? ""}`}>
                <HapticButton
                  variant="primary"
                  size="lg"
                  hapticIntensity="success"
                  className="w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4" strokeWidth={1.7} />
                  Démarrer ma routine
                  <ArrowRight className="w-4 h-4 ml-1" strokeWidth={1.7} />
                </HapticButton>
              </Link>
              <Link href="/routine/builder">
                <HapticButton
                  variant="ghost"
                  size="lg"
                  hapticIntensity="selection"
                >
                  Modifier
                </HapticButton>
              </Link>
            </div>
          </>
        )}
      </section>

      {continueList.length > 0 && (
        <ContinueChemin
          practices={continueList}
          buildHref={(p) => `/routine/builder?prefill=${p.slug}`}
        />
      )}
    </div>
  );
}
