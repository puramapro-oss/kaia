"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Pause, SkipForward, X, AlertCircle, Sparkles } from "lucide-react";
import { BreathingCircle } from "@/components/multisensorial/BreathingCircle";
import { HapticButton } from "@/components/multisensorial/HapticButton";
import { startBinaural, getPreset, type BinauralPreset } from "@/lib/audio/binaural";
import { useMultisensorialPrefs } from "@/hooks/useMultisensorialPrefs";
import { haptic } from "@/lib/multisensorial/haptics";
import { cn } from "@/lib/utils";
import {
  PRACTICE_CATEGORIES,
  type PracticeCategory,
} from "@/lib/practices/categories";

interface PracticeStep {
  order: number;
  text_fr: string;
  text_en?: string;
  duration_seconds?: number;
}

export interface SessionPlayerProps {
  sessionId: string;
  practice: {
    slug: string;
    title: string;
    category: PracticeCategory;
    durationSeconds: number;
    steps: PracticeStep[];
  };
  routineId: string | null;
  audioMode: "silence" | "nature" | "binaural" | "voice";
  isLastInRoutine: boolean;
  /** Locale BCP-47 pour Web Speech (`fr-FR`, `en-US`, …). */
  speechLocale: string;
}

type Status = "intro" | "running" | "paused" | "post";

const PRESET_BY_CATEGORY: Partial<Record<PracticeCategory, BinauralPreset>> = {
  meditation: "alpha",
  breathing: "alpha",
  mantra: "theta",
  reprogramming: "theta",
  movement: "beta",
  learning: "beta",
  mudra: "alpha",
};

export function SessionPlayer({
  sessionId,
  practice,
  routineId,
  audioMode,
  isLastInRoutine,
  speechLocale,
}: SessionPlayerProps) {
  const prefs = useMultisensorialPrefs();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>("intro");
  const [stepIdx, setStepIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(practice.durationSeconds);
  const [postPulse, setPostPulse] = useState<{ stress: number | null; energy: number | null; mood: number | null }>({
    stress: null,
    energy: null,
    mood: null,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<{ earned: number; balance: number } | null>(null);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopBinauralRef = useRef<{ stop: () => void } | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const spec = PRACTICE_CATEGORIES[practice.category];
  const useBreathing = practice.category === "breathing" || practice.category === "meditation";
  const stepsCount = practice.steps.length;
  const currentStep = practice.steps[stepIdx];

  // Web Speech — voix locale, pas de réseau (P3).
  const speak = (text: string) => {
    if (audioMode !== "voice") return;
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = speechLocale;
      utter.rate = 0.9;
      utter.pitch = 1;
      utter.volume = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {
      // pas critique
    }
  };

  // Démarre la session.
  const start = () => {
    setStatus("running");
    startedAtRef.current = Date.now();
    haptic("success", prefs.haptics);
    if (currentStep) speak(currentStep.text_fr);
    // Audio binaural si demandé + autorisé.
    if (audioMode === "binaural" && prefs.binaural) {
      const presetId: BinauralPreset = PRESET_BY_CATEGORY[practice.category] ?? "alpha";
      try {
        stopBinauralRef.current = startBinaural(getPreset(presetId), { volume: 0.06 });
      } catch {
        // autoplay refus, on ignore
      }
    }
  };

  const pause = () => {
    setStatus("paused");
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    haptic("warning", prefs.haptics);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
  };

  const resume = () => {
    setStatus("running");
    haptic("light", prefs.haptics);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
  };

  // Tick.
  useEffect(() => {
    if (status !== "running") return;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // Avance d'étape ou fin.
          setStepIdx((idx) => {
            const nextIdx = idx + 1;
            if (nextIdx < stepsCount) {
              const next = practice.steps[nextIdx];
              if (next) speak(next.text_fr);
              haptic("selection", prefs.haptics);
              return nextIdx;
            }
            // Fin.
            if (tickRef.current) clearInterval(tickRef.current);
            tickRef.current = null;
            setStatus("post");
            return idx;
          });
          // Reset secondsLeft pour prochaine étape — proportionnel.
          const remainingSteps = stepsCount - (stepIdx + 1);
          if (remainingSteps > 0) {
            return Math.max(10, Math.floor(practice.durationSeconds / stepsCount));
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, stepIdx]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (stopBinauralRef.current) stopBinauralRef.current.stop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const skipToEnd = () => {
    setStatus("post");
    setSecondsLeft(0);
    if (tickRef.current) clearInterval(tickRef.current);
  };

  const submitComplete = (pulse?: { stress: number; energy: number; mood: number }) => {
    setSubmitError(null);
    const elapsed = startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current) / 1000)
      : practice.durationSeconds;

    startTransition(async () => {
      try {
        const res = await fetch("/api/practices/complete-session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId,
            durationSeconds: Math.min(elapsed, 1800),
            postState: pulse ?? null,
            completesRoutine: isLastInRoutine,
          }),
        });
        const data = (await res.json()) as {
          newBalance?: number;
          earnedThisSession?: number;
          error?: string;
        };
        if (!res.ok) {
          setSubmitError(data.error ?? "Validation impossible.");
          return;
        }
        if (stopBinauralRef.current) stopBinauralRef.current.stop();
        setCompleted({
          earned: data.earnedThisSession ?? 0,
          balance: data.newBalance ?? 0,
        });
        haptic("success", prefs.haptics);
      } catch {
        setSubmitError("Connexion perdue, réessaie.");
      }
    });
  };

  const goNext = () => {
    if (isLastInRoutine || !routineId) {
      router.push("/home");
    } else {
      router.push(`/routine/start?routineId=${routineId}`);
    }
    router.refresh();
  };

  const totalElapsedPct = Math.max(
    0,
    Math.min(100, ((practice.durationSeconds - secondsLeft) / practice.durationSeconds) * 100),
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0A0A0F]/95 backdrop-blur-2xl">
      {/* Header minimal */}
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Link
          href="/home"
          aria-label="Quitter la session"
          className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-white/10 hover:bg-white/[0.05] wellness-anim"
        >
          <X className="w-4 h-4" strokeWidth={1.7} />
        </Link>
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{spec.labelFr}</p>
          <p className="font-display text-base text-white/95">{practice.title}</p>
        </div>
        <div className="w-10" />
      </header>

      {/* Progress bar globale */}
      <div className="px-6">
        <div className="h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-[var(--color-kaia-accent)] wellness-anim"
            style={{ width: `${totalElapsedPct}%` }}
          />
        </div>
      </div>

      {/* Body */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
        {status === "intro" && (
          <div className="text-center space-y-6 max-w-md">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10"
              style={{ background: `${spec.accent}22`, color: spec.accent }}
              aria-hidden
            >
              <span className="font-display text-xl">{spec.labelFr.charAt(0)}</span>
            </span>
            <h1 className="font-display text-2xl sm:text-3xl text-white/95 tracking-tight">
              {practice.title}
            </h1>
            <p className="text-white/65">
              {Math.round(practice.durationSeconds / 60) >= 1
                ? `${Math.round(practice.durationSeconds / 60)} minutes`
                : `${practice.durationSeconds} secondes`}{" "}
              · {practice.steps.length} étapes
            </p>
            <HapticButton
              onClick={start}
              variant="primary"
              size="lg"
              hapticIntensity="success"
            >
              <Play className="w-4 h-4" strokeWidth={1.7} />
              Commencer
            </HapticButton>
          </div>
        )}

        {(status === "running" || status === "paused") && (
          <div className="w-full max-w-lg space-y-8 text-center">
            {useBreathing ? (
              <div className="flex justify-center">
                <BreathingCircle
                  defaultPattern="478"
                  cycles={Math.max(2, Math.round(practice.durationSeconds / 19))}
                  onComplete={() => setStatus("post")}
                />
              </div>
            ) : (
              <PulseCircle accent={spec.accent} running={status === "running"} />
            )}

            {currentStep && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Étape {stepIdx + 1} / {stepsCount}
                </p>
                <p className="font-display text-2xl text-white/95 leading-relaxed">
                  {currentStep.text_fr}
                </p>
              </div>
            )}

            {!useBreathing && (
              <p className="font-display text-4xl tabular-nums text-white/90">
                {Math.max(0, secondsLeft)}s
              </p>
            )}

            <div className="flex items-center justify-center gap-2">
              {status === "running" ? (
                <HapticButton
                  onClick={pause}
                  variant="ghost"
                  size="md"
                  hapticIntensity="warning"
                >
                  <Pause className="w-4 h-4" strokeWidth={1.7} />
                  Pause
                </HapticButton>
              ) : (
                <HapticButton
                  onClick={resume}
                  variant="primary"
                  size="md"
                  hapticIntensity="success"
                >
                  <Play className="w-4 h-4" strokeWidth={1.7} />
                  Reprendre
                </HapticButton>
              )}
              <HapticButton
                onClick={skipToEnd}
                variant="ghost"
                size="md"
                hapticIntensity="selection"
              >
                <SkipForward className="w-4 h-4" strokeWidth={1.7} />
                Terminer
              </HapticButton>
            </div>
          </div>
        )}

        {status === "post" && !completed && (
          <div className="w-full max-w-md space-y-6 text-center">
            <Sparkles
              className="w-10 h-10 mx-auto text-[var(--color-kaia-gold)]"
              strokeWidth={1.5}
              aria-hidden
            />
            <h2 className="font-display text-2xl text-white/95">Comment tu te sens, là ?</h2>
            <p className="text-sm text-white/55">Tape une fois — c'est fait.</p>

            <PostPulse
              values={postPulse}
              onChange={setPostPulse}
              disabled={isPending}
            />

            <div className="flex items-center justify-center gap-2 pt-2">
              <HapticButton
                onClick={() => {
                  const all =
                    postPulse.stress !== null &&
                    postPulse.energy !== null &&
                    postPulse.mood !== null;
                  submitComplete(
                    all
                      ? {
                          stress: postPulse.stress!,
                          energy: postPulse.energy!,
                          mood: postPulse.mood!,
                        }
                      : undefined,
                  );
                }}
                variant="primary"
                size="lg"
                hapticIntensity="success"
                disabled={isPending}
              >
                {isPending ? "Validation…" : "Valider et continuer"}
              </HapticButton>
              <HapticButton
                onClick={() => submitComplete(undefined)}
                variant="ghost"
                size="md"
                hapticIntensity="selection"
                disabled={isPending}
              >
                Passer
              </HapticButton>
            </div>

            {submitError && (
              <p className="text-sm text-[var(--color-kaia-terracotta)]" role="alert">
                {submitError}
              </p>
            )}
          </div>
        )}

        {status === "post" && completed && (
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[var(--color-kaia-accent)]/15 text-[var(--color-kaia-accent)] mx-auto">
              <Sparkles className="w-7 h-7" strokeWidth={1.5} aria-hidden />
            </div>
            <h2 className="font-display text-3xl text-white/95">Bravo.</h2>
            <p className="text-white/65">
              {completed.earned > 0
                ? `+${completed.earned} tokens crédités. Solde : ${completed.balance}.`
                : "Tu as déjà atteint ton plafond du jour — la séance est bien comptée."}
            </p>
            <HapticButton
              onClick={goNext}
              variant="primary"
              size="lg"
              hapticIntensity="success"
            >
              {isLastInRoutine || !routineId ? "Retour à l'accueil" : "Pratique suivante"}
            </HapticButton>
          </div>
        )}
      </main>

      {/* SOS flottant */}
      <Link
        href="/sos"
        aria-label="Besoin d'écoute — SOS"
        className="fixed bottom-6 left-6 z-[60] inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl px-3 py-2 hover:bg-white/[0.08] wellness-anim"
      >
        <AlertCircle
          className="w-4 h-4 text-[var(--color-kaia-terracotta)]"
          strokeWidth={1.7}
          aria-hidden
        />
        <span className="text-xs font-medium text-white/85">SOS</span>
      </Link>
    </div>
  );
}

function PulseCircle({ accent, running }: { accent: string; running: boolean }) {
  return (
    <div className="relative h-56 w-56 mx-auto grid place-items-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(closest-side, ${accent}26 0%, transparent 70%)` }}
      />
      <div
        className={cn(
          "h-32 w-32 rounded-full transition-transform duration-[3500ms] ease-[cubic-bezier(0.45,0,0.55,1)]",
          running ? "scale-100" : "scale-90",
        )}
        style={{
          background: `radial-gradient(closest-side, ${accent}AA 0%, ${accent}33 60%, transparent 100%)`,
          boxShadow: `0 0 60px ${accent}55`,
        }}
        aria-hidden
      />
    </div>
  );
}

interface PostPulseProps {
  values: { stress: number | null; energy: number | null; mood: number | null };
  onChange: (next: { stress: number | null; energy: number | null; mood: number | null }) => void;
  disabled?: boolean;
}

function PostPulse({ values, onChange, disabled }: PostPulseProps) {
  const rows: Array<{
    key: "stress" | "energy" | "mood";
    label: string;
    options: Array<{ value: number; emoji: string; label: string }>;
  }> = [
    {
      key: "stress",
      label: "Stress",
      options: [
        { value: 1, emoji: "🌱", label: "Très calme" },
        { value: 2, emoji: "🌿", label: "Calme" },
        { value: 3, emoji: "🌾", label: "Neutre" },
        { value: 4, emoji: "🍃", label: "Tendu" },
        { value: 5, emoji: "🌪️", label: "Agité" },
      ],
    },
    {
      key: "energy",
      label: "Énergie",
      options: [
        { value: 1, emoji: "🌙", label: "Vide" },
        { value: 2, emoji: "☁️", label: "Faible" },
        { value: 3, emoji: "⛅", label: "Moyen" },
        { value: 4, emoji: "☀️", label: "Bonne" },
        { value: 5, emoji: "✨", label: "Pleine" },
      ],
    },
    {
      key: "mood",
      label: "Humeur",
      options: [
        { value: 1, emoji: "🩶", label: "Difficile" },
        { value: 2, emoji: "🤍", label: "Sombre" },
        { value: 3, emoji: "💛", label: "Posé" },
        { value: 4, emoji: "💚", label: "Bien" },
        { value: 5, emoji: "💖", label: "Lumineux" },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.key} className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45 text-left">
            {row.label}
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {row.options.map((opt) => {
              const active = values[row.key] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...values, [row.key]: opt.value })}
                  aria-pressed={active}
                  aria-label={`${row.label} : ${opt.label}`}
                  className={cn(
                    "h-12 rounded-2xl border wellness-anim flex items-center justify-center",
                    active
                      ? "border-[var(--color-kaia-accent)] bg-[var(--color-kaia-accent)]/10 scale-[1.05]"
                      : "border-white/10 hover:border-white/25",
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {opt.emoji}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
