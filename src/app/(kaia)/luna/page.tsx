import type { Metadata } from "next";

export const metadata: Metadata = { title: "LUNA — KAÏA" };

export default function LunaPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-[rgba(200,185,240,0.08)]">
        <h1 className="font-display text-2xl font-semibold gradient-kaia-text">LUNA</h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Ton guide intuitif du cycle</p>
      </div>
      <div className="flex-1 flex items-center justify-center px-5">
        <div className="glass rounded-2xl p-6 max-w-sm text-center">
          <p className="text-[var(--foreground-muted)] text-sm">
            LUNA arrive en P2 — conversations guidées, analyse de cycle, modes dédiés.
          </p>
        </div>
      </div>
    </div>
  );
}
