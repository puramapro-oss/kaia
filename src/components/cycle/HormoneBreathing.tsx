"use client";

import Link from "next/link";
import { Wind, ArrowRight } from "lucide-react";
import { BreathingCircle, type BreathPattern } from "@/components/multisensorial/BreathingCircle";
import type { CyclePhase } from "@/lib/cycle/phases";

/**
 * Respiration Hormonique — protocole de respiration adapté à la phase du cycle.
 * Réutilise `BreathingCircle` (478/box) pour les patterns supportés ; renvoie
 * vers AURORA (cohérence/calm) pour les phases qui demandent un guidage long.
 * Pédagogique, jamais médical.
 */
interface PhaseBreath {
  label: string;
  rhythm: string;
  pattern?: BreathPattern;
  auroraVariant?: "calm" | "focus";
  hint: string;
}

const PHASE_BREATH: Record<CyclePhase, PhaseBreath> = {
  menstruation: {
    label: "Respiration parasympathique",
    rhythm: "4 - 7 - 8",
    pattern: "478",
    hint: "Ralentir le système nerveux, inviter le repos profond.",
  },
  folliculaire: {
    label: "Cohérence cardiaque",
    rhythm: "5 - 5",
    auroraVariant: "focus",
    hint: "Réveiller l'élan créatif avec une respiration équilibrée.",
  },
  ovulation: {
    label: "Respiration énergisante (box)",
    rhythm: "4 - 4 - 4 - 4",
    pattern: "box",
    hint: "Soutenir le pic d'énergie et l'expression.",
  },
  luteale: {
    label: "Apaisement AURORA",
    rhythm: "Guidage Calm",
    auroraVariant: "calm",
    hint: "Ancrer et introspecter à l'approche du repli.",
  },
};

export default function HormoneBreathing({ phase }: { phase: CyclePhase }) {
  const spec = PHASE_BREATH[phase];

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Wind className="w-4 h-4 text-[var(--kaia-moon)]" />
        <h3 className="font-medium">{spec.label}</h3>
        <span className="ml-auto text-xs text-[var(--kaia-gold)] tabular-nums">{spec.rhythm}</span>
      </div>
      <p className="text-xs text-[var(--foreground-muted)] mb-4">{spec.hint}</p>

      {spec.pattern ? (
        <BreathingCircle defaultPattern={spec.pattern} cycles={4} />
      ) : (
        <Link
          href={`/aurora?variant=${spec.auroraVariant}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] text-sm font-medium"
        >
          Ouvrir AURORA
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
