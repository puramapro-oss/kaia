"use client";

import { useState, useEffect } from "react";

interface SoulagementImmediatProps {
  onComplete: () => void;
}

export default function SoulagementImmediat({ onComplete }: SoulagementImmediatProps) {
  const [currentRound, setCurrentRound] = useState(1);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const totalRounds = 3;
  const rhythm = { inhale: 4, hold: 7, exhale: 8 };
  const totalCycle = rhythm.inhale + rhythm.hold + rhythm.exhale;

  useEffect(() => {
    if (showFeedback) return;

    const interval = setInterval(() => {
      setPhaseProgress((prev) => {
        const next = prev + 0.1;
        if (next >= totalCycle) {
          if (currentRound < totalRounds) {
            setCurrentRound((r) => r + 1);
          } else {
            setShowFeedback(true);
          }
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentRound, totalRounds, totalCycle, showFeedback]);

  const breathPhase = (() => {
    const p = phaseProgress;
    if (p < rhythm.inhale) return "inhale";
    if (p < rhythm.inhale + rhythm.hold) return "hold";
    return "exhale";
  })() as "inhale" | "hold" | "exhale";

  const getCircleScale = () => {
    const p = phaseProgress;
    if (p < rhythm.inhale) {
      return 0.7 + (p / rhythm.inhale) * 0.5; // 0.7 → 1.2
    } else if (p < rhythm.inhale + rhythm.hold) {
      return 1.2;
    } else {
      const exhaleProgress = (p - rhythm.inhale - rhythm.hold) / rhythm.exhale;
      return 1.2 - exhaleProgress * 0.5; // 1.2 → 0.7
    }
  };

  const breathLabel = {
    inhale: "Inspire (4s)",
    hold: "Retiens (7s)",
    exhale: "Expire (8s)",
  };

  if (showFeedback) {
    return (
      <div className="fixed inset-0 z-50 bg-kaia-primary flex items-center justify-center px-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-8 max-w-md space-y-6 text-center">
          <div className="text-5xl">✨</div>
          <h2 className="text-2xl font-cormorant font-semibold text-kaia-moon">
            Comment tu te sens maintenant ?
          </h2>

          <div className="space-y-3">
            <button
              onClick={onComplete}
              className="w-full px-6 py-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20 transition-all"
            >
              Mieux, je me sens apaisée
            </button>
            <button
              onClick={onComplete}
              className="w-full px-6 py-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-all"
            >
              Pareil, mais plus calme
            </button>
            <button
              onClick={() => {
                setCurrentRound(1);
                setPhaseProgress(0);
                setShowFeedback(false);
              }}
              className="w-full px-6 py-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 transition-all"
            >
              Encore difficile, refaire un cycle
            </button>
          </div>

          <p className="text-white/50 text-xs">
            Si la situation persiste, n'hésite pas à contacter le <strong>3114</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-kaia-primary flex flex-col items-center justify-center px-4 space-y-12">
      {/* Close button */}
      <button
        onClick={onComplete}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center transition-all"
      >
        ✕
      </button>

      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-cormorant font-semibold text-kaia-rose">
          Soulagement Immédiat
        </h2>
        <p className="text-white/70">
          Respiration 4-7-8 · Cycle {currentRound}/{totalRounds}
        </p>
      </div>

      {/* Breathing circle */}
      <div className="relative flex items-center justify-center">
        <div
          className="w-72 h-72 rounded-full flex items-center justify-center transition-transform duration-[2000ms] ease-in-out"
          style={{
            transform: `scale(${getCircleScale()})`,
            background: `radial-gradient(circle, rgba(240,176,192,0.3), rgba(240,176,192,0.1))`,
            boxShadow: `0 0 60px rgba(240,176,192,0.4)`,
          }}
        >
          <span className="text-2xl font-cormorant font-semibold text-white">
            {breathLabel[breathPhase]}
          </span>
        </div>
      </div>

      {/* Instruction */}
      <p className="text-white/60 text-center max-w-sm">
        Suis le rythme du cercle. Laisse ton corps se détendre progressivement.
      </p>

      {/* Round indicators */}
      <div className="flex gap-3">
        {Array.from({ length: totalRounds }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < currentRound ? "bg-kaia-rose" : "bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
