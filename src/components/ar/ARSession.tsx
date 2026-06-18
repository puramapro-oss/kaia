"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Sparkles } from "lucide-react";
import { getARProtocol, type ARTargetType } from "@/lib/ar/protocols";
import { formatCountdown } from "@/lib/core/moment-z";
import { AR_STYLES, type ARStyle } from "@/lib/ar/consent";

/** Pause automatique anti-"AR vomiting" au-delà de 30 min de session continue. */
const AUTO_PAUSE_SEC = 30 * 60;

/**
 * Session AR Energy Mirror™. Consentement déjà validé en amont (token requis).
 * Démarre l'enregistrement serveur, chronomètre, pause auto > 30 min.
 */
export default function ARSession({
  style,
  protocolSlug,
  targetType,
  consentToken,
  onClose,
}: {
  style: ARStyle;
  protocolSlug: string;
  targetType: ARTargetType;
  consentToken: string;
  onClose: () => void;
}) {
  const protocol = getARProtocol(protocolSlug);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      const res = await fetch("/api/ar/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style, protocolSlug, targetType, consentToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Impossible de démarrer la session.");
        startedRef.current = false;
        return;
      }
      setRunning(true);
    } catch {
      setError("Connexion impossible. Réessaie.");
      startedRef.current = false;
    }
  }, [style, protocolSlug, targetType, consentToken]);

  useEffect(() => {
    if (!running || paused) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= AUTO_PAUSE_SEC) setPaused(true);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, paused]);

  const reachedLimit = elapsed >= AUTO_PAUSE_SEC;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--background)] flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--kaia-moon)]/10 via-transparent to-[var(--kaia-gold)]/10 pointer-events-none" />

      <div className="relative z-10 text-center max-w-md">
        <Sparkles className="w-8 h-8 text-[var(--kaia-moon)] mx-auto mb-3" />
        <h2 className="font-display text-2xl font-semibold gradient-kaia-text mb-1">
          {AR_STYLES[style].title}
        </h2>
        <p className="text-sm text-[var(--foreground-muted)] mb-1">{AR_STYLES[style].desc}</p>
        {protocol && (
          <p className="text-xs text-[var(--kaia-gold)] mb-6">
            {protocol.emoji} {protocol.name}
          </p>
        )}

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {!running ? (
          <button
            onClick={start}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] font-medium"
          >
            Commencer la session
          </button>
        ) : (
          <>
            <p className="font-display text-4xl font-semibold tabular-nums mb-2">
              {formatCountdown(elapsed)}
            </p>
            {reachedLimit && (
              <p className="text-xs text-[var(--kaia-gold)] mb-4 max-w-xs mx-auto">
                30 min atteintes — pause bien-être automatique. Reprends seulement si tu te sens bien.
              </p>
            )}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setPaused((p) => !p)}
                disabled={reachedLimit && !paused}
                className="w-14 h-14 rounded-full glass flex items-center justify-center disabled:opacity-40"
                aria-label={paused ? "Reprendre" : "Pause"}
              >
                {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              <button
                onClick={onClose}
                className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center"
                aria-label="Terminer"
              >
                <Square className="w-5 h-5 text-red-300" />
              </button>
            </div>
          </>
        )}

        <button onClick={onClose} className="block mx-auto mt-8 text-xs text-[var(--foreground-muted)] underline">
          Fermer
        </button>
      </div>
    </div>
  );
}
