"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/multisensorial/haptics";
import { useMultisensorialPrefs } from "@/hooks/useMultisensorialPrefs";

export interface PulseValues {
  stress: number | null;
  energy: number | null;
  mood: number | null;
}

interface PulseCheckProps {
  initial: PulseValues;
  saveAction: (values: { stress: number; energy: number; mood: number }) => Promise<{ ok: boolean }>;
  /** Petit callback côté UI quand le triplet est complet (utile pour CTA). */
  onComplete?: (values: { stress: number; energy: number; mood: number }) => void;
}

const STRESS_EMOJIS: Array<{ value: number; emoji: string; label: string }> = [
  { value: 1, emoji: "🌱", label: "Très calme" },
  { value: 2, emoji: "🌿", label: "Calme" },
  { value: 3, emoji: "🌾", label: "Neutre" },
  { value: 4, emoji: "🍃", label: "Tendu·e" },
  { value: 5, emoji: "🌪️", label: "Très tendu·e" },
];

const ENERGY_EMOJIS: Array<{ value: number; emoji: string; label: string }> = [
  { value: 1, emoji: "🌙", label: "Vidé·e" },
  { value: 2, emoji: "☁️", label: "Faible" },
  { value: 3, emoji: "⛅", label: "Moyenne" },
  { value: 4, emoji: "☀️", label: "Bonne" },
  { value: 5, emoji: "✨", label: "Pleine" },
];

const MOOD_EMOJIS: Array<{ value: number; emoji: string; label: string }> = [
  { value: 1, emoji: "🩶", label: "Difficile" },
  { value: 2, emoji: "🤍", label: "Sombre" },
  { value: 3, emoji: "💛", label: "Posé·e" },
  { value: 4, emoji: "💚", label: "Bien" },
  { value: 5, emoji: "💖", label: "Lumineux·se" },
];

export function PulseCheck({ initial, saveAction, onComplete }: PulseCheckProps) {
  const prefs = useMultisensorialPrefs();
  const [isPending, startTransition] = useTransition();

  const persist = (next: { stress: number | null; energy: number | null; mood: number | null }) => {
    if (next.stress === null || next.energy === null || next.mood === null) return;
    const payload = { stress: next.stress, energy: next.energy, mood: next.mood };
    startTransition(async () => {
      await saveAction(payload);
      onComplete?.(payload);
    });
  };

  const handlePick = (
    dim: "stress" | "energy" | "mood",
    value: number,
    current: PulseValues,
  ) => {
    haptic("selection", prefs.haptics);
    const next = { ...current, [dim]: value };
    persist(next);
  };

  return (
    <PulseClient initial={initial} onPick={handlePick} disabled={isPending} />
  );
}

interface PulseClientProps {
  initial: PulseValues;
  onPick: (dim: "stress" | "energy" | "mood", value: number, current: PulseValues) => void;
  disabled?: boolean;
}

function PulseClient({ initial, onPick, disabled }: PulseClientProps) {
  // Local mirror — l'optimistic update est instantané, le server action s'occupe de la persistance.
  return (
    <PulseInner initial={initial} onPick={onPick} disabled={disabled} />
  );
}

function PulseInner({ initial, onPick, disabled }: PulseClientProps) {
  const [values, setValues] = useLocalState(initial);

  const pick = (dim: "stress" | "energy" | "mood", value: number) => {
    if (disabled) return;
    setValues((prev) => {
      const next = { ...prev, [dim]: value };
      onPick(dim, value, next);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <Row
        label="Stress"
        helper="Comment tu sens ton corps ?"
        options={STRESS_EMOJIS}
        selected={values.stress}
        onPick={(v) => pick("stress", v)}
      />
      <Row
        label="Énergie"
        helper="Niveau intérieur, juste maintenant."
        options={ENERGY_EMOJIS}
        selected={values.energy}
        onPick={(v) => pick("energy", v)}
      />
      <Row
        label="Humeur"
        helper="Sans jugement — c'est ok."
        options={MOOD_EMOJIS}
        selected={values.mood}
        onPick={(v) => pick("mood", v)}
      />
    </div>
  );
}

interface RowProps {
  label: string;
  helper: string;
  options: Array<{ value: number; emoji: string; label: string }>;
  selected: number | null;
  onPick: (value: number) => void;
}

function Row({ label, helper, options, selected, onPick }: RowProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-white/55">{label}</p>
        <p className="text-xs text-white/40">{helper}</p>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {options.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPick(opt.value)}
              aria-label={`${label} : ${opt.label}`}
              aria-pressed={active}
              className={cn(
                "h-14 rounded-2xl border wellness-anim flex flex-col items-center justify-center gap-0.5",
                active
                  ? "border-[var(--color-kaia-accent)] bg-[var(--color-kaia-accent)]/10 scale-[1.03]"
                  : "border-white/10 hover:border-white/20",
              )}
            >
              <span className="text-2xl leading-none" aria-hidden>
                {opt.emoji}
              </span>
              <span className="text-[10px] text-white/45 line-clamp-1">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Petit hook pour state local mirror — évite re-render race avec l'initial server.
import { useState as useLocalStateBase } from "react";
function useLocalState(initial: PulseValues) {
  return useLocalStateBase<PulseValues>(initial);
}
