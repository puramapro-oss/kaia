"use client";

import { useEffect, useState } from "react";
import { useMultisensorialPrefs } from "@/hooks/useMultisensorialPrefs";

interface Beat {
  /** Texte affiché au-dessus du logo. */
  caption: string;
  /** Durée totale (ms) avant passage au beat suivant. */
  durationMs: number;
}

const BEATS: Beat[] = [
  { caption: "Tu es là.", durationMs: 3000 },
  { caption: "Respire.", durationMs: 3500 },
  { caption: "Bienvenue dans ton espace.", durationMs: 4000 },
  { caption: "KAÏA — vivre éveillé, ensemble.", durationMs: 4500 },
];

interface OnboardingCinematicProps {
  /** Appelé quand la cinématique se termine (timer ou skip). */
  onFinish: () => void;
}

/**
 * Cinématique d'ouverture 15s. Skippable au tap. Respect du toggle
 * `multisensorial_cinematic` : si OFF, appelle onFinish immédiatement.
 *
 * Aucune dépendance externe (pas de Lottie ni Three) — beats CSS purs,
 * fade/scale sur Tailwind.
 */
export function OnboardingCinematic({ onFinish }: OnboardingCinematicProps) {
  const prefs = useMultisensorialPrefs();
  const [beat, setBeat] = useState(0);
  const [hidden, setHidden] = useState(false);

  // Toggle off → skip immédiat.
  useEffect(() => {
    if (!prefs.cinematic) {
      onFinish();
      setHidden(true);
    }
  }, [prefs.cinematic, onFinish]);

  // Avance des beats.
  useEffect(() => {
    if (hidden) return;
    if (beat >= BEATS.length) {
      const timeout = setTimeout(() => {
        setHidden(true);
        onFinish();
      }, 600);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setBeat((value) => value + 1), BEATS[beat].durationMs);
    return () => clearTimeout(timeout);
  }, [beat, hidden, onFinish]);

  if (hidden) return null;
  const current = BEATS[Math.min(beat, BEATS.length - 1)];

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-[#06070b]"
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenue dans KAÏA"
      onClick={() => {
        setHidden(true);
        onFinish();
      }}
    >
      {/* Particules subtiles via gradients. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(40% 40% at 30% 30%, rgba(26,77,58,0.4) 0%, transparent 70%), radial-gradient(40% 40% at 70% 70%, rgba(6,182,212,0.25) 0%, transparent 70%)",
          animation: "kaia-cinema-bg 12s ease-in-out infinite",
        }}
      />

      <div className="relative text-center space-y-8 px-6">
        <div
          aria-hidden
          className="mx-auto h-24 w-24 rounded-3xl bg-gradient-to-br from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] grid place-items-center font-display text-4xl text-white shadow-[0_0_60px_rgba(6,182,212,0.4)]"
          style={{ animation: "kaia-cinema-pulse 4s ease-in-out infinite" }}
        >
          K
        </div>

        <p
          key={beat}
          className="font-display text-2xl sm:text-3xl text-white/90 tracking-tight max-w-md mx-auto"
          style={{ animation: "kaia-cinema-line 600ms cubic-bezier(0.16,1,0.3,1)" }}
        >
          {current.caption}
        </p>

        <p className="text-xs text-white/35 tracking-[0.2em] uppercase">
          Tap pour passer
        </p>
      </div>

      <style jsx>{`
        @keyframes kaia-cinema-bg {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes kaia-cinema-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes kaia-cinema-line {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
