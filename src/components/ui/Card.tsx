import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass rounded-3xl p-6 sm:p-8 wellness-anim hover:bg-white/[0.06]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function GlassCardHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <span className="inline-block text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80">
          {eyebrow}
        </span>
      ) : null}
      <h3 className="font-display text-2xl text-white tracking-tight">{title}</h3>
      {subtitle ? <p className="text-sm text-white/60 leading-relaxed">{subtitle}</p> : null}
    </div>
  );
}
