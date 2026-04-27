"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  completionId: string;
  rewardTokens: number;
  userId: string;
}

export function MissionReviewActions({ completionId, rewardTokens, userId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function decide(decision: "approved" | "rejected") {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/missions/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completionId, decision, userId }),
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
    <div className="flex gap-2 items-center">
      <button
        onClick={() => decide("approved")}
        disabled={pending}
        className="px-3 py-1.5 rounded-lg bg-emerald-300 text-black text-sm font-medium hover:bg-emerald-200 disabled:opacity-60"
      >
        Approuver +{rewardTokens}
      </button>
      <button
        onClick={() => decide("rejected")}
        disabled={pending}
        className="px-3 py-1.5 rounded-lg bg-rose-300/20 text-rose-200 text-sm hover:bg-rose-300/30 disabled:opacity-60"
      >
        Rejeter
      </button>
      {error && <span className="text-xs text-rose-300 ml-2">{error}</span>}
    </div>
  );
}
