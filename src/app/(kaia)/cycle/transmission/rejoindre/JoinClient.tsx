"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinClient({ spaceId, token }: { spaceId: string; token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/transmission/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId, token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Lien invalide.");
        if (active) router.replace("/cycle/transmission");
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Lien invalide.");
      });
    return () => {
      active = false;
    };
  }, [spaceId, token, router]);

  return (
    <div className="glass rounded-2xl p-8 text-center">
      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <p className="text-sm text-[var(--foreground-muted)]">On te connecte à l'espace…</p>
      )}
    </div>
  );
}
