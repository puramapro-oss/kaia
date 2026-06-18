"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Coins } from "lucide-react";
import BackButton from "@/components/ui/BackButton";

type MissionType = "solo" | "civic" | "community";

interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description?: string;
  tokens_reward: number;
  max_completions?: number;
}

interface Completion {
  mission_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const TAB_LABELS: Record<MissionType, string> = {
  solo: "Solo",
  civic: "Civique",
  community: "Communautaire",
};

export default function MissionsClient({
  missions,
  completions,
}: {
  missions: Mission[];
  completions: Completion[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MissionType>("solo");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredMissions = missions.filter((m) => m.type === activeTab);

  const getCompletionStatus = (missionId: string) => {
    return completions.find((c) => c.mission_id === missionId);
  };

  const handleStart = async (missionId: string) => {
    setLoading(missionId);
    try {
      const res = await fetch("/api/missions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId, proofUrl: "auto" }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || data.message || "Erreur lors de la validation");
      }
    } catch (error) {
      console.error("Failed to complete mission:", error);
      toast.error("Erreur réseau");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto">
      <BackButton href="/moi" />

      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">
          Missions KARMA
        </h1>
        <p className="text-[var(--foreground-muted)] text-sm">
          Accomplis des missions pour gagner des graines KARMA
        </p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(Object.keys(TAB_LABELS) as MissionType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] text-white"
                : "bg-[var(--kaia-soft)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredMissions.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-[var(--foreground-muted)]">
              Aucune mission disponible dans cette catégorie pour le moment.
            </p>
          </div>
        ) : (
          filteredMissions.map((mission) => {
            const completion = getCompletionStatus(mission.id);

            return (
              <div key={mission.id} className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{mission.title}</h3>
                    {mission.description && (
                      <p className="text-sm text-[var(--foreground-muted)]">
                        {mission.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--kaia-gold)]/20 text-[var(--kaia-gold)] text-xs font-medium">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{mission.tokens_reward}</span>
                  </div>
                </div>

                {mission.max_completions && (
                  <p className="text-xs text-[var(--foreground-muted)] mb-3">
                    Maximum {mission.max_completions} fois
                  </p>
                )}

                <div className="flex items-center gap-3">
                  {!completion ? (
                    <button
                      onClick={() => handleStart(mission.id)}
                      disabled={loading === mission.id}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading === mission.id ? "..." : "Commencer"}
                    </button>
                  ) : completion.status === "pending" ? (
                    <span className="px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                      En attente de validation
                    </span>
                  ) : completion.status === "approved" ? (
                    <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                      ✓ Validée · +{mission.tokens_reward} graines
                    </span>
                  ) : (
                    <>
                      <span className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                        Refusée
                      </span>
                      <button
                        onClick={() => handleStart(mission.id)}
                        disabled={loading === mission.id}
                        className="px-4 py-2 rounded-full bg-[var(--kaia-soft)] text-sm font-medium hover:bg-[var(--kaia-moon)]/20 transition-colors disabled:opacity-50"
                      >
                        Réessayer
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
