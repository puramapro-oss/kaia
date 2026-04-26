"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { OnboardingCinematic } from "@/components/multisensorial/OnboardingCinematic";
import { BreathingCircle } from "@/components/multisensorial/BreathingCircle";
import { HapticButton } from "@/components/multisensorial/HapticButton";
import { useOnboardingStore, STEP_ORDER, type AudioMode } from "./onboardingStore";
import { completeOnboarding } from "@/app/onboarding/actions";
import { ROUTINE_GOALS, GOAL_EMOJI, GOAL_LABELS_FR } from "@/lib/practices/categories";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TIME_OPTIONS = [1, 3, 5, 10, 15, 30] as const;

const LOCALE_LABEL: Record<SupportedLocale, { name: string; native: string }> = {
  fr: { name: "Français", native: "Français" },
  en: { name: "English", native: "English" },
  es: { name: "Español", native: "Español" },
  ar: { name: "Arabic", native: "العربية" },
  zh: { name: "Chinese", native: "中文" },
};

const AUDIO_MODES: Array<{ id: AudioMode; label: string; sub: string }> = [
  { id: "silence", label: "Silence", sub: "Aucun son d'ambiance." },
  { id: "nature", label: "Sons nature", sub: "Forêt, océan, vent — selon la pratique." },
  { id: "binaural", label: "Binauraux", sub: "Fréquences subtiles — bien-être profond." },
  { id: "voice", label: "Voix guidée", sub: "Voix qui accompagne chaque étape." },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const step = useOnboardingStore((s) => s.step);
  const locale = useOnboardingStore((s) => s.locale);
  const goal = useOnboardingStore((s) => s.goal);
  const dailyTimeMinutes = useOnboardingStore((s) => s.dailyTimeMinutes);
  const audioMode = useOnboardingStore((s) => s.audioMode);
  const highContrast = useOnboardingStore((s) => s.highContrast);
  const dyslexiaFont = useOnboardingStore((s) => s.dyslexiaFont);
  const reducedMotion = useOnboardingStore((s) => s.reducedMotion);
  const firstRoutineDone = useOnboardingStore((s) => s.firstRoutineDone);

  const next = useOnboardingStore((s) => s.next);
  const setLocale = useOnboardingStore((s) => s.setLocale);
  const setGoal = useOnboardingStore((s) => s.setGoal);
  const setDailyTime = useOnboardingStore((s) => s.setDailyTime);
  const setAudioMode = useOnboardingStore((s) => s.setAudioMode);
  const setHighContrast = useOnboardingStore((s) => s.setHighContrast);
  const setDyslexiaFont = useOnboardingStore((s) => s.setDyslexiaFont);
  const setReducedMotion = useOnboardingStore((s) => s.setReducedMotion);
  const setFirstRoutineDone = useOnboardingStore((s) => s.setFirstRoutineDone);

  const stepIdx = STEP_ORDER.indexOf(step);
  const visibleStepIdx = stepIdx; // cinematic counts as 0
  const progress = (visibleStepIdx / (STEP_ORDER.length - 1)) * 100;

  function handleFinish() {
    if (!goal) {
      setSubmitError("Choisis un objectif pour avancer.");
      return;
    }
    setSubmitError(null);
    startTransition(async () => {
      const res = await completeOnboarding({
        locale,
        goal,
        dailyTimeMinutes,
        audioMode,
        multisensorial: {
          background_video: true,
          haptics: true,
          binaural: audioMode === "binaural",
          cinematic: true,
        },
        accessibility: {
          high_contrast: highContrast,
          dyslexia_font: dyslexiaFont,
          reduced_motion: reducedMotion,
        },
      });
      if (!res.ok) {
        setSubmitError(res.error ?? "Quelque chose a coincé. Réessaie.");
        return;
      }
      router.push("/home");
      router.refresh();
    });
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {step !== "cinematic" && (
        <div className="px-6 pt-6">
          <div className="mx-auto max-w-xl h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[var(--color-kaia-accent)] transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl">
          {step === "cinematic" && <OnboardingCinematic onFinish={next} />}

          {step === "welcome" && (
            <StepShell
              eyebrow="Bienvenue"
              title="Tu peux être exactement comme tu es."
              subtitle="C'est déjà suffisant."
            >
              <p className="text-white/65 leading-relaxed">
                KAÏA, c'est une routine douce, courte, qui s'adapte à toi — pas l'inverse. On
                construit ton premier rituel ensemble en moins de 90 secondes.
              </p>
              <NextButton onClick={next} label="Allons-y" />
            </StepShell>
          )}

          {step === "language" && (
            <StepShell eyebrow="Langue" title="Tu préfères dans quelle langue ?">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUPPORTED_LOCALES.map((l) => {
                  const meta = LOCALE_LABEL[l];
                  const active = locale === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLocale(l)}
                      className={cn(
                        "rounded-2xl border p-4 text-left wellness-anim",
                        active
                          ? "border-white/30 bg-white/[0.06]"
                          : "border-white/10 hover:border-white/20",
                      )}
                      aria-pressed={active}
                    >
                      <div className="text-sm text-white/55">{meta.name}</div>
                      <div className="text-lg font-display text-white/95">{meta.native}</div>
                    </button>
                  );
                })}
              </div>
              <NextButton onClick={next} />
            </StepShell>
          )}

          {step === "goal" && (
            <StepShell eyebrow="Objectif" title="Que veux-tu améliorer en priorité ?">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ROUTINE_GOALS.map((g) => {
                  const active = goal === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGoal(g)}
                      className={cn(
                        "rounded-2xl border p-4 wellness-anim text-center",
                        active
                          ? "border-[var(--color-kaia-accent)] bg-white/[0.06]"
                          : "border-white/10 hover:border-white/20",
                      )}
                      aria-pressed={active}
                    >
                      <div className="text-3xl mb-2">{GOAL_EMOJI[g]}</div>
                      <div className="text-sm font-display text-white/95">{GOAL_LABELS_FR[g]}</div>
                    </button>
                  );
                })}
              </div>
              <NextButton onClick={next} disabled={!goal} />
            </StepShell>
          )}

          {step === "time" && (
            <StepShell eyebrow="Temps" title="Combien de minutes par jour ?">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {TIME_OPTIONS.map((t) => {
                  const active = dailyTimeMinutes === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDailyTime(t)}
                      className={cn(
                        "rounded-xl border h-14 wellness-anim font-display text-lg tabular-nums",
                        active
                          ? "border-[var(--color-kaia-accent)] bg-white/[0.06] text-white"
                          : "border-white/10 text-white/65 hover:text-white",
                      )}
                      aria-pressed={active}
                    >
                      {t} min
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-white/45">
                Tu pourras ajuster à tout moment dans le builder.
              </p>
              <NextButton onClick={next} />
            </StepShell>
          )}

          {step === "audio" && (
            <StepShell eyebrow="Ambiance" title="Comment tu préfères pratiquer ?">
              <div className="space-y-2">
                {AUDIO_MODES.map((m) => {
                  const active = audioMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAudioMode(m.id)}
                      className={cn(
                        "w-full rounded-2xl border p-4 text-left wellness-anim flex items-center gap-3",
                        active
                          ? "border-[var(--color-kaia-accent)] bg-white/[0.06]"
                          : "border-white/10 hover:border-white/20",
                      )}
                      aria-pressed={active}
                    >
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full border-2 wellness-anim shrink-0",
                          active
                            ? "border-[var(--color-kaia-accent)] bg-[var(--color-kaia-accent)]"
                            : "border-white/30",
                        )}
                      />
                      <div>
                        <div className="font-display text-base text-white/95">{m.label}</div>
                        <div className="text-sm text-white/55">{m.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <NextButton onClick={next} />
            </StepShell>
          )}

          {step === "accessibility" && (
            <StepShell
              eyebrow="Accessibilité"
              title="Quelques options"
              subtitle="Tu peux tout changer plus tard. Ou passer cette étape."
            >
              <div className="space-y-2">
                <ToggleRow
                  label="Contraste élevé"
                  description="Couleurs plus marquées, meilleure lisibilité."
                  checked={highContrast}
                  onChange={setHighContrast}
                />
                <ToggleRow
                  label="Police adaptée dyslexie"
                  description="OpenDyslexic — réduit les lettres miroir."
                  checked={dyslexiaFont}
                  onChange={setDyslexiaFont}
                />
                <ToggleRow
                  label="Réduire les animations"
                  description="Moins de mouvement à l'écran."
                  checked={reducedMotion}
                  onChange={setReducedMotion}
                />
              </div>
              <NextButton onClick={next} label="Continuer" />
            </StepShell>
          )}

          {step === "first-routine" && (
            <StepShell
              eyebrow="Première routine — offerte"
              title="60 secondes, juste pour toi."
              subtitle="Pas de paywall. Pas de notif. Juste une respiration."
            >
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <BreathingCircle
                  defaultPattern="478"
                  cycles={3}
                  onComplete={() => setFirstRoutineDone(true)}
                />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mt-4">
                <p className="text-sm text-white/55 mb-2">Affirmation d'arrivée</p>
                <p className="font-display text-lg text-white/95 leading-relaxed">
                  &laquo;&nbsp;Je suis là. C'est suffisant.&nbsp;&raquo;
                </p>
              </div>
              <NextButton
                onClick={next}
                label={firstRoutineDone ? "Continuer" : "Passer cette étape"}
              />
            </StepShell>
          )}

          {step === "paywall" && (
            <StepShell
              eyebrow="14 jours offerts"
              title="Tu as adoré ?"
              subtitle="Continue avec 14 jours gratuits, puis 14,99 € / mois — annulable à tout moment."
            >
              <ul className="space-y-2 text-white/70 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-[var(--color-kaia-accent)] shrink-0" />
                  <span>Catalogue complet de 80+ pratiques</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-[var(--color-kaia-accent)] shrink-0" />
                  <span>Routines IA personnalisées chaque jour</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-[var(--color-kaia-accent)] shrink-0" />
                  <span>Tokens, rituels collectifs, contests</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-[var(--color-kaia-accent)] shrink-0" />
                  <span>Aucune donnée santé stockée</span>
                </li>
              </ul>

              <div className="flex flex-col gap-2 pt-2">
                <HapticButton
                  onClick={() => {
                    handleFinish();
                  }}
                  variant="primary"
                  size="lg"
                  hapticIntensity="success"
                  disabled={isPending}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4" strokeWidth={1.7} />
                  {isPending ? "Sauvegarde…" : "Démarrer mes 14 jours"}
                </HapticButton>
                <HapticButton
                  onClick={() => {
                    handleFinish();
                  }}
                  variant="ghost"
                  size="md"
                  hapticIntensity="selection"
                  disabled={isPending}
                  className="w-full"
                >
                  Continuer pour le moment
                </HapticButton>
              </div>

              {submitError && (
                <p className="text-sm text-[var(--color-kaia-terracotta)] mt-2" role="alert">
                  {submitError}
                </p>
              )}
            </StepShell>
          )}
        </div>
      </div>
    </div>
  );
}

interface StepShellProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function StepShell({ eyebrow, title, subtitle, children }: StepShellProps) {
  return (
    <div className="space-y-5">
      <div className="text-xs uppercase tracking-[0.2em] text-white/45">{eyebrow}</div>
      <h1 className="font-display text-3xl sm:text-4xl text-white/95 leading-tight">{title}</h1>
      {subtitle && <p className="text-white/55">{subtitle}</p>}
      <div className="space-y-4 pt-2">{children}</div>
    </div>
  );
}

function NextButton({
  onClick,
  label = "Continuer",
  disabled,
}: {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <HapticButton
      onClick={onClick}
      variant="primary"
      size="md"
      hapticIntensity="selection"
      disabled={disabled}
      className="w-full sm:w-auto mt-2"
    >
      {label}
      <ArrowRight className="w-4 h-4 ml-1" strokeWidth={1.7} />
    </HapticButton>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full rounded-2xl border p-4 text-left wellness-anim flex items-center gap-3",
        checked ? "border-white/25 bg-white/[0.05]" : "border-white/10",
      )}
      aria-pressed={checked}
    >
      <div className="flex-1">
        <div className="font-display text-base text-white/95">{label}</div>
        <div className="text-sm text-white/55">{description}</div>
      </div>
      <div
        className={cn(
          "h-6 w-11 rounded-full p-0.5 wellness-anim",
          checked ? "bg-[var(--color-kaia-accent)]" : "bg-white/15",
        )}
      >
        <div
          className={cn(
            "h-5 w-5 rounded-full bg-white wellness-anim",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </div>
    </button>
  );
}
