"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trophy, Users, Calendar } from "lucide-react";
import Link from "next/link";
import BackButton from "@/components/ui/BackButton";

type Frequency = "weekly" | "monthly" | "annual";

interface Contest {
  id: string;
  title: string;
  prize_pool_cents: number;
  end_at: string;
  status: string;
  entries_count: number;
}

interface Entry {
  contest_id: string;
  created_at: string;
}

const TAB_LABELS: Record<Frequency, string> = {
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  annual: "Annuel",
};

export default function ConcoursClient({
  contests,
  userEntries,
}: {
  contests: Record<string, Contest | null>;
  userEntries: Entry[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Frequency>("weekly");
  const [loading, setLoading] = useState(false);

  const currentContest = contests[activeTab];
  const hasEntered = currentContest
    ? userEntries.some((e) => e.contest_id === currentContest.id)
    : false;

  const getDaysRemaining = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    return days > 0 ? days : 0;
  };

  const handleEnter = async () => {
    if (!currentContest) return;

    setLoading(true);
    try {
      const res = await fetch("/api/contests/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestId: currentContest.id }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || data.message || "Erreur lors de l'inscription");
      }
    } catch (error) {
      console.error("Failed to enter contest:", error);
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto">
      <BackButton href="/moi" />

      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">
          Concours KARMA
        </h1>
        <p className="text-[var(--foreground-muted)] text-sm">
          Participe aux tirages au sort pour gagner des prix
        </p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(Object.keys(TAB_LABELS) as Frequency[]).map((tab) => (
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

      {currentContest ? (
        <div className="glass rounded-2xl p-6 space-y-6">
          <div className="text-center">
            <Trophy className="w-12 h-12 text-[var(--kaia-gold)] mx-auto mb-4" />
            <h2 className="font-display text-2xl font-semibold mb-2">
              {currentContest.title}
            </h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--kaia-gold)]/20 text-[var(--kaia-gold)] font-bold text-xl">
              €{(currentContest.prize_pool_cents / 100).toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-strong rounded-xl p-4 text-center">
              <Calendar className="w-5 h-5 text-[var(--kaia-moon)] mx-auto mb-2" />
              <div className="text-xs text-[var(--foreground-muted)] mb-1">
                Se termine dans
              </div>
              <div className="font-medium">
                {getDaysRemaining(currentContest.end_at)} jours
              </div>
            </div>

            <div className="glass-strong rounded-xl p-4 text-center">
              <Users className="w-5 h-5 text-[var(--kaia-moon)] mx-auto mb-2" />
              <div className="text-xs text-[var(--foreground-muted)] mb-1">
                Participants
              </div>
              <div className="font-medium">{currentContest.entries_count || 0}</div>
            </div>
          </div>

          {hasEntered ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/20 text-green-400 font-medium">
                ✓ Inscrite
              </div>
            </div>
          ) : (
            <button
              onClick={handleEnter}
              disabled={loading}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
            >
              {loading ? "..." : "Participer"}
            </button>
          )}

          <div className="pt-4 border-t border-[var(--kaia-moon)]/20">
            <p className="text-xs text-[var(--foreground-muted)] mb-2">
              Les concours sont régis par un tirage au sort équitable, certifié OpenTimestamps.
            </p>
            <Link
              href="/legal/contests-rules"
              className="text-xs text-[var(--kaia-moon)] hover:underline"
            >
              Règlement complet →
            </Link>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-8 text-center">
          <Trophy className="w-12 h-12 text-[var(--foreground-muted)] mx-auto mb-4 opacity-40" />
          <p className="text-[var(--foreground-muted)]">
            Prochain concours bientôt — reviens la semaine prochaine
          </p>
        </div>
      )}
    </div>
  );
}
