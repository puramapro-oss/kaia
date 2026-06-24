"use client";

import { useState } from "react";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Impossible d'ouvrir le portail de facturation.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80">
          Réglages
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Abonnement & Facturation
        </h1>
        <p className="text-white/55">
          Gère ton plan VITAE, tes factures et ton mode de paiement.
        </p>
      </header>

      <GlassCard className="space-y-5">
        <div className="flex items-start gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "var(--color-kaia-gold)26", color: "var(--color-kaia-gold)" }}
          >
            <CreditCard className="w-5 h-5" strokeWidth={1.6} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display text-lg text-white">Portail Stripe</p>
            <p className="text-sm text-white/55 mt-0.5">
              Change de plan, télécharge tes factures, modifie ta carte ou annule ton abonnement.
            </p>
          </div>
        </div>

        <Button
          onClick={openPortal}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          {loading ? "Ouverture…" : "Ouvrir le portail de facturation"}
        </Button>
      </GlassCard>

      <GlassCard className="text-sm text-white/55 leading-relaxed space-y-2">
        <p>
          <strong className="text-white/80">Annulation :</strong> tu peux annuler à tout moment.
          L'accès reste actif jusqu'à la fin de la période payée.
        </p>
        <p>
          <strong className="text-white/80">Rétractation :</strong> conformément à l'art. L221-28
          3° du Code de la consommation, le droit de rétractation de 14 jours ne s'applique pas
          aux contenus numériques dont l'exécution a commencé.
        </p>
        <p>
          <strong className="text-white/80">Facturation :</strong> SASU PURAMA — 8 rue Chapelle,
          25560 Frasne — TVA non applicable, art. 293B CGI.
        </p>
      </GlassCard>
    </div>
  );
}
