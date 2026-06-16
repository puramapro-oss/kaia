import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mon Cycle — KAÏA" };

export default function CyclePage() {
  return (
    <div className="px-5 py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-6">Mon Cycle</h1>
      <div className="glass rounded-2xl p-6">
        <p className="text-[var(--foreground-muted)] text-sm">
          Le suivi de cycle arrive en P2 — phases, symptômes, notes chiffrées.
        </p>
      </div>
    </div>
  );
}
