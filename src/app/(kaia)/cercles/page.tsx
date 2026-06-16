import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cercles — KAÏA" };

export default function CerclesPage() {
  return (
    <div className="px-5 py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-6">Cercles</h1>
      <div className="glass rounded-2xl p-6">
        <p className="text-[var(--foreground-muted)] text-sm">
          Les Cercles d&apos;Intention arrivent en P2 — espaces de partage guidés par LUNA.
        </p>
      </div>
    </div>
  );
}
