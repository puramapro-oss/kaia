"use client";

import { useEffect, useState } from "react";
import { AuroraPhase } from "@/lib/aurora/protocols";

interface BreathingGuideProps {
  phase: AuroraPhase;
  onComplete: () => void;
}

export default function BreathingGuide({ phase, onComplete }: BreathingGuideProps) {
  const [timeLeft, setTimeLeft] = useState(phase.durationSec);
  const [cycleProgress, setCycleProgress] = useState(0);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  // Breath rhythm animation
  useEffect(() => {
    if (!phase.breathRhythm) return;

    const { inhale, hold, exhale, pause } = phase.breathRhythm;
    const totalCycle = inhale + hold + exhale + pause;

    const interval = setInterval(() => {
      setCycleProgress((prev) => {
        const next = prev + 0.1;
        if (next >= totalCycle) return 0;
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [phase.breathRhythm]);

  // Derive breath cycle from progress (no effect needed)
  const breathCycle = (() => {
    if (!phase.breathRhythm) return "inhale";
    const { inhale, hold, exhale } = phase.breathRhythm;
    const p = cycleProgress;
    if (p < inhale) return "inhale";
    if (p < inhale + hold) return "hold";
    if (p < inhale + hold + exhale) return "exhale";
    return "pause";
  })() as "inhale" | "hold" | "exhale" | "pause";

  // Circle scale based on breath
  const getCircleScale = () => {
    if (!phase.breathRhythm) return 1;

    const { inhale, hold, exhale, pause } = phase.breathRhythm;
    const p = cycleProgress;

    if (p < inhale) {
      // Inhale: grow
      return 0.8 + (p / inhale) * 0.4; // 0.8 → 1.2
    } else if (p < inhale + hold) {
      // Hold: stay large
      return 1.2;
    } else if (p < inhale + hold + exhale) {
      // Exhale: shrink
      const exhaleProgress = (p - inhale - hold) / exhale;
      return 1.2 - exhaleProgress * 0.4; // 1.2 → 0.8
    } else {
      // Pause: stay small
      return 0.8;
    }
  };

  const breathLabel = {
    inhale: "Inspire",
    hold: "Retiens",
    exhale: "Expire",
    pause: "Pause",
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 space-y-12">
      {/* Phase label */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-cormorant font-semibold text-white">
          {phase.label}
        </h2>
        <p className="text-white/70 text-lg max-w-md mx-auto">
          {phase.instruction}
        </p>
      </div>

      {/* Breathing circle */}
      <div className="relative flex items-center justify-center">
        <div
          className="w-64 h-64 rounded-full flex items-center justify-center transition-transform duration-[2000ms] ease-in-out"
          style={{
            transform: `scale(${getCircleScale()})`,
            background: `radial-gradient(circle, ${phase.color}40, ${phase.color}20)`,
            boxShadow: `0 0 80px ${phase.color}60`,
          }}
        >
          {phase.breathRhythm && (
            <span className="text-2xl font-cormorant font-semibold text-white">
              {breathLabel[breathCycle]}
            </span>
          )}
        </div>
      </div>

      {/* Timer */}
      <div className="text-center space-y-1">
        <div className="text-5xl font-cormorant font-semibold text-kaia-moon">
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
        </div>
        <p className="text-white/50 text-sm">Temps restant</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${((phase.durationSec - timeLeft) / phase.durationSec) * 100}%`,
              backgroundColor: phase.color,
            }}
          />
        </div>
      </div>
    </div>
  );
}
