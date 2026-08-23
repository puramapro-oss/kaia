"use client";

import Link from "next/link";
import { Play, Pause, SkipForward, X, AlertCircle, Sparkles } from "lucide-react";
import { BreathingCircle } from "@/components/multisensorial/BreathingCircle";
import { HapticButton } from "@/components/multisensorial/HapticButton";
import { useMultisensorialPrefs } from "@/hooks/useMultisensorialPrefs";
import { useSessionPlayerState } from "@/hooks/useSessionPlayerState";
import {
  PRACTICE_CATEGORIES,
  type PracticeCategory,
} from "@/lib/practices/categories";
import { PulseCircle, PostPulse } from "./SessionPlayerComponents";

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

export function SessionPlayer({
  sessionId,
  practice,
  routineId,
  audioMode,
  isLastInRoutine,
  speechLocale,
}: SessionPlayerProps) {
  const prefs = useMultisensorialPrefs();
  const {
    status,
    stepIdx,
    secondsLeft,
    postPulse,
    setPostPulse,
    submitError,
    completed,
    isPending,
    currentStep,
    stepsCount,
    totalElapsedPct,
    start,
    pause,
    resume,
    skipToEnd,
    submitComplete,
    goNext,
  } = useSessionPlayerState({
    practice,
    sessionId,
    audioMode,
    speechLocale,
    isLastInRoutine,
    routineId,
    hapticsEnabled: prefs.haptics,
    binauralEnabled: prefs.binaural,
  });

  const spec = PRACTICE_CATEGORIES[practice.category];
  const useBreathing = practice.category === "breathing" || practice.category === "meditation";
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
                  onComplete={skipToEnd}
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
