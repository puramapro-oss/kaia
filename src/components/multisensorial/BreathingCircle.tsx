"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/multisensorial/haptics";
import { useMultisensorialPrefs } from "@/hooks/useMultisensorialPrefs";
import { HapticButton } from "./HapticButton";

export type BreathPattern = "478" | "444" | "box";

interface PhaseSpec {
  id: "inhale" | "hold-in" | "exhale" | "hold-out";
  labelFr: string;
  durationSec: number;
}

const PATTERNS: Record<BreathPattern, { name: string; description: string; phases: PhaseSpec[] }> = {
  "478": {
    name: "4·7·8",
    description: "Inspire 4s · retiens 7s · expire 8s. Apaise le système nerveux.",
    phases: [
      { id: "inhale", labelFr: "Inspire", durationSec: 4 },
      { id: "hold-in", labelFr: "Retiens", durationSec: 7 },
      { id: "exhale", labelFr: "Expire", durationSec: 8 },
    ],
  },
  "444": {
    name: "4·4·4",
    description: "Inspire 4s · retiens 4s · expire 4s. Cohérence cardiaque douce.",
    phases: [
      { id: "inhale", labelFr: "Inspire", durationSec: 4 },
      { id: "hold-in", labelFr: "Retiens", durationSec: 4 },
      { id: "exhale", labelFr: "Expire", durationSec: 4 },
    ],
  },
  box: {
    name: "Box · 4·4·4·4",
    description: "Carré de respiration : inspire · retiens · expire · pause. Concentration claire.",
    phases: [
      { id: "inhale", labelFr: "Inspire", durationSec: 4 },
      { id: "hold-in", labelFr: "Retiens", durationSec: 4 },
      { id: "exhale", labelFr: "Expire", durationSec: 4 },
      { id: "hold-out", labelFr: "Pause", durationSec: 4 },
    ],
  },
};

interface BreathingCircleProps {
  /** Pattern initial. */
  defaultPattern?: BreathPattern;
  /** Nombre de cycles à compléter avant onComplete. Default : 4. */
  cycles?: number;
  /** Callback fin de séance. */
  onComplete?: () => void;
  /** Callback à chaque changement de phase (pour binaural / nature sound). */
  onPhaseChange?: (phase: PhaseSpec["id"]) => void;
}

/**
 * Cercle de respiration animé. Inspire = scale-up, expire = scale-down,
 * hold = scale stable. Une vibration `selection` ponctue chaque transition
 * de phase (subtile, respecte le toggle haptics).
 */
export function BreathingCircle({
  defaultPattern = "478",
  cycles = 4,
  onComplete,
  onPhaseChange,
}: BreathingCircleProps) {
  const prefs = useMultisensorialPrefs();
  const [pattern, setPattern] = useState<BreathPattern>(defaultPattern);
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const spec = PATTERNS[pattern];
  const currentPhase = spec.phases[phaseIdx];

  const stop = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    setRunning(false);
  };

  const reset = () => {
    stop();
    setPhaseIdx(0);
    setCycleCount(0);
    setSecondsLeft(0);
  };

  // Cleanup au démontage.
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Démarre le timer quand running passe à true.
  useEffect(() => {
    if (!running) return;
    setSecondsLeft(currentPhase.durationSec);
    onPhaseChange?.(currentPhase.id);
    haptic("selection", prefs.haptics);

    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          // Phase suivante.
          setPhaseIdx((idx) => {
            const nextIdx = idx + 1;
            if (nextIdx >= spec.phases.length) {
              setCycleCount((c) => {
                const nextCycle = c + 1;
                if (nextCycle >= cycles) {
                  // Fin de séance.
                  if (tickRef.current) clearInterval(tickRef.current);
                  tickRef.current = null;
                  setRunning(false);
                  setTimeout(() => onComplete?.(), 0);
                  return 0;
                }
                return nextCycle;
              });
              return 0;
            }
            return nextIdx;
          });
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
    // Re-run quand phase change pendant running.
  }, [running, phaseIdx, currentPhase.durationSec, currentPhase.id, cycles, spec.phases.length, prefs.haptics, onComplete, onPhaseChange]);

  const start = () => {
    if (running) return;
    if (cycleCount >= cycles) reset();
    setRunning(true);
  };

  const phaseColor = useMemo(() => {
    switch (currentPhase.id) {
      case "inhale":
        return "var(--color-kaia-accent)";
      case "hold-in":
        return "var(--color-kaia-gold)";
      case "exhale":
        return "var(--color-kaia-green)";
      case "hold-out":
        return "var(--color-kaia-terracotta)";
    }
  }, [currentPhase.id]);

  // Scale visuelle :
  //   inhale 0.6 → 1.0
  //   hold-in : 1.0
  //   exhale 1.0 → 0.6
  //   hold-out : 0.6
  const scale = useMemo(() => {
    if (currentPhase.id === "hold-in") return 1.0;
    if (currentPhase.id === "hold-out") return 0.6;
    const base = currentPhase.id === "inhale" ? 0.6 : 1.0;
    const target = currentPhase.id === "inhale" ? 1.0 : 0.6;
    return base + (target - base) * 0.5; // valeur médiane (CSS transition fait le reste).
  }, [currentPhase.id]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        {(Object.keys(PATTERNS) as BreathPattern[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (running) stop();
              setPattern(id);
              setPhaseIdx(0);
              setCycleCount(0);
              setSecondsLeft(0);
            }}
            className={cn(
              "px-3 h-9 rounded-xl text-sm wellness-anim",
              pattern === id
                ? "bg-white/10 text-white border border-white/15"
                : "text-white/55 hover:text-white/80 border border-transparent"
            )}
            aria-pressed={pattern === id}
          >
            {PATTERNS[id].name}
          </button>
        ))}
      </div>

      <div className="relative h-72 w-72 sm:h-80 sm:w-80 grid place-items-center">
        {/* Halo statique pour profondeur. */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(closest-side, ${phaseColor}22 0%, transparent 70%)`,
          }}
        />
        {/* Cercle animé — durée = phase active. */}
        <div
          className="rounded-full will-change-transform"
          style={{
            height: 192,
            width: 192,
            transform: `scale(${scale})`,
            transition: `transform ${currentPhase.durationSec}s cubic-bezier(0.45, 0, 0.55, 1)`,
            background: `radial-gradient(closest-side, ${phaseColor}AA 0%, ${phaseColor}33 60%, transparent 100%)`,
            boxShadow: `0 0 60px ${phaseColor}66`,
          }}
        />
        <div className="absolute inset-0 grid place-items-center text-center pointer-events-none">
          <div>
            <p className="font-display text-3xl text-white tracking-tight">
              {currentPhase.labelFr}
            </p>
            <p className="font-display text-5xl text-white/85 tabular-nums mt-1">
              {running ? secondsLeft || currentPhase.durationSec : currentPhase.durationSec}
            </p>
            <p className="text-xs text-white/45 mt-2">
              Cycle {cycleCount + (running ? 1 : 0)} / {cycles}
            </p>
          </div>
        </div>
      </div>

      <p className="max-w-md text-center text-sm text-white/55">{spec.description}</p>

      <div className="flex items-center gap-3">
        <HapticButton
          onClick={running ? stop : start}
          variant="primary"
          size="md"
          hapticIntensity={running ? "warning" : "success"}
          aria-label={running ? "Arrêter" : "Démarrer la respiration"}
        >
          {running ? (
            <>
              <Pause className="w-4 h-4" strokeWidth={1.7} /> Arrêter
            </>
          ) : (
            <>
              <Play className="w-4 h-4" strokeWidth={1.7} /> Démarrer
            </>
          )}
        </HapticButton>
        <HapticButton
          onClick={reset}
          variant="ghost"
          size="md"
          hapticIntensity="selection"
          aria-label="Réinitialiser"
        >
          <RotateCcw className="w-4 h-4" strokeWidth={1.7} />
          Réinitialiser
        </HapticButton>
      </div>
    </div>
  );
}
