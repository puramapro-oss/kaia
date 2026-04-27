"use client";

import { useState, useTransition } from "react";

interface Props {
  productId: string;
  priceLabel: string;
}

export function BuyButton({ productId, priceLabel }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function buy() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
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
    <div>
      <button
        type="button"
        onClick={buy}
        disabled={pending}
        className="w-full rounded-xl bg-amber-300 text-black font-medium py-3 hover:bg-amber-200 disabled:opacity-60"
      >
        {pending ? "Préparation…" : `Acheter — ${priceLabel}`}
      </button>
      {error && (
        <p className="mt-2 text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
