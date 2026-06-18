import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeCoherence } from "@/lib/core/coherence";
import CoreEventClient from "./CoreEventClient";

export const metadata: Metadata = { title: "Événement C.O.R.E. — KAÏA" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CoreEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  if (!UUID_RE.test(eventId)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("core_events")
    .select("id, type, title, description, starts_at, ends_at, synchronization_moment_z, animal_focus, status")
    .eq("id", eventId)
    .maybeSingle();

  if (!event || event.status !== "active") notFound();

  const [{ count: total }, { count: synced }, { data: mine }, { data: mySync }] = await Promise.all([
    supabase.from("core_participations").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    supabase
      .from("core_participations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("moment_z_synced", true),
    supabase.from("core_participations").select("id").eq("event_id", eventId).eq("user_id", user.id).maybeSingle(),
    supabase
      .from("core_participations")
      .select("moment_z_synced")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const totalCount = total ?? 0;
  const syncedCount = synced ?? 0;

  return (
    <CoreEventClient
      event={event}
      userId={user.id}
      initialJoined={!!mine}
      initialTotal={totalCount}
      initialUserSynced={!!mySync?.moment_z_synced}
      initialSyncedCount={syncedCount}
      initialCoherence={computeCoherence({ syncedCount, totalCount })}
    />
  );
}
