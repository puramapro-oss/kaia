"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import QrImage from "@/components/ui/QrImage";

/**
 * Dual Sync — invitation à synchroniser à deux. Génère un QR (et un lien) que
 * l'autre personne scanne pour rejoindre le même événement en binôme.
 */
export default function DualSync({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}) {
  const [copied, setCopied] = useState(false);
  // `origin` n'est connu que côté client → state initialisé (SSR-safe).
  const [inviteUrl] = useState(() =>
    typeof window !== "undefined"
      ? `${window.location.origin}/core/${eventId}?dual=${userId}`
      : ""
  );

  async function handleCopy() {
    if (await copyToClipboard(inviteUrl)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="glass rounded-2xl p-6 flex flex-col items-center text-center">
      <h3 className="font-medium mb-1">Synchroniser à deux</h3>
      <p className="text-xs text-[var(--foreground-muted)] mb-4">
        Fais scanner ce code à une proche pour vivre le Moment Z ensemble.
      </p>
      <QrImage value={inviteUrl} size={176} alt="QR Dual Sync" />
      <button
        onClick={handleCopy}
        disabled={!inviteUrl}
        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--kaia-moon)]/20 hover:bg-[var(--kaia-moon)]/30 transition-colors text-sm disabled:opacity-50"
      >
        <Link2 className="w-4 h-4" />
        {copied ? "Lien copié ✓" : "Copier le lien"}
      </button>
    </div>
  );
}
