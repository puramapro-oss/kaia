import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/Card";
import {
  PRACTICE_CATEGORIES,
  type PracticeCategory,
} from "@/lib/practices/categories";
import { cn } from "@/lib/utils";

export interface RoutineCardProps {
  index: number;
  total: number;
  practiceId: string;
  practiceSlug: string;
  category: PracticeCategory;
  title: string;
  durationSeconds: number;
  why?: string;
  href?: string;
  status?: "pending" | "current" | "done";
}

export function RoutineCard({
  index,
  total,
  practiceSlug: _slug,
  category,
  title,
  durationSeconds,
  why,
  href,
  status = "pending",
}: RoutineCardProps) {
  const spec = PRACTICE_CATEGORIES[category];
  const minutes = Math.round(durationSeconds / 60);

  const inner = (
    <GlassCard
      className={cn(
        "space-y-3 wellness-anim",
        status === "current" && "border-white/25",
        status === "done" && "opacity-65",
      )}
    >
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/40">
        <span>Pratique {index + 1} / {total}</span>
        {status === "done" && <span className="text-[var(--color-kaia-accent)]">✓ Fait</span>}
        {status === "current" && (
          <span className="text-[var(--color-kaia-gold)]">En cours</span>
        )}
      </div>
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 shrink-0"
          style={{ background: `${spec.accent}22`, color: spec.accent }}
          aria-hidden
        >
          <span className="text-base font-display tracking-tight">
            {spec.labelFr.charAt(0)}
          </span>
        </span>
        <div className="flex-1 space-y-1">
          <h3 className="font-display text-lg sm:text-xl text-white tracking-tight">{title}</h3>
          <p className="text-sm text-white/55">
            {spec.labelFr} · {minutes < 1 ? `${durationSeconds}s` : `${minutes} min`}
          </p>
          {why && <p className="text-sm text-white/65 leading-relaxed mt-2">{why}</p>}
        </div>
      </div>
      {href && status !== "done" && (
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white wellness-anim">
            {status === "current" ? "Reprendre" : "Démarrer"}
            <ArrowRight className="w-4 h-4" strokeWidth={1.7} />
          </span>
        </div>
      )}
    </GlassCard>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
