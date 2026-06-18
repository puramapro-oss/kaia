"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { getEmotionsForPhase } from "@/lib/cycle/emotions";
import { PHASE_LABEL, PHASES } from "@/lib/cycle/phase-labels";
import { cn } from "@/lib/utils";
import type { CyclePhase } from "@/lib/cycle/phases";

export default function EmotionGuide({ currentPhase }: { currentPhase: CyclePhase }) {
  const [phase, setPhase] = useState<CyclePhase>(currentPhase);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const emotions = getEmotionsForPhase(phase);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-[var(--kaia-moon)]" />
        <h2 className="font-display text-xl font-semibold">Roue des émotions</h2>
      </div>
      <p className="text-sm text-[var(--foreground-muted)]">
        Les émotions varient avec ton cycle. Les accueillir, c'est mieux les comprendre.
      </p>

      <div className="flex gap-2 overflow-x-auto">
        {PHASES.map((p) => (
          <button
            key={p}
            onClick={() => {
              setPhase(p);
              setOpenIndex(null);
            }}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              phase === p
                ? "bg-[var(--kaia-moon)]/20 text-[var(--kaia-moon)]"
                : "bg-[var(--kaia-soft)] text-[var(--foreground-muted)]"
            )}
          >
            {PHASE_LABEL[p]}
            {p === currentPhase && " ·"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {emotions.map((e, i) => {
          const open = openIndex === i;
          return (
            <button
              key={e.emotion}
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="w-full text-left glass rounded-2xl p-5 transition-colors hover:bg-white/[0.07]"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{e.emoji}</span>
                <h3 className="font-medium">{e.emotion}</h3>
                <span className="ml-auto text-[var(--foreground-muted)] text-sm">{open ? "−" : "+"}</span>
              </div>
              {open && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-[var(--foreground-muted)]">{e.context}</p>
                  <p className="text-sm text-[var(--kaia-moon)]">{e.welcome}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
