import { Sparkles } from "lucide-react";

interface TokenChipProps {
  balance: number;
  dailyEarned: number;
  dailyCap: number;
}

export function TokenChip({ balance, dailyEarned, dailyCap }: TokenChipProps) {
  const pct = Math.min(100, Math.round((dailyEarned / dailyCap) * 100));
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-3 py-2">
      <Sparkles
        className="w-4 h-4 text-[var(--color-kaia-accent)]"
        strokeWidth={1.7}
        aria-hidden
      />
      <div className="leading-tight">
        <p className="text-[15px] font-display text-white tabular-nums">{balance}</p>
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
          tokens · jour {dailyEarned}/{dailyCap}
        </p>
      </div>
      <div className="ml-1 h-7 w-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div
          className="w-full bg-[var(--color-kaia-accent)] wellness-anim"
          style={{ height: `${pct}%`, transformOrigin: "bottom" }}
        />
      </div>
    </div>
  );
}
