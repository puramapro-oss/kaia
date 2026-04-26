import type { AxisProgress } from "@/lib/impact/aggregate";

const AXIS_EMOJI: Record<string, string> = {
  conscience: "🌌",
  sante: "🌿",
  savoir: "📖",
  liberte: "🕊️",
};

const AXIS_COLOR: Record<string, string> = {
  conscience: "#7C3AED",
  sante: "#1A4D3A",
  savoir: "#F4C430",
  liberte: "#06B6D4",
};

interface BadgesProps {
  axes: AxisProgress[];
}

export function Badges({ axes }: BadgesProps) {
  return (
    <section
      aria-label="Axes d'éveil"
      className="grid gap-3 sm:grid-cols-2 md:grid-cols-4"
    >
      {axes.map((a) => {
        const color = AXIS_COLOR[a.axis] ?? "#06B6D4";
        const emoji = AXIS_EMOJI[a.axis] ?? "✨";
        return (
          <div
            key={a.axis}
            className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>
                {emoji}
              </span>
              <p className="font-display text-lg text-white/95">{a.labelFr}</p>
            </div>
            <p className="text-xs text-white/55 leading-relaxed">{a.description}</p>
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Progression</p>
                <p
                  className="text-sm font-display tabular-nums"
                  style={{ color }}
                >
                  {a.pct}%
                </p>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full wellness-anim"
                  style={{ width: `${a.pct}%`, background: color }}
                />
              </div>
            </div>
            <p className="text-xs text-white/40 italic">{a.hint}</p>
          </div>
        );
      })}
    </section>
  );
}
