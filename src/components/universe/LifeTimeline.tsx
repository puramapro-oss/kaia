import { Sparkles, Wind, Leaf, Award } from "lucide-react";

export type TimelineEventKind =
  | "practice"
  | "routine"
  | "streak"
  | "onboarding"
  | "first_routine"
  | "ritual"
  | "tokens";

export interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  title: string;
  subtitle?: string;
  at: string; // ISO
}

interface LifeTimelineProps {
  events: TimelineEvent[];
}

const KIND_META: Record<
  TimelineEventKind,
  { icon: typeof Sparkles; color: string; label: string }
> = {
  practice: { icon: Wind, color: "#06B6D4", label: "Pratique" },
  routine: { icon: Sparkles, color: "#F4C430", label: "Routine" },
  streak: { icon: Award, color: "#D4906A", label: "Série" },
  onboarding: { icon: Leaf, color: "#7C3AED", label: "Bienvenue" },
  first_routine: { icon: Sparkles, color: "#7C3AED", label: "Première fois" },
  ritual: { icon: Award, color: "#F472B6", label: "Rituel" },
  tokens: { icon: Sparkles, color: "#06B6D4", label: "Tokens" },
};

export function LifeTimeline({ events }: LifeTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center">
        <p className="font-display text-lg text-white/70">Ton fil de vie commence ici.</p>
        <p className="text-sm text-white/45 mt-1">
          Chaque pratique terminée s'inscrit ici, doucement.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative border-l border-white/10 pl-5 space-y-5">
      {events.map((e) => {
        const meta = KIND_META[e.kind];
        const Icon = meta.icon;
        const date = new Date(e.at);
        const formatted = new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(date);

        return (
          <li key={e.id} className="relative">
            <span
              className="absolute -left-[1.625rem] top-1 grid place-items-center h-7 w-7 rounded-full border border-white/15"
              style={{ background: `${meta.color}22`, color: meta.color }}
              aria-hidden
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.7} />
            </span>
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-base text-white/95">{e.title}</p>
                <p className="text-xs text-white/40 tabular-nums shrink-0">{formatted}</p>
              </div>
              {e.subtitle && <p className="text-sm text-white/55 mt-0.5">{e.subtitle}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
