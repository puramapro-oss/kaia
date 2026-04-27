"use client";

/**
 * PromoCountdown — compteur live jusqu'à `until`, format `Xj Xh Xm`.
 * Bascule sur `Promotion expirée` quand échu (rare car la page 404 si link
 * désactivé ; ce composant est défensif).
 */

import { useEffect, useState } from "react";

interface Props {
  until: string; // ISO timestamp
}

function parts(diffMs: number) {
  if (diffMs <= 0) return null;
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function PromoCountdown({ until }: Props) {
  const target = Date.parse(until);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const p = Number.isFinite(target) ? parts(target - now) : null;
  if (!p) {
    return (
      <p className="text-sm text-white/50 italic" aria-live="polite">
        Promotion expirée
      </p>
    );
  }

  const items = [
    { label: "j", value: p.days },
    { label: "h", value: p.hours },
    { label: "m", value: p.minutes },
    { label: "s", value: p.seconds },
  ];

  return (
    <div
      className="flex items-center justify-center gap-3 font-display text-2xl text-white tabular-nums"
      aria-live="polite"
      aria-label={`Temps restant : ${p.days} jours ${p.hours} heures ${p.minutes} minutes`}
    >
      {items.map((it, idx) => (
        <span key={it.label} className="flex items-baseline">
          <span className="font-semibold">{String(it.value).padStart(2, "0")}</span>
          <span className="ml-1 text-[11px] text-white/50 font-sans">{it.label}</span>
          {idx < items.length - 1 ? (
            <span className="ml-2 text-white/20" aria-hidden>
              ·
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
