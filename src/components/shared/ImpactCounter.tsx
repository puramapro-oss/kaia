"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ImpactCounterProps {
  value: number;
  label: string;
  emoji?: string;
  unit?: string;
  decimals?: number;
  /** Durée d'animation en ms. Default 1200. */
  duration?: number;
  className?: string;
  /** Couleur d'accent (default: accent KAÏA). */
  accent?: string;
}

/**
 * Compteur animé qui interpole de 0 → value sur `duration` ms.
 * Respecte `prefers-reduced-motion` : affiche directement la valeur finale.
 */
export function ImpactCounter({
  value,
  label,
  emoji,
  unit,
  decimals = 0,
  duration = 1200,
  className,
  accent = "var(--color-kaia-accent)",
}: ImpactCounterProps) {
  const [display, setDisplay] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || value === 0) {
      setDisplay(value);
      return;
    }

    startedAtRef.current = null;
    const tick = (now: number) => {
      if (startedAtRef.current === null) startedAtRef.current = now;
      const elapsed = now - startedAtRef.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString("fr-FR");

  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {emoji && (
          <span className="text-2xl" aria-hidden>
            {emoji}
          </span>
        )}
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{label}</p>
      </div>
      <p
        className="font-display text-4xl sm:text-5xl tabular-nums mt-3 wellness-anim"
        style={{ color: accent }}
      >
        {formatted}
        {unit && <span className="text-xl text-white/55 ml-1">{unit}</span>}
      </p>
    </div>
  );
}
