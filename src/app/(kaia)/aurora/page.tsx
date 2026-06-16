import type { Metadata } from "next";
import { Wind } from "lucide-react";

export const metadata: Metadata = { title: "AURORA — KAÏA" };

export default function AuroraPage() {
  return (
    <div className="px-5 py-8 max-w-2xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Wind size={22} className="text-[var(--kaia-rose)]" strokeWidth={1.5} />
          <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-widest">Respiration guidée</p>
        </div>
        <h1 className="font-display text-4xl font-semibold" style={{ color: "var(--kaia-rose)" }}>
          AURORA
        </h1>
      </header>

      {/* Program grid — 4 variants, wired in P2 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: "Brume", desc: "Apaisement doux", emoji: "🌫️", level: "brume" },
          { name: "Onde", desc: "Équilibre & focus", emoji: "🌊", level: "onde" },
          { name: "Aura", desc: "Énergie & vitalité", emoji: "✨", level: "aura" },
          { name: "Polaris", desc: "Cohérence cardiaque", emoji: "⭐", level: "polaris" },
        ].map((p) => (
          <div key={p.level} className="glass rounded-2xl p-5 flex flex-col gap-3 opacity-80">
            <span className="text-2xl">{p.emoji}</span>
            <div>
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{p.desc}</p>
            </div>
            <span className="text-xs text-[var(--kaia-rose)]/60">Bientôt disponible</span>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 mt-6">
        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
          AURORA OMEGA — 7 minutes de respiration guidée adaptées à ta phase du cycle. 5 phases, 4 niveaux, WebAudio + retour haptique. <span className="text-[var(--kaia-rose)]">Arrive en P2.</span>
        </p>
      </div>
    </div>
  );
}
