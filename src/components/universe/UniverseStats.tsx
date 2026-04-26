interface Stat {
  label: string;
  value: string | number;
  hint?: string;
}

interface UniverseStatsProps {
  stats: Stat[];
}

export function UniverseStats({ stats }: UniverseStatsProps) {
  return (
    <section
      aria-label="Statistiques personnelles"
      className="grid gap-3 sm:grid-cols-2 md:grid-cols-4"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{s.label}</p>
          <p className="font-display text-3xl text-white tabular-nums mt-2">{s.value}</p>
          {s.hint && <p className="text-xs text-white/40 mt-1">{s.hint}</p>}
        </div>
      ))}
    </section>
  );
}
