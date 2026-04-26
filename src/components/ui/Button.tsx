import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] text-white hover:opacity-95 active:scale-[0.98] shadow-[0_8px_28px_-12px_rgba(6,182,212,0.4)]",
  secondary:
    "bg-[var(--color-kaia-gold)] text-[#1a1a1a] hover:bg-[#f5cc4a] active:scale-[0.98]",
  ghost:
    "bg-white/5 text-white/90 hover:bg-white/10 border border-white/10 backdrop-blur-xl",
  outline:
    "border border-white/15 text-white/90 hover:bg-white/5 active:scale-[0.98]",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm rounded-xl",
  md: "h-12 px-6 text-[15px] rounded-2xl",
  lg: "h-14 px-8 text-base rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium wellness-anim disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      ) : null}
      {children}
    </button>
  );
});
