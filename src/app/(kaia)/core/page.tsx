import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CORETimeline, { type CoreEventCard } from "@/components/core/CORETimeline";
import COREDisclaimer from "@/components/core/COREDisclaimer";
import CoreCreate from "@/components/core/CoreCreate";

export const metadata: Metadata = { title: "C.O.R.E. — KAÏA" };

export default async function CorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: events } = await supabase
    .from("core_events")
    .select("id, type, title, description, starts_at, auto_created_by_radar")
    .eq("status", "active")
    .order("starts_at", { ascending: true })
    .limit(60);

  const ids = (events ?? []).map((e) => e.id);
  let countByEvent: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: parts } = await supabase
      .from("core_participations")
      .select("event_id")
      .in("event_id", ids);
    countByEvent = (parts ?? []).reduce<Record<string, number>>((acc, p) => {
      acc[p.event_id] = (acc[p.event_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  const cards: CoreEventCard[] = (events ?? []).map((e) => ({
    ...e,
    participants_count: countByEvent[e.id] ?? 0,
  }));

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">
          C.O.R.E.
        </h1>
        <p className="text-[var(--foreground-muted)] text-sm">
          Événements collectifs synchronisés — présence, respiration, intention partagée
        </p>
      </div>

      <div className="mb-6">
        <COREDisclaimer />
      </div>

      <CORETimeline events={cards} />
      <CoreCreate />
    </div>
  );
}
