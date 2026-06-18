"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MOODS = [
  { emoji: "😫", label: "Difficile", value: 1 },
  { emoji: "😔", label: "Bas", value: 2 },
  { emoji: "😐", label: "Neutre", value: 3 },
  { emoji: "😊", label: "Bien", value: 4 },
  { emoji: "🥰", label: "Radieuse", value: 5 },
];

const SYMPTOMS = [
  "Crampes",
  "Fatigue",
  "Maux de tête",
  "Ballonnements",
  "Irritabilité",
  "Anxiété",
  "Insomnie",
  "Sensibilité",
  "Fringales",
  "Acné",
  "Douleur dos",
  "Nausées",
];

const FLOW_INTENSITY = [
  { label: "Aucun flux", value: 0 },
  { label: "Léger", value: 1 },
  { label: "Moyen", value: 2 },
  { label: "Abondant", value: 3 },
  { label: "Très abondant", value: 4 },
];

export default function JournalPage() {
  const router = useRouter();
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState(3);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [flowIntensity, setFlowIntensity] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [lunaInsight, setLunaInsight] = useState("");

  function toggleSymptom(symptom: string) {
    setSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mood === null) {
      setError("Merci de sélectionner ton humeur");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cycle/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,
          energy,
          symptoms,
          flowIntensity,
          notes,
          date: new Date().toISOString().split("T")[0],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      const data = await res.json();
      setLunaInsight(data.lunaInsight || "");
      setShowSuccess(true);

      setTimeout(() => {
        router.push("/cycle");
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }

  if (showSuccess) {
    return (
      <div className="px-5 py-8 max-w-2xl mx-auto space-y-6">
        <div className="bg-white/5 backdrop-blur-xl border border-green-500/30 rounded-2xl p-8 space-y-6 text-center">
          <div className="text-5xl">✨</div>
          <h2 className="text-2xl font-cormorant font-semibold text-kaia-moon">
            Entrée enregistrée !
          </h2>

          {lunaInsight && (
            <div className="bg-kaia-moon/10 border border-kaia-moon/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🌙</span>
                <h3 className="text-lg font-cormorant font-semibold text-kaia-moon">
                  Insight de LUNA
                </h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">{lunaInsight}</p>
            </div>
          )}

          <p className="text-white/60 text-sm">Redirection vers ton cycle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="font-cormorant text-4xl font-semibold text-kaia-moon">
          Journal du jour
        </h1>
        <p className="text-white/70 text-sm">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mood */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-cormorant font-semibold text-kaia-moon">
            Comment te sens-tu aujourd'hui ?
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center gap-1
                  transition-all
                  ${
                    mood === m.value
                      ? "bg-kaia-moon/20 ring-2 ring-kaia-moon"
                      : "bg-white/5 hover:bg-white/10"
                  }
                `}
              >
                <span className="text-3xl">{m.emoji}</span>
                <span className="text-xs text-white/60">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-cormorant font-semibold text-kaia-moon">
            Niveau d'énergie (1-5)
          </h3>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="flex-1 accent-kaia-gold"
            />
            <div className="flex gap-1">
              {Array.from({ length: energy }, (_, i) => (
                <span key={i} className="text-kaia-gold">
                  ⭐
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Symptoms */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-cormorant font-semibold text-kaia-moon">
            Symptômes (si présents)
          </h3>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map((symptom) => (
              <button
                key={symptom}
                type="button"
                onClick={() => toggleSymptom(symptom)}
                className={`
                  px-4 py-2 rounded-full text-sm transition-all
                  ${
                    symptoms.includes(symptom)
                      ? "bg-kaia-rose/20 text-kaia-rose border border-kaia-rose/40"
                      : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                  }
                `}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        {/* Flow intensity */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-cormorant font-semibold text-kaia-moon">
            Intensité du flux (si menstruation)
          </h3>
          <div className="space-y-2">
            {FLOW_INTENSITY.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFlowIntensity(f.value)}
                className={`
                  w-full px-4 py-3 rounded-xl text-sm text-left transition-all
                  ${
                    flowIntensity === f.value
                      ? "bg-kaia-rose/20 text-kaia-rose border border-kaia-rose/40"
                      : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                  }
                `}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-cormorant font-semibold text-kaia-moon">
            Notes personnelles (chiffrées)
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ce que je ressens, ce que j'ai remarqué..."
            rows={4}
            className="
              w-full px-4 py-3 rounded-xl resize-none
              bg-white/5 border border-white/10
              text-white placeholder:text-white/40
              focus:outline-none focus:ring-2 focus:ring-kaia-moon/50
            "
          />
          <p className="text-xs text-white/50">
            🔒 Tes notes sont chiffrées de bout en bout
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="
            w-full px-6 py-4 rounded-xl font-medium
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
