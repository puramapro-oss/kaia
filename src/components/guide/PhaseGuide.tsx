"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getLifeGuide } from "@/lib/cycle/life-guide";
import { PHASE_LABEL, PHASES } from "@/lib/cycle/phase-labels";
import { cn } from "@/lib/utils";
import type { CyclePhase } from "@/lib/cycle/phases";

export default function PhaseGuide({ currentPhase }: { currentPhase: CyclePhase }) {
  const [phase, setPhase] = useState<CyclePhase>(currentPhase);
  const [lunaMessage, setLunaMessage] = useState<string | null>(null);
  const [lunaState, setLunaState] = useState<"loading" | "done" | "error">("loading");

  const guide = getLifeGuide(phase);

  // Le message LUNA ne concerne que la phase réelle de l'utilisatrice.
  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12000);
    fetch("/api/guide/daily", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http"))))
      .then((data) => {
        if (!active) return;
        setLunaMessage(data.lunaMessage ?? null);
        setLunaState("done");
      })
      .catch(() => {
        if (active) setLunaState("error");
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      ctrl.abort();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto">
        {PHASES.map((p) => (
          <button
            key={p}
            onClick={() => setPhase(p)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              phase === p
                ? "bg-[var(--kaia-moon)]/20 text-[var(--kaia-moon)]"
                : "bg-[var(--kaia-soft)] text-[var(--foreground-muted)]"
            )}
          >
            {PHASE_LABEL[p]}
            {p === currentPhase && " ·"}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="font-display text-xl font-semibold gradient-kaia-text">{guide.title}</h2>
        <p className="text-sm italic text-[var(--kaia-moon)] mt-1">« {guide.mantra} »</p>
      </div>

      {/* Guide du jour personnalisé par LUNA — seulement pour la phase actuelle. */}
      {phase === currentPhase && (
        <div className="rounded-2xl p-5 bg-gradient-to-br from-[var(--kaia-moon)]/10 to-[var(--kaia-gold)]/10 border border-[var(--kaia-moon)]/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[var(--kaia-moon)]" />
            <h3 className="font-medium text-sm">Le guide du jour de LUNA</h3>
          </div>
          {lunaState === "loading" && (
            <div className="space-y-2" aria-hidden>
              <div className="h-3 rounded-full bg-white/5 animate-pulse" />
              <div className="h-3 rounded-full bg-white/5 animate-pulse w-4/5" />
            </div>
          )}
          {lunaState === "error" && (
            <p className="text-sm text-[var(--foreground-muted)]">
              LUNA se repose un instant. Le guide ci-dessous reste là pour toi.
            </p>
          )}
          {lunaState === "done" && (
            <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
              {lunaMessage ?? "Renseigne ton cycle et ton journal pour un guide encore plus personnalisé."}
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {guide.dimensions.map((dim) => (
          <div key={dim.key} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{dim.emoji}</span>
              <h3 className="font-medium">{dim.label}</h3>
            </div>
            <ul className="space-y-2">
              {dim.tips.map((tip, i) => (
                <li key={i} className="text-sm text-[var(--foreground-muted)] flex gap-2">
                  <span className="text-[var(--kaia-moon)] mt-0.5">·</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
