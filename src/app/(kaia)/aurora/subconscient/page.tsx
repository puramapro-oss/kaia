"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Brain } from "lucide-react";
import SubconscientConsent from "@/components/aurora/SubconscientConsent";
import AuroraSession from "@/components/aurora/AuroraSession";
import { AURORA_PROTOCOLS } from "@/lib/aurora/protocols";

type PageState = "loading" | "consent_required" | "ready" | "session" | "done";

export default function SubconscientPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>("loading");

  useEffect(() => {
    fetch("/api/aurora/subconscient")
      .then((r) => r.json())
      .then((d) => {
        setState(d.hasConsented ? "ready" : "consent_required");
      })
      .catch(() => setState("consent_required"));
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--kaia-moon)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-6">🌌</span>
        <h2 className="font-display text-2xl font-semibold text-[var(--kaia-moon)] mb-3">
          Retour à la surface
        </h2>
        <p className="text-sm text-[var(--foreground-muted)] mb-8 max-w-xs leading-relaxed">
          Prends le temps de revenir pleinement avant de te lever.
        </p>
        <button
          onClick={() => router.push("/aurora")}
          className="glass rounded-full px-8 py-3 text-sm font-medium text-[var(--kaia-moon)] hover:bg-white/10 transition-all"
        >
          Retour à AURORA
        </button>
      </div>
    );
  }

  if (state === "session") {
    return (
      <div className="min-h-screen">
        <AuroraSession
          protocol={AURORA_PROTOCOLS.sleep}
          onComplete={() => setState("done")}
        />
      </div>
    );
  }

  return (
    <>
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
            <Brain size={20} className="text-[var(--kaia-moon)]" strokeWidth={1.5} />
            <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-widest">
              Mode Subconscient
            </p>
          </div>
          <h1
            className="font-display text-3xl font-semibold mb-2"
            style={{ color: "var(--kaia-moon)" }}
          >
            Protocole Delta
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
            Respiration guidée à fréquence basse pour induire un état delta/thêta.
            Réservé à un environnement calme, position allongée.
          </p>
        </header>

        <div className="glass rounded-2xl p-6 mb-6 space-y-3">
          {[
            { emoji: "🛌", label: "Allonge-toi dans un endroit calme" },
            { emoji: "🔇", label: "Mode Ne pas déranger activé" },
            { emoji: "⏱️", label: "Durée · ~10 minutes" },
            { emoji: "🚫", label: "Ne pas conduire ni utiliser de machines" },
          ].map(({ emoji, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xl">{emoji}</span>
              <p className="text-sm">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-[var(--foreground-muted)] text-center mb-6 leading-relaxed">
          Ceci n&apos;est pas un outil médical. Pour toute pathologie du sommeil
          ou trouble dissociatif, consulte un professionnel de santé.
        </p>

        <button
          onClick={() => setState("consent_required")}
          className="w-full rounded-2xl px-6 py-4 text-sm font-semibold text-[var(--kaia-night)] transition-all"
          style={{
            background:
              "linear-gradient(135deg, var(--kaia-moon) 0%, #7C3AED 100%)",
          }}
        >
          Activer le Mode Subconscient
        </button>
      </div>

      {state === "consent_required" && (
        <SubconscientConsent
          onAccept={() => setState("session")}
          onDecline={() => setState("ready")}
        />
      )}
    </>
  );
}
