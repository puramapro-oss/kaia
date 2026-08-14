"use client";
import { useState } from "react";
import type { VitaePlanKey } from "@/lib/constants";

interface Props {
  planKey: VitaePlanKey;
}

export default function AbonnementActions({ planKey }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, idempotencyKey: crypto.randomUUID() }),
      });
      if (!res.ok) throw new Error("checkout_failed");
      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full mt-1 py-2.5 rounded-xl text-sm font-semibold text-[var(--kaia-night)] transition-all disabled:opacity-40"
      style={{
        background: "linear-gradient(135deg, var(--kaia-moon) 0%, var(--kaia-gold) 100%)",
      }}
    >
      {loading ? "…" : "Passer à ce plan"}
    </button>
  );
}
