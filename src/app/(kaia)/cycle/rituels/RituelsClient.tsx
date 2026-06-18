"use client";

import { useState } from "react";
import { getRitualsForPhase } from "@/lib/cycle/ritual-recommendations";
import HormoneBreathing from "@/components/cycle/HormoneBreathing";
import BackButton from "@/components/ui/BackButton";
import { PHASE_LABEL, PHASES } from "@/lib/cycle/phase-labels";
import type { CyclePhase } from "@/lib/cycle/phases";

export default function RituelsClient({ currentPhase }: { currentPhase: CyclePhase }) {
  const [phase, setPhase] = useState<CyclePhase>(currentPhase);
  const rituals = getRitualsForPhase(phase);

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28">
      <BackButton href="/cycle" />

      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">
          Rituels Cycliques
        </h1>
        <p className="text-[var(--foreground-muted)] text-sm">
          Des gestes sacrés adaptés à chaque phase de ton cycle
        </p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {PHASES.map((p) => (
          <button
            key={p}
            onClick={() => setPhase(p)}
            className={[
              "px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              phase === p
                ? "bg-[var(--kaia-moon)]/20 text-[var(--kaia-moon)]"
                : "bg-[var(--kaia-soft)] text-[var(--foreground-muted)]",
            ].join(" ")}
          >
            {PHASE_LABEL[p]}
            {p === currentPhase && " ·"}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        {rituals.map((r) => (
          <div key={r.slug} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{r.emoji}</span>
              <h2 className="font-medium">{r.title}</h2>
              <span className="ml-auto text-xs text-[var(--foreground-muted)]">{r.durationMin} min</span>
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">{r.description}</p>
          </div>
        ))}
      </div>

      <HormoneBreathing phase={phase} />
    </div>
  );
}
