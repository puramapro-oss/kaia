"use client";

import { AR_PROTOCOLS, type ARProtocol } from "@/lib/ar/protocols";
import { Shield } from "lucide-react";

/**
 * Liste des 10 protocoles AR crisis-safe. Sélection d'un protocole avant
 * consentement et session.
 */
export default function ARProtocols({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (protocol: ARProtocol) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {AR_PROTOCOLS.map((p) => {
        const active = selected === p.slug;
        return (
          <button
            key={p.slug}
            onClick={() => onSelect(p)}
            className={[
              "glass rounded-2xl p-4 text-left transition-all",
              active
                ? "ring-2 ring-[var(--kaia-moon)] bg-[var(--kaia-moon)]/10"
                : "hover:bg-[var(--kaia-moon)]/8",
            ].join(" ")}
            aria-pressed={active}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{p.emoji}</span>
              <h3 className="font-medium text-sm">{p.name}</h3>
            </div>
            <p className="text-xs text-[var(--foreground-muted)] mb-2">{p.description}</p>
            <div className="flex items-center gap-2 text-[10px] text-[var(--foreground-muted)]">
              <span className="flex items-center gap-1 text-green-400">
                <Shield className="w-3 h-3" /> crisis-safe
              </span>
              <span>· {Math.round(p.durationSec / 60)} min</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
