import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { GUIDAGE_MODES } from "@/lib/cercles/guidage-modes";

export const metadata: Metadata = { title: "Cercles — KAÏA" };

const ENABLE_LIVEKIT = process.env.ENABLE_LIVEKIT === "true";

export default function CerclesPage() {
  return (
    <div className="px-5 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">
          Cercles d&apos;Intention
        </h1>
        <p className="text-[var(--foreground-muted)] text-sm">
          Espaces de partage guidés
        </p>
      </div>

      {!ENABLE_LIVEKIT && (
        <div className="glass rounded-2xl p-4 mb-6 border-[var(--kaia-moon)]/20">
          <p className="text-sm text-[var(--foreground-muted)]">
            Les sessions audio en direct arrivent bientôt. En attendant, explore la Communauté Sacrée.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <Link href="/cercles/communaute" className="block">
          <div className="glass rounded-2xl p-6 hover:bg-[var(--kaia-moon)]/10 transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🌀</div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-medium mb-2">Communauté Sacrée</h2>
                <p className="text-sm text-[var(--foreground-muted)] mb-3">
                  Partages anonymes et inspirations du cycle
                </p>
                <div className="flex items-center gap-2 text-[var(--kaia-moon)] text-sm font-medium">
                  <span>Découvrir</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </Link>

        <div className="glass rounded-2xl p-6 relative">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🔮</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-display text-xl font-medium">Cercles Guidés</h2>
                <span className="px-2 py-1 rounded-full bg-[var(--kaia-moon)]/20 text-[var(--kaia-moon)] text-xs font-medium">
                  Bientôt disponible
                </span>
              </div>
              <p className="text-sm text-[var(--foreground-muted)] mb-3">
                Audio en direct
              </p>
              <div className="flex flex-wrap gap-2">
                {GUIDAGE_MODES.slice(0, 4).map((mode) => (
                  <div
                    key={mode.id}
                    className="px-3 py-1.5 rounded-full bg-[var(--kaia-soft)] text-xs text-[var(--foreground-muted)] border border-[var(--kaia-moon)]/10"
                  >
                    {mode.icon} {mode.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {!ENABLE_LIVEKIT && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl">
              <Lock className="w-8 h-8 text-[var(--kaia-moon)]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
