"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wand2, Save, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/Card";
import { HapticButton } from "@/components/multisensorial/HapticButton";
import {
  CATEGORY_LIST,
  PRACTICE_CATEGORIES,
  ROUTINE_GOALS,
  GOAL_EMOJI,
  GOAL_LABELS_FR,
  type PracticeCategory,
  type RoutineGoalSlug,
} from "@/lib/practices/categories";
import { cn } from "@/lib/utils";
import {
  saveRoutinePreferences,
  generateAndSaveRoutine,
} from "./actions";

const TIME_OPTIONS = [1, 3, 5, 10, 15, 30] as const;
type AudioMode = "silence" | "nature" | "binaural" | "voice";
const AUDIO_OPTIONS: Array<{ id: AudioMode; label: string; sub: string }> = [
  { id: "silence", label: "Silence", sub: "Aucun son d'ambiance." },
  { id: "nature", label: "Nature", sub: "Forêt, océan, vent." },
  { id: "binaural", label: "Binaural", sub: "Fréquences subtiles." },
  { id: "voice", label: "Voix", sub: "Voix qui guide." },
];

interface RoutineBuilderProps {
  initial: {
    dailyTimeMinutes: number;
    goal: RoutineGoalSlug | null;
    preferredCategories: PracticeCategory[];
    audioMode: AudioMode;
  };
  todayPulse?: { stress: number; energy: number; mood: number } | null;
  autoSurprise?: boolean;
}

export function RoutineBuilder({ initial, todayPulse, autoSurprise }: RoutineBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [dailyTime, setDailyTime] = useState(initial.dailyTimeMinutes);
  const [goal, setGoal] = useState<RoutineGoalSlug | null>(initial.goal);
  const [audio, setAudio] = useState<AudioMode>(initial.audioMode);
  const [cats, setCats] = useState<Set<PracticeCategory>>(
    () => new Set(initial.preferredCategories),
  );

  const toggleCat = (c: PracticeCategory) => {
    setCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const handleSavePrefs = () => {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await saveRoutinePreferences({
        dailyTimeMinutes: dailyTime,
        goal: goal ?? undefined,
        preferredCategories: Array.from(cats),
        audioMode: audio,
      });
      if (!res.ok) {
        setError(res.error ?? "Sauvegarde impossible.");
        return;
      }
      setInfo("Préférences enregistrées.");
    });
  };

  const handleSurprise = () => {
    setError(null);
    setInfo(null);
    if (!goal) {
      setError("Choisis un objectif pour que KAÏA t'invente quelque chose.");
      return;
    }
    startTransition(async () => {
      const res = await generateAndSaveRoutine({
        dailyTimeMinutes: dailyTime,
        goal,
        preferredCategories: Array.from(cats),
        audioMode: audio,
        ...(todayPulse ? { pulse: todayPulse } : {}),
      });
      if (!res.ok) {
        setError(res.error ?? "Génération impossible.");
        return;
      }
      router.push("/home");
      router.refresh();
    });
  };

  // Auto-surprise (lien direct depuis /home)
  if (autoSurprise && !isPending && !error && !info) {
    // déclenche une seule fois via micro-task
    queueMicrotask(handleSurprise);
  }

  return (
    <div className="space-y-6">
      <GlassCard className="space-y-5">
        <Section title="Durée" subtitle="Combien de minutes aujourd'hui ?">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {TIME_OPTIONS.map((t) => {
              const active = dailyTime === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDailyTime(t)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl border h-12 wellness-anim font-display tabular-nums",
                    active
                      ? "border-[var(--color-kaia-accent)] bg-white/[0.06] text-white"
                      : "border-white/10 text-white/65 hover:text-white",
                  )}
                >
                  {t} min
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Objectif" subtitle="Une seule chose à la fois.">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ROUTINE_GOALS.map((g) => {
              const active = goal === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl border p-3 wellness-anim text-center",
                    active
                      ? "border-[var(--color-kaia-accent)] bg-white/[0.06]"
                      : "border-white/10 hover:border-white/20",
                  )}
                >
                  <div className="text-2xl mb-1">{GOAL_EMOJI[g]}</div>
                  <div className="text-sm font-display text-white/95">{GOAL_LABELS_FR[g]}</div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Catégories" subtitle="Coche celles que tu aimes ; vide = tout possible.">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORY_LIST.map((c) => {
              const spec = PRACTICE_CATEGORIES[c];
              const active = cats.has(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCat(c)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl border p-3 wellness-anim text-left flex items-center gap-3",
                    active ? "border-white/30 bg-white/[0.05]" : "border-white/10 hover:border-white/20",
                  )}
                >
                  <span
                    className="h-8 w-8 rounded-xl flex items-center justify-center font-display shrink-0"
                    style={{ background: `${spec.accent}22`, color: spec.accent }}
                    aria-hidden
                  >
                    {spec.labelFr.charAt(0)}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-display text-white/95">{spec.labelFr}</div>
                    <div className="text-xs text-white/50">{spec.shortFr}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Ambiance audio" subtitle="Tu peux changer pendant la session.">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AUDIO_OPTIONS.map((m) => {
              const active = audio === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAudio(m.id)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl border p-3 wellness-anim text-left",
                    active ? "border-[var(--color-kaia-accent)] bg-white/[0.06]" : "border-white/10",
                  )}
                >
                  <div className="text-sm font-display text-white/95">{m.label}</div>
                  <div className="text-xs text-white/50">{m.sub}</div>
                </button>
              );
            })}
          </div>
        </Section>
      </GlassCard>

      <div className="flex flex-wrap gap-2">
        <HapticButton
          onClick={handleSurprise}
          variant="primary"
          size="lg"
          hapticIntensity="success"
          disabled={isPending || !goal}
        >
          <Wand2 className="w-4 h-4" strokeWidth={1.7} />
          {isPending ? "KAÏA imagine…" : "Surprends-moi"}
          <ArrowRight className="w-4 h-4 ml-1" strokeWidth={1.7} />
        </HapticButton>
        <HapticButton
          onClick={handleSavePrefs}
          variant="ghost"
          size="lg"
          hapticIntensity="selection"
          disabled={isPending}
        >
          <Save className="w-4 h-4" strokeWidth={1.7} />
          Enregistrer mes préférences
        </HapticButton>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-kaia-terracotta)]" role="alert">
          {error}
        </p>
      )}
      {info && !error && <p className="text-sm text-[var(--color-kaia-accent)]">{info}</p>}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{title}</p>
        <p className="text-sm text-white/55">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
