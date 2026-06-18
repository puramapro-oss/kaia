"use client";

import { PhaseInfo } from "@/lib/cycle/phases";

interface PhaseCardProps {
  phase: PhaseInfo;
}

export default function PhaseCard({ phase }: PhaseCardProps) {
  const progressPercent = (phase.dayInPhase / (phase.dayInPhase + phase.daysUntilNext)) * 100;

  return (
    <div
      className="bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-6 space-y-4"
      style={{ borderColor: `${phase.color}40` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{phase.emoji}</span>
            <div>
              <h3 className="text-xl font-cormorant font-semibold text-kaia-moon">
                {phase.label}
              </h3>
              <p className="text-sm text-white/60">
                Jour {phase.dayInPhase} · {formatDaysUntil(phase.daysUntilNext)}
              </p>
            </div>
          </div>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: phase.bgColor,
            color: phase.color,
          }}
        >
          Énergie {phase.energy}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: phase.color,
            }}
          />
        </div>
        <p className="text-xs text-white/50">
          Progression dans la phase {phase.label.toLowerCase()}
        </p>
      </div>

      {/* Description */}
      <p className="text-white/80 leading-relaxed">{phase.description}</p>

      {/* Recommendations */}
      <div className="space-y-2 pt-2">
        <h4 className="text-sm font-medium text-kaia-moon">Recommandations</h4>
        <ul className="space-y-1.5">
          {phase.recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
              <span className="text-kaia-gold mt-0.5">·</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function formatDaysUntil(days: number): string {
  if (days === 0) return "Dernière phase aujourd'hui";
  if (days === 1) return "Prochaine phase demain";
  return `Dans ${days} jours`;
}
