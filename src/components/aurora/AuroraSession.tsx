"use client";

import { useState } from "react";
import { AuroraProtocol } from "@/lib/aurora/protocols";
import BreathingGuide from "./BreathingGuide";

interface AuroraSessionProps {
  protocol: AuroraProtocol;
  onComplete: () => void;
}

export default function AuroraSession({ protocol, onComplete }: AuroraSessionProps) {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [showWarning, setShowWarning] = useState(protocol.epilepsyWarning);

  const currentPhase = protocol.phases[currentPhaseIndex];
  const isOmegaLock = currentPhase?.key === "omega_lock";

  function handlePhaseComplete() {
    if (currentPhaseIndex < protocol.phases.length - 1) {
      setCurrentPhaseIndex((prev) => prev + 1);
    } else {
      // Session complete
      saveSession();
      onComplete();
    }
  }

  function handleSkip() {
    if (isOmegaLock) return; // Cannot skip Omega Lock
    handlePhaseComplete();
  }

  async function saveSession() {
    try {
      await fetch("/api/aurora/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant: protocol.variant,
          phasesCompleted: protocol.phases.length,
          durationSec: protocol.phases.reduce((sum, p) => sum + p.durationSec, 0),
        }),
      });
    } catch (err) {
      console.error("Failed to save AURORA session:", err);
    }
  }

  if (showWarning) {
    return (
      <div className="fixed inset-0 z-50 bg-kaia-primary flex items-center justify-center px-4">
        <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-md space-y-6">
          <div className="text-center space-y-3">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-2xl font-cormorant font-semibold text-red-300">
              Avertissement Important
            </h2>
          </div>

          <div className="space-y-3 text-white/80 text-sm leading-relaxed">
            <p>
              Ce protocole <strong>Ignite</strong> utilise une respiration intense qui peut provoquer :
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>Vertiges ou étourdissements</li>
              <li>Fourmillements dans les extrémités</li>
              <li>Hyperventilation</li>
            </ul>
            <p className="text-red-300 font-medium">
              <strong>Ne pratique PAS ce protocole</strong> si tu as des antécédents d'épilepsie, de problèmes cardiaques,
              ou si tu es enceinte.
            </p>
            <p className="text-white/60 text-xs">
              En cas de malaise, arrête immédiatement et reprends une respiration normale.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onComplete()}
              className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-white/80 hover:bg-white/5 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={() => setShowWarning(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-kaia-rose to-red-400 text-white font-medium hover:shadow-lg transition-all"
            >
              Je comprends, continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-kaia-primary">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${((currentPhaseIndex + 1) / protocol.phases.length) * 100}%`,
            backgroundColor: currentPhase?.color,
          }}
        />
      </div>

      {/* Phase indicators */}
      <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 px-4">
        {protocol.phases.map((p, idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentPhaseIndex
                ? "w-12"
                : idx < currentPhaseIndex
                ? "w-8 opacity-50"
                : "w-6 opacity-20"
            }`}
            style={{ backgroundColor: p.color }}
          />
        ))}
      </div>

      {/* Close button (top right) */}
      <button
        onClick={onComplete}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center transition-all"
      >
        ✕
      </button>

      {/* Breathing guide */}
      {currentPhase && (
        <BreathingGuide phase={currentPhase} onComplete={handlePhaseComplete} />
      )}

      {/* Skip button (bottom, only if not Omega Lock) */}
      {!isOmegaLock && (
        <button
          onClick={handleSkip}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-white/5 border border-white/20 text-white/60 text-sm hover:bg-white/10 transition-all"
        >
          Passer cette phase →
        </button>
      )}
    </div>
  );
}
