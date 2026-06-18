"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserBanButton({ userId, banned }: { userId: string; banned: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    // Confirmation uniquement pour le bannissement (action bloquante).
    if (!banned && !confirm("Bannir cet utilisateur ? Son accès sera bloqué.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ban: !banned }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Action impossible.");
      } else {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`text-xs px-2.5 py-1 rounded-lg disabled:opacity-50 ${
        banned
          ? "bg-emerald-300/15 text-emerald-200 hover:bg-emerald-300/25"
          : "bg-red-500/15 text-red-300 hover:bg-red-500/25"
      }`}
    >
      {busy ? "…" : banned ? "Débannir" : "Bannir"}
    </button>
  );
}
