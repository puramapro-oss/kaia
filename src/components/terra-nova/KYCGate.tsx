"use client";

import { useState } from "react";
import { ShieldCheck, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

/**
 * Gate KYC — la conversion/retrait de Graines exige une vérification d'identité
 * (Stripe Identity, inclus dans Connect). La vérification réelle est branchée
 * au déploiement ; ici on déclenche la demande de lien.
 */
export default function KYCGate({ kycCompleted }: { kycCompleted: boolean }) {
  const [busy, setBusy] = useState(false);

  if (kycCompleted) {
    return (
      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <BadgeCheck className="w-5 h-5 text-green-400" />
        <p className="text-sm">Identité vérifiée — tu peux convertir tes Graines.</p>
      </div>
    );
  }

  async function startKyc() {
    setBusy(true);
    try {
      const res = await fetch("/api/terra-nova/exchange-graines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "kyc_start" }),
      });
      const data = await res.json();
      if (data.kycUrl) {
        window.location.href = data.kycUrl;
        return;
      }
      toast(data.message ?? "La vérification d'identité sera bientôt disponible.");
    } catch {
      toast.error("Connexion impossible. Réessaie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-5 h-5 text-[var(--kaia-moon)]" />
        <h3 className="font-medium">Vérifier mon identité</h3>
      </div>
      <p className="text-xs text-[var(--foreground-muted)] mb-4">
        Pour convertir tes Graines en euros, une vérification d&apos;identité est
        requise (sécurité + conformité). Une seule fois.
      </p>
      <button
        onClick={startKyc}
        disabled={busy}
        className="px-5 py-3 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] text-sm font-medium disabled:opacity-50"
      >
        {busy ? "..." : "Commencer la vérification"}
      </button>
    </div>
  );
}
