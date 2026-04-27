"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  contestId: string;
  maxTickets: number;
  disabled?: boolean;
}

export function ContestEnterButton({ contestId, maxTickets, disabled }: Props) {
  const [tickets, setTickets] = useState<number>(Math.min(1, maxTickets));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (disabled || maxTickets <= 0) {
    return (
      <button
        disabled
        className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 py-3 cursor-not-allowed"
      >
        Aucun ticket disponible
      </button>
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/contests/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestId, tickets, source: "manual" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Erreur inconnue.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs text-white/60" htmlFor="ct-tickets">
        Tickets à placer (max {maxTickets})
      </label>
      <div className="flex items-center gap-3">
        <input
          id="ct-tickets"
          type="number"
          min={1}
          max={maxTickets}
          value={tickets}
          onChange={(e) => {
            const v = Number.parseInt(e.target.value, 10);
            if (!Number.isFinite(v)) return;
            setTickets(Math.max(1, Math.min(maxTickets, v)));
          }}
          className="w-20 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-center font-mono"
        />
        <button
          onClick={submit}
          disabled={pending}
          className="flex-1 rounded-xl bg-amber-300 text-black font-medium py-2.5 hover:bg-amber-200 disabled:opacity-60"
        >
          {pending ? "…" : `Placer ${tickets} ticket${tickets > 1 ? "s" : ""}`}
        </button>
      </div>
      {error && (
        <p className="text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
