"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CreateLinkButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    start(async () => {
      const res = await fetch("/api/influencer/link", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Création impossible. Réessaie plus tard.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl text-sm font-medium text-white bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] hover:opacity-95 wellness-anim disabled:opacity-60"
      >
        {pending ? "Création..." : "Créer mon lien personnel"}
      </button>
      {error ? (
        <p className="mt-3 text-sm text-[var(--color-kaia-terracotta)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
