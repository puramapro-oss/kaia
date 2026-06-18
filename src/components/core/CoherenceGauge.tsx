"use client";

import { coherenceTier } from "@/lib/core/coherence";

const TIER_LABEL: Record<string, string> = {
  naissante: "Cohérence naissante",
  montante: "Cohérence montante",
  rayonnante: "Cohérence rayonnante",
  unifiée: "Cohérence unifiée",
};

/**
 * Jauge circulaire de Cohérence Collective (0-100). Pur affichage : le score
 * est calculé côté serveur via `computeCoherence`.
 */
export default function CoherenceGauge({
  score,
  syncedCount,
  totalCount,
}: {
  score: number;
  syncedCount?: number;
  totalCount?: number;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);
  const tier = coherenceTier(clamped);

  return (
    <div className="glass rounded-2xl p-6 flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(200,185,240,0.12)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="url(#coherence-grad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
          <defs>
            <linearGradient id="coherence-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--kaia-moon)" />
              <stop offset="100%" stopColor="var(--kaia-gold)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-semibold gradient-kaia-text">{clamped}</span>
          <span className="text-[10px] text-[var(--foreground-muted)]">/ 100</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-[var(--kaia-moon)]">{TIER_LABEL[tier]}</p>
      {typeof syncedCount === "number" && typeof totalCount === "number" && (
        <p className="text-xs text-[var(--foreground-muted)] mt-1">
          {syncedCount} / {totalCount} synchronisées
        </p>
      )}
    </div>
  );
}
