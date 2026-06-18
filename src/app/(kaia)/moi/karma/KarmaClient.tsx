"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Play } from "lucide-react";
import BackButton from "@/components/ui/BackButton";

type GameCategory = "transversal" | "pillar" | "communautaire" | "special";

interface Game {
  id: string;
  slug: string;
  title: string;
  category: GameCategory;
  tokens_reward: number;
  recurrence: string;
}

interface Progress {
  game_slug: string;
  completions: number;
  last_completed_at?: string;
  total_tokens?: number;
}

const CATEGORY_LABELS: Record<GameCategory, string> = {
  transversal: "Habitudes",
  pillar: "Piliers KAÏA",
  communautaire: "Communauté",
  special: "Défis",
};

const CATEGORY_ICONS: Record<GameCategory, string> = {
  transversal: "🌱",
  pillar: "🔥",
  communautaire: "🤝",
  special: "⚡",
};

export default function KarmaClient({
  games,
  progress,
  totalTokens,
}: {
  games: Game[];
  progress: Progress[];
  totalTokens: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = ["transversal", "pillar", "communautaire", "special"] as GameCategory[];

  const getProgress = (gameSlug: string) => {
    return progress.find((p) => p.game_slug === gameSlug);
  };

  const handlePlay = async (gameSlug: string) => {
    setLoading(gameSlug);
    setError(null);
    try {
      const res = await fetch("/api/karma/complete-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug }),
      });

      if (res.ok) {
        router.refresh();
      } else if (res.status === 409) {
        setError("Déjà complété aujourd'hui");
      } else {
        const data = await res.json();
        setError(data.error || "Erreur");
      }
    } catch (err) {
      console.error("Failed to complete game:", err);
      setError("Erreur réseau");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto">
      <BackButton href="/moi" />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-3xl font-semibold gradient-kaia-text">
            KARMA
          </h1>
          <span className="px-3 py-1.5 rounded-full bg-[var(--kaia-gold)]/20 text-[var(--kaia-gold)] text-xs font-medium">
            25 Jeux disponibles
          </span>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 mb-8 text-center">
        <div className="inline-flex items-center gap-3">
          <Coins className="w-8 h-8 text-[var(--kaia-gold)]" />
          <div className="text-left">
            <div className="font-display text-3xl font-semibold gradient-kaia-text">
              {totalTokens.toLocaleString()}
            </div>
            <div className="text-xs text-[var(--foreground-muted)]">
              Graines KARMA gagnées
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass rounded-2xl p-4 mb-6 bg-red-500/10 border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-8">
        {categories.map((category) => {
          const categoryGames = games.filter((g) => g.category === category);
          if (categoryGames.length === 0) return null;

          return (
            <div key={category}>
              <h2 className="font-display text-xl font-medium mb-4 flex items-center gap-2">
                <span>{CATEGORY_ICONS[category]}</span>
                <span>{CATEGORY_LABELS[category]}</span>
              </h2>

              <div className="space-y-3">
                {categoryGames.map((game) => {
                  const prog = getProgress(game.slug);

                  return (
                    <div
                      key={game.id}
                      className="glass rounded-2xl p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{CATEGORY_ICONS[category]}</span>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm mb-1">{game.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
                            <div className="flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              <span>{game.tokens_reward}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-[var(--kaia-soft)]">
                              {game.recurrence}
                            </span>
                            {prog && prog.completions > 0 && (
                              <span>{prog.completions}×</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePlay(game.slug)}
                        disabled={loading === game.slug}
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        {loading === game.slug ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
