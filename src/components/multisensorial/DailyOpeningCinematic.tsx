"use client";

import { useEffect, useState } from "react";
import { useMultisensorialPrefs } from "@/hooks/useMultisensorialPrefs";

interface DailyOpeningCinematicProps {
  /** Prénom (utilisé dans la tagline). */
  firstName?: string;
  /** Appelé quand l'ouverture se termine (4s ou tap). */
  onFinish: () => void;
}

/**
 * Mini cinématique d'ouverture quotidienne — 4 secondes max.
 * Affichée à la première ouverture du jour (logique d'invocation côté
 * dashboard via cookie `kaia_cinema_seen_YYYYMMDD`).
 *
 * Toggle off → onFinish() instantané (pas de blink visuel).
 */
export function DailyOpeningCinematic({
  firstName,
  onFinish,
}: DailyOpeningCinematicProps) {
  const prefs = useMultisensorialPrefs();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!prefs.cinematic) {
      onFinish();
      setHidden(true);
      return;
    }
    const timeout = setTimeout(() => {
      setHidden(true);
      onFinish();
    }, 3800);
    return () => clearTimeout(timeout);
  }, [prefs.cinematic, onFinish]);

  if (hidden || !prefs.cinematic) return null;

  const greeting = firstName ? `Bonjour ${firstName}` : "Bonjour";

  return (
    <div
      className="fixed inset-0 z-[180] grid place-items-center bg-[#06070b]/95 backdrop-blur-2xl"
      onClick={() => {
        setHidden(true);
        onFinish();
      }}
      role="presentation"
    >
      <div className="text-center space-y-6 px-6">
        <div
          aria-hidden
          className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] grid place-items-center font-display text-2xl text-white shadow-[0_0_40px_rgba(6,182,212,0.4)]"
          style={{ animation: "kaia-daily-pulse 2.6s ease-in-out infinite" }}
        >
          K
        </div>
        <p
          className="font-display text-2xl sm:text-3xl text-white/90 tracking-tight"
          style={{ animation: "kaia-daily-line 700ms cubic-bezier(0.16,1,0.3,1)" }}
        >
          {greeting}.
        </p>
        <p
          className="text-sm text-white/55 max-w-xs mx-auto"
          style={{ animation: "kaia-daily-line 1100ms cubic-bezier(0.16,1,0.3,1) both" }}
        >
          Une respiration. Un instant. Te voilà.
        </p>
      </div>
      <style jsx>{`
        @keyframes kaia-daily-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes kaia-daily-line {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
