"use client";

import { useState } from "react";

interface CycleInputProps {
  onSaved: () => void;
  currentStart?: string;
}

export default function CycleInput({ onSaved, currentStart }: CycleInputProps) {
  const [startDate, setStartDate] = useState(currentStart || "");
  const [cycleDuration, setCycleDuration] = useState(28);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate) {
      setError("Merci de sélectionner une date");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cycle/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, cycleDuration }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-cormorant font-semibold text-kaia-moon">
          Configure ton cycle
        </h2>
        <p className="text-white/70 text-sm">
          Indique le premier jour de tes dernières règles pour suivre ton cycle
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date input */}
        <div className="space-y-2">
          <label className="text-sm text-white/80">Début des dernières règles</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            required
            className="
              w-full px-4 py-3 rounded-xl
              bg-white/5 border border-white/10
              text-white placeholder:text-white/40
              focus:outline-none focus:ring-2 focus:ring-kaia-moon/50
              transition-all
            "
          />
        </div>

        {/* Cycle duration slider */}
        <div className="space-y-2">
          <label className="text-sm text-white/80">
            Durée moyenne du cycle: <span className="text-kaia-moon font-semibold">{cycleDuration} jours</span>
          </label>
          <input
            type="range"
            min="20"
            max="35"
            step="1"
            value={cycleDuration}
            onChange={(e) => setCycleDuration(Number(e.target.value))}
            className="w-full accent-kaia-moon"
          />
          <div className="flex justify-between text-xs text-white/50">
            <span>20 jours</span>
            <span>35 jours</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="
            w-full px-6 py-3 rounded-xl font-medium
            bg-gradient-to-r from-kaia-moon to-kaia-gold
            text-kaia-primary
            hover:shadow-[0_0_30px_rgba(200,185,240,0.3)]
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isLoading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
