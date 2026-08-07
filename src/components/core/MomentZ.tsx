"use client";

import { useEffect, useState } from "react";
import {
  getMomentZ,
  formatCountdown,
  momentZStatus,
  type MomentZEvent,
} from "@/lib/core/moment-z";

/**
 * Compte à rebours vers le Moment Z — l'instant de convergence collective.
 * Quand le statut passe à "live", déclenche `onLive` (une seule fois).
 */
export default function MomentZ({
  event,
  onLive,
}: {
  event: MomentZEvent;
  onLive?: () => void;
}) {
  const [now, setNow] = useState<Date | null>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const status = now ? momentZStatus(event, now) : "upcoming";

  useEffect(() => {
    if (status === "live") onLive?.();
  }, [status, onLive]);

  const seconds = now ? Math.round((getMomentZ(event).getTime() - now.getTime()) / 1000) : 0;

  return (
    <div className="glass rounded-2xl p-6 text-center">
      <p className="text-xs uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
        Moment Z
      </p>
      {status === "live" ? (
        <p className="font-display text-3xl font-semibold gradient-kaia-text animate-pulse">
          C&apos;est maintenant 🌕
        </p>
      ) : status === "passed" ? (
        <p className="font-display text-2xl font-medium text-[var(--foreground-muted)]">
          Convergence passée
        </p>
      ) : (
        <p className="font-display text-4xl font-semibold gradient-kaia-text tabular-nums">
          {now ? formatCountdown(seconds) : "—"}
        </p>
      )}
      <p className="text-xs text-[var(--foreground-muted)] mt-2">
        {status === "live"
          ? "Respire avec le collectif. Sois simplement présente."
          : status === "passed"
            ? "Merci d'avoir été là."
            : "Avant la convergence collective"}
      </p>
    </div>
  );
}
