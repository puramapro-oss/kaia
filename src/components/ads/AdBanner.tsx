"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import type { AdPlacement } from "@/lib/ads/rules";

interface ServedAd {
  id: string;
  title: string;
  body: string | null;
  ctaLabel: string;
  ctaUrl: string;
}

/** Encart d'annonce interne (§17). Rend null s'il n'y a aucune annonce servable. */
export default function AdBanner({ placement }: { placement: AdPlacement }) {
  const [ad, setAd] = useState<ServedAd | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/ads/serve?placement=${placement}`)
      .then((r) => (r.ok ? r.json() : { ad: null }))
      .then((d) => {
        if (active) setAd(d.ad ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [placement]);

  if (!ad) return null;

  function onClick() {
    if (!ad) return;
    // Tracking best-effort, puis ouverture.
    fetch("/api/ads/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId: ad.id }),
    }).catch(() => undefined);
    window.open(ad.ctaUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left glass rounded-2xl p-4 border border-[var(--kaia-moon)]/15 hover:bg-white/[0.07] transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <Megaphone className="w-3.5 h-3.5 text-[var(--kaia-moon)]" />
        <span className="text-[10px] uppercase tracking-wide text-[var(--foreground-muted)]">Annonce de la communauté</span>
      </div>
      <p className="font-medium text-sm">{ad.title}</p>
      {ad.body && <p className="text-sm text-[var(--foreground-muted)] mt-0.5">{ad.body}</p>}
      <span className="inline-block mt-2 text-xs font-medium text-[var(--kaia-moon)]">{ad.ctaLabel} →</span>
    </button>
  );
}
