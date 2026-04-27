"use client";

import { useState, useTransition } from "react";

const SUGGESTED = [500, 1000, 2500, 5000];

export function DonationForm({ causeSlug }: { causeSlug: string }) {
  const [selected, setSelected] = useState<number>(1000);
  const [custom, setCustom] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function chosenAmount(): number {
    const c = Number.parseInt(custom, 10);
    if (Number.isFinite(c) && c >= 1) return Math.round(c * 100);
    return selected;
  }

  function donate() {
    setError(null);
    const amountCents = chosenAmount();
    if (amountCents < 100) {
      setError("Don minimum 1 €.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/donations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ causeSlug, amountCents }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Erreur inconnue.");
        return;
      }
      const j = await res.json();
      if (j.url) window.location.href = j.url as string;
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {SUGGESTED.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => {
              setSelected(amt);
              setCustom("");
            }}
            className={`rounded-lg border py-2 text-sm transition ${
              !custom && selected === amt
                ? "border-rose-300 bg-rose-300/10 text-rose-200"
                : "border-white/10 bg-black/20 text-white/80 hover:border-white/20"
            }`}
          >
            {(amt / 100).toFixed(0)} €
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min="1"
          max="5000"
          placeholder="Montant libre (€)"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="flex-1 rounded-lg bg-black/30 border border-white/10 px-3 py-2"
          aria-label="Montant libre du don en euros"
        />
        <span className="text-xs text-white/50">
          → {Math.floor(chosenAmount() / 10)} tokens
        </span>
      </div>
      <button
        type="button"
        onClick={donate}
        disabled={pending}
        className="w-full rounded-xl bg-rose-300 text-black font-medium py-2.5 hover:bg-rose-200 disabled:opacity-60"
      >
        {pending ? "Préparation…" : `Donner ${(chosenAmount() / 100).toFixed(2)} €`}
      </button>
      {error && (
        <p className="text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
