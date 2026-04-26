interface AuraGlowProps {
  level: number; // 1-10
  className?: string;
}

const PALETTES: Array<{ from: string; to: string; soft: string }> = [
  { from: "#1A4D3A", to: "#06B6D4", soft: "#1A4D3A" }, // 1 — vert profond → cyan
  { from: "#1A4D3A", to: "#7C3AED", soft: "#1A4D3A" }, // 2 — vert → violet
  { from: "#06B6D4", to: "#7C3AED", soft: "#06B6D4" }, // 3 — cyan → violet
  { from: "#7C3AED", to: "#F472B6", soft: "#7C3AED" }, // 4 — violet → rose
  { from: "#F472B6", to: "#F4C430", soft: "#F472B6" }, // 5 — rose → or
  { from: "#F4C430", to: "#D4906A", soft: "#F4C430" }, // 6 — or → terracotta
  { from: "#D4906A", to: "#06B6D4", soft: "#D4906A" }, // 7 — terracotta → cyan
  { from: "#06B6D4", to: "#FFFEF7", soft: "#06B6D4" }, // 8 — cyan → ivoire
  { from: "#7C3AED", to: "#F4C430", soft: "#7C3AED" }, // 9 — violet → or
  { from: "#FFFEF7", to: "#F4C430", soft: "#FFFEF7" }, // 10 — ivoire → or (lumière pure)
];

/**
 * Aura visuelle subtile, gradient évolutif selon le niveau d'éveil.
 * Pas de classement vs autres (BRIEF §5.5). Juste un reflet de TON chemin.
 */
export function AuraGlow({ level, className }: AuraGlowProps) {
  const idx = Math.min(PALETTES.length - 1, Math.max(0, level - 1));
  const palette = PALETTES[idx];

  return (
    <div className={`relative h-48 sm:h-56 grid place-items-center ${className ?? ""}`}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(closest-side, ${palette.soft}33 0%, transparent 70%)`,
          filter: "blur(20px)",
        }}
        aria-hidden
      />
      <div
        className="h-32 w-32 sm:h-40 sm:w-40 rounded-full will-change-transform"
        style={{
          background: `radial-gradient(closest-side, ${palette.from}AA 0%, ${palette.to}55 60%, transparent 100%)`,
          boxShadow: `0 0 80px ${palette.from}66, 0 0 160px ${palette.to}33`,
          animation: "aura-pulse 6s ease-in-out infinite",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">Niveau d'éveil</p>
          <p className="font-display text-3xl text-white tabular-nums mt-1">{level}</p>
          <p className="text-xs text-white/45 mt-0.5">/ 10</p>
        </div>
      </div>
      <style>{`
        @keyframes aura-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.92; }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="aura"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
