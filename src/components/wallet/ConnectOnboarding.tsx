"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

/**
 * Onboarding Stripe Connect Express (Embedded Components).
 *
 * DÉFÉRÉ (pending deploy + dep `@stripe/react-connect-js`) : à l'activation,
 * remplacer le bouton par `<ConnectAccountOnboarding>` monté via
 * `loadConnectAndInitialize`. Pour l'instant, déclenche la route d'onboarding
 * qui renverra une URL/clientSecret.
 */
export default function ConnectOnboarding({ onboarded }: { onboarded: boolean }) {
  const [busy, setBusy] = useState(false);

  if (onboarded) {
    return (
      <div className="glass rounded-2xl p-4 text-sm text-[var(--foreground-muted)]">
        Compte de paiement configuré ✓
      </div>
    );
  }

  async function start() {
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/connect/onboarding", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast(data.message ?? "La configuration des paiements sera bientôt disponible.");
    } catch {
      toast.error("Connexion impossible. Réessaie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={start}
      disabled={busy}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[var(--kaia-moon)]/20 hover:bg-[var(--kaia-moon)]/30 transition-colors text-sm font-medium disabled:opacity-50"
    >
      <CreditCard className="w-4 h-4" />
      {busy ? "..." : "Configurer mes paiements"}
    </button>
  );
}
