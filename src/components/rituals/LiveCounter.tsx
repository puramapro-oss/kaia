"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Users } from "lucide-react";

export function LiveCounter({
  ritualId,
  initialCount,
}: {
  ritualId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const supabase = createBrowserClient(url, key, { db: { schema: "kaia" } });
    const channel = supabase
      .channel(`weekly_rituals:${ritualId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "kaia",
          table: "weekly_rituals",
          filter: `id=eq.${ritualId}`,
        },
        (payload) => {
          const next = (payload.new as { participants_count?: number }).participants_count;
          if (typeof next === "number") setCount(next);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ritualId]);

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-white/65">
      <Users className="h-3.5 w-3.5 text-[var(--color-kaia-accent)]" strokeWidth={1.7} />
      <span className="tabular-nums font-medium text-white">{count.toLocaleString("fr-FR")}</span>
      <span>{count > 1 ? "personnes" : "personne"} cette semaine</span>
    </span>
  );
}
