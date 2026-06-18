"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import MomentZ from "@/components/core/MomentZ";
import CoherenceGauge from "@/components/core/CoherenceGauge";
import COREDisclaimer from "@/components/core/COREDisclaimer";
import COREAnimal from "@/components/core/COREAnimal";
import DualSync from "@/components/core/DualSync";
import BackButton from "@/components/ui/BackButton";
import type { MomentZEvent } from "@/lib/core/moment-z";

// Globe Three.js : jamais en SSR (WebGL côté client uniquement).
const ParticipantsGlobe = dynamic(() => import("@/components/core/ParticipantsGlobe"), {
  ssr: false,
  loading: () => <div className="glass rounded-2xl h-64 animate-pulse" />,
});

interface CoreEvent extends MomentZEvent {
  id: string;
  title: string;
  description: string | null;
  animal_focus: boolean;
}

export default function CoreEventClient({
  event,
  userId,
  initialJoined,
  initialCoherence,
  initialUserSynced,
  initialSyncedCount,
  initialTotal,
}: {
  event: CoreEvent;
  userId: string;
  initialJoined: boolean;
  initialCoherence: number;
  initialUserSynced: boolean;
  initialSyncedCount: number;
  initialTotal: number;
}) {
  const [joined, setJoined] = useState(initialJoined);
  const [synced, setSynced] = useState(initialUserSynced);
  const [busy, setBusy] = useState(false);
  const [coherence, setCoherence] = useState(initialCoherence);
  const [syncedCount, setSyncedCount] = useState(initialSyncedCount);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [isLive, setIsLive] = useState(false);

  async function handleJoin() {
    setBusy(true);
    try {
      const res = await fetch("/api/core/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Impossible de rejoindre.");
        return;
      }
      setJoined(true);
      setTotalCount((t) => t + 1);
      toast.success("Tu as rejoint l'événement 🌙");
    } catch {
      toast.error("Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    setBusy(true);
    try {
      const res = await fetch("/api/core/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Synchronisation impossible.");
        return;
      }
      setSynced(true);
      setCoherence(data.coherence);
      setSyncedCount(data.syncedCount);
      setTotalCount(data.totalCount);
    } catch {
      toast.error("Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28 space-y-6">
      <BackButton href="/core" />

      <div>
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">{event.title}</h1>
        {event.description && (
          <p className="text-[var(--foreground-muted)] text-sm">{event.description}</p>
        )}
      </div>

      <ParticipantsGlobe eventId={event.id} initialCount={initialTotal} />

      <MomentZ event={event} onLive={() => setIsLive(true)} />

      {event.animal_focus && <COREAnimal />}

      {!joined ? (
        <button
          onClick={handleJoin}
          disabled={busy}
          className="w-full py-4 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] font-medium disabled:opacity-50"
        >
          Rejoindre l&apos;événement
        </button>
      ) : !synced ? (
        <button
          onClick={handleSync}
          disabled={busy || !isLive}
          className="w-full py-4 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] font-medium disabled:opacity-50"
        >
          {isLive ? "Je me synchronise maintenant" : "En attente du Moment Z…"}
        </button>
      ) : (
        <p className="text-center text-sm text-[var(--kaia-moon)]">Tu es synchronisée ✨</p>
      )}

      <CoherenceGauge score={coherence} syncedCount={syncedCount} totalCount={totalCount} />

      {joined && <DualSync eventId={event.id} userId={userId} />}

      <COREDisclaimer compact />
    </div>
  );
}
