"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Wind } from "lucide-react";
import SoulagementImmediat from "@/components/aurora/SoulagementImmediat";

export default function UrgencePage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (completed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-6">🌿</span>
        <h2 className="font-display text-2xl font-semibold text-[var(--kaia-moon)] mb-3">
          Bien joué
        </h2>
        <p className="text-sm text-[var(--foreground-muted)] mb-8 max-w-xs leading-relaxed">
          Ton système nerveux vient de recevoir un signal de sécurité.
          Reviens dès que tu en as besoin.
        </p>
        <button
          onClick={() => router.push("/aurora")}
          className="glass rounded-full px-8 py-3 text-sm font-medium text-[var(--kaia-rose)] hover:bg-white/10 transition-all"
        >
          Retour à AURORA
        </button>
      </div>
    );
  }

  if (started) {
    return (
      <div className="min-h-screen">
        <SoulagementImmediat onComplete={() => setCompleted(true)} />
      </div>
    );
  }

  return (
    <div className="px-5 py-8 max-w-md mx-auto">
      <button
        onClick={() => router.push("/aurora")}
        className="p-1.5 glass rounded-xl hover:bg-white/10 transition-all mb-8 flex items-center gap-2 text-sm text-[var(--foreground-muted)]"
      >
        <ChevronLeft size={18} strokeWidth={1.5} />
        AURORA
      </button>

      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Wind size={20} className="text-[var(--kaia-rose)]" strokeWidth={1.5} />
          <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-widest">
            Soulagement Immédiat
          </p>
        </div>
        <h1
          className="font-display text-3xl font-semibold mb-2"
          style={{ color: "var(--kaia-rose)" }}
        >
          3 minutes
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
          Protocole 4-7-8 simplifié. Sans audio, sans lumières stroboscopiques.
          Pour les moments de crise, d&apos;anxiété ou de douleur cyclique.
        </p>
      </header>

      <div className="glass rounded-2xl p-6 mb-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">🫁</span>
          <div>
            <p className="text-sm font-medium">Inspiration · 4 secondes</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              Par le nez, lentement
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-xl">⏸</span>
          <div>
            <p className="text-sm font-medium">Rétention · 7 secondes</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              Retiens sans forcer
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-xl">🌬️</span>
          <div>
            <p className="text-sm font-medium">Expiration · 8 secondes</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              Par la bouche, complètement
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-[var(--foreground-muted)] text-center mb-6 leading-relaxed">
        Si tu as des antécédents d&apos;épilepsie ou de troubles respiratoires, consulte
        ton médecin avant de pratiquer des exercices de rétention du souffle.
      </p>

      <button
        onClick={() => setStarted(true)}
        className="w-full rounded-2xl px-6 py-4 text-sm font-semibold text-[var(--kaia-night)] transition-all"
        style={{
          background:
            "linear-gradient(135deg, var(--kaia-rose) 0%, var(--kaia-moon) 100%)",
        }}
      >
        Commencer · 3 rép.
      </button>
    </div>
  );
}
