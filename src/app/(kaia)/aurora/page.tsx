"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wind } from "lucide-react";
import { AURORA_PROTOCOLS, AuroraVariant } from "@/lib/aurora/protocols";
import AuroraSession from "@/components/aurora/AuroraSession";

export default function AuroraPage() {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState<AuroraVariant | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [karmaEarned, setKarmaEarned] = useState(0);

  const variants: Array<{ variant: AuroraVariant; color: string }> = [
    { variant: "calm", color: "#90C0E8" },
    { variant: "focus", color: "#E8C87A" },
    { variant: "sleep", color: "#5A5090" },
    { variant: "ignite", color: "#E07070" },
  ];

  function handleSessionComplete() {
    setSelectedVariant(null);
    setShowConfetti(true);
    setKarmaEarned(5); // Example: 5 KARMA tokens per session
    setTimeout(() => {
      setShowConfetti(false);
      setKarmaEarned(0);
    }, 3000);
  }

  return (
    <div className="px-5 py-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Wind size={22} className="text-kaia-rose" strokeWidth={1.5} />
          <p className="text-xs text-white/60 uppercase tracking-widest">
            Respiration OMEGA guidée
          </p>
        </div>
        <h1 className="font-cormorant text-4xl font-semibold text-kaia-rose">AURORA</h1>
        <p className="text-white/70 text-sm mt-2">
          5 phases de respiration guidée pour retrouver ton centre
        </p>
      </header>

      {/* Emergency button */}
      <button
        onClick={() => router.push("/aurora/urgence")}
        className="
          w-full mb-6 px-6 py-4 rounded-2xl
          bg-gradient-to-r from-red-500/20 to-kaia-rose/20
          border border-red-500/30
          text-red-300 font-medium
          hover:shadow-[0_0_30px_rgba(240,80,80,0.2)]
          transition-all
        "
      >
        🚨 Mode Urgence — Soulagement Immédiat (3 min)
      </button>

      {/* Variant cards */}
      <div className="grid grid-cols-2 gap-4">
        {variants.map(({ variant, color }) => {
          const protocol = AURORA_PROTOCOLS[variant];
          return (
            <button
              key={variant}
              onClick={() => setSelectedVariant(variant)}
              className="
                bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-6
                hover:bg-white/10 hover:border-white/20
                transition-all duration-300 group text-left
              "
              style={{
                boxShadow: `0 0 20px ${color}20`,
              }}
            >
              <div className="space-y-3">
                <span className="text-4xl">{protocol.emoji}</span>
                <div>
                  <h3 className="font-cormorant text-xl font-semibold text-white group-hover:text-kaia-gold transition-colors">
                    {protocol.label}
                  </h3>
                  <p className="text-sm text-white/60 mt-1">{protocol.tagline}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>{protocol.totalDurationMin} min</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-6 mt-6">
        <p className="text-sm text-white/70 leading-relaxed">
          <strong className="text-kaia-moon">AURORA OMEGA</strong> — Protocole de respiration guidée en 5 phases
          (Armement → Double Soupir → Résonance Core → Omega Lock → Glide Out). Chaque variant est adapté à un objectif
          spécifique. <span className="text-kaia-rose">Respiration pure, 0 lumière clignotante, safe pour épilepsie.</span>
        </p>
      </div>

      {/* Session modal */}
      {selectedVariant && (
        <AuroraSession
          protocol={AURORA_PROTOCOLS[selectedVariant]}
          onComplete={handleSessionComplete}
        />
      )}

      {/* Confetti success */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="bg-kaia-moon/20 backdrop-blur-xl border border-kaia-moon/40 rounded-2xl px-8 py-6 space-y-2 text-center">
            <div className="text-5xl animate-bounce">✨</div>
            <h3 className="text-2xl font-cormorant font-semibold text-kaia-moon">
              Session terminée !
            </h3>
            <p className="text-white/70">
              Tu as gagné <span className="text-kaia-gold font-semibold">{karmaEarned} KARMA</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
