"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { haptic, type HapticIntensity } from "@/lib/multisensorial/haptics";
import { useMultisensorialPrefs } from "@/hooks/useMultisensorialPrefs";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface HapticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Force d'haptique au tap. `selection` par défaut (très subtile). */
  hapticIntensity?: HapticIntensity;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] text-white hover:opacity-95 active:scale-[0.98] shadow-[0_8px_28px_-12px_rgba(6,182,212,0.4)]",
  secondary:
    "bg-[var(--color-kaia-gold)] text-[#1a1a1a] hover:bg-[#f5cc4a] active:scale-[0.98]",
  ghost:
    "bg-white/5 text-white/90 hover:bg-white/10 border border-white/10 backdrop-blur-xl",
  outline: "border border-white/15 text-white/90 hover:bg-white/5 active:scale-[0.98]",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm rounded-xl",
  md: "h-12 px-6 text-[15px] rounded-2xl",
  lg: "h-14 px-8 text-base rounded-2xl",
};

/**
 * Bouton multisensoriel : ajoute une vibration subtile au tap quand le toggle
 * `multisensorial_haptics` est ON. Visuellement identique au Button pour
 * pouvoir être substitué partout sans changer le design system.
 */
export const HapticButton = forwardRef<HTMLButtonElement, HapticButtonProps>(
  function HapticButton(
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      hapticIntensity = "selection",
      onClick,
      children,
      ...rest
    },
    ref
  ) {
    const prefs = useMultisensorialPrefs();

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onClick={(event) => {
          haptic(hapticIntensity, prefs.haptics);
          onClick?.(event);
        }}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium wellness-anim disabled:opacity-50 disabled:cursor-not-allowed",
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...rest}
      >
        {loading ? (
          <span
            aria-hidden
            className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
          />
        ) : null}
        {children}
      </button>
    );
  }
);
