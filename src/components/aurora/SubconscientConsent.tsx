"use client";
import { useState } from "react";
import { Brain, X, ShieldCheck } from "lucide-react";

interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

export default function SubconscientConsent({ onAccept, onDecline }: Props) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    if (!checked) return;
    setLoading(true);
    try {
      const res = await fetch("/api/aurora/subconscient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "consent", triggered_by_user: true }),
      });
      if (!res.ok) throw new Error("consent_failed");
      onAccept();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onDecline} />
      <div className="relative glass rounded-3xl p-7 max-w-sm w-full space-y-5">
        <button
          onClick={onDecline}
          className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-xl transition-all"
        >
          <X size={16} className="text-[var(--foreground-muted)]" />
        </button>

        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            <Brain size={20} style={{ color: "var(--kaia-moon)" }} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Mode Subconscient</h2>
            <p className="text-xs text-[var(--foreground-muted)]">Activation manuelle requise</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-[var(--foreground-muted)] leading-relaxed">
          <p>
            Ce mode propose une respiration guidée à basse fréquence (delta/thêta) pour favoriser
            un état de conscience modifiée légère.
          </p>
          <p>
            Il est conçu pour être utilisé dans un environnement calme, en position allongée,
            sans conduire ni utiliser de machines.
          </p>
          <p className="text-xs font-medium text-[var(--foreground-muted)]">
            Non recommandé si tu as des antécédents d&apos;épilepsie, troubles dissociatifs,
            ou si tu prends des médicaments psychotropes.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div
            onClick={() => setChecked(!checked)}
            className={`mt-0.5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
              checked
                ? "border-[var(--kaia-moon)] bg-[var(--kaia-moon)]/20"
                : "border-white/20 hover:border-white/40"
            }`}
          >
            {checked && <ShieldCheck size={12} className="text-[var(--kaia-moon)]" />}
          </div>
          <span className="text-xs text-[var(--foreground-muted)] leading-relaxed">
            Je comprends le fonctionnement de ce mode et j&apos;active cette session
            de mon propre choix.
          </span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-[var(--foreground-muted)] hover:bg-white/5 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleAccept}
            disabled={!checked || loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-[var(--kaia-night)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: checked
                ? "linear-gradient(135deg, var(--kaia-moon) 0%, #7C3AED 100%)"
                : "rgba(255,255,255,0.1)",
            }}
          >
            {loading ? "…" : "Activer"}
          </button>
        </div>
      </div>
    </div>
  );
}
