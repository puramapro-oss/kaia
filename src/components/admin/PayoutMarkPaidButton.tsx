"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function PayoutMarkPaidButton({ payoutId }: { payoutId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function go() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/payouts/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Erreur.");
        return;
      }
      router.refresh();
    });
  }
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={go}
        disabled={pending}
        className="text-xs px-2 py-1 rounded-lg bg-emerald-300 text-black hover:bg-emerald-200 disabled:opacity-60"
      >
        {pending ? "…" : "Marquer payé"}
      </button>
      {error && <span className="text-xs text-rose-300">{error}</span>}
    </div>
  );
}
