"use client";

import { useMemo, useState } from "react";
import { Euro, Sprout } from "lucide-react";
import { toast } from "sonner";
import { quoteWithdrawal, MIN_WITHDRAWAL_CENTS } from "@/lib/wallet/fees";
import { GRAINE_TO_EUR } from "@/lib/constants";
import ConnectOnboarding from "@/components/wallet/ConnectOnboarding";
import BackButton from "@/components/ui/BackButton";

export default function WalletClient({
  balanceCents,
  grainesBalance,
  connectOnboarded,
}: {
  balanceCents: number;
  grainesBalance: number;
  connectOnboarded: boolean;
}) {
  const [amountEur, setAmountEur] = useState("20");
  const [busy, setBusy] = useState(false);

  const quote = useMemo(() => {
    const cents = Math.round(parseFloat(amountEur || "0") * 100);
    return quoteWithdrawal(cents);
  }, [amountEur]);

  const overBalance = quote ? quote.amountCents > balanceCents : false;

  async function withdraw() {
    if (!quote || overBalance) return;
    setBusy(true);
    try {
      const res = await fetch("/api/karma/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: quote.amountCents }),
      });
      const data = await res.json();
      toast(data.message ?? (res.ok ? "Demande enregistrée." : data.error ?? "Retrait impossible."));
    } catch {
      toast.error("Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28 space-y-6">
      <BackButton href="/moi" />

      <div>
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">Mon wallet</h1>
        <p className="text-[var(--foreground-muted)] text-sm">Tes gains KARMA et tes Graines</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 text-center">
          <Euro className="w-6 h-6 text-[var(--kaia-gold)] mx-auto mb-2" />
          <div className="font-display text-2xl font-semibold gradient-kaia-text">
            {(balanceCents / 100).toFixed(2)}€
          </div>
          <div className="text-xs text-[var(--foreground-muted)]">Solde retirable</div>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <Sprout className="w-6 h-6 text-[var(--kaia-moon)] mx-auto mb-2" />
          <div className="font-display text-2xl font-semibold gradient-kaia-text">{grainesBalance}</div>
          <div className="text-xs text-[var(--foreground-muted)]">
            Graines · ≈ {(grainesBalance * GRAINE_TO_EUR).toFixed(2)}€
          </div>
        </div>
      </div>

      <ConnectOnboarding onboarded={connectOnboarded} />

      <div className="glass rounded-2xl p-6">
        <h2 className="font-medium mb-4">Retirer mes gains</h2>
        <div className="flex items-center gap-3 mb-3">
          <input
            type="number"
            min={MIN_WITHDRAWAL_CENTS / 100}
            value={amountEur}
            onChange={(e) => setAmountEur(e.target.value)}
            className="flex-1 bg-[var(--kaia-soft)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kaia-moon)]/40"
          />
          <span className="text-sm text-[var(--foreground-muted)]">€</span>
        </div>

        {!quote ? (
          <p className="text-xs text-[var(--foreground-muted)]">Montant minimum : 20€.</p>
        ) : (
          <div className="text-xs text-[var(--foreground-muted)] space-y-1">
            <div className="flex justify-between"><span>Frais ({quote.ratePct}%)</span><span>-{(quote.feeCents / 100).toFixed(2)}€</span></div>
            <div className="flex justify-between font-medium text-[var(--foreground)]"><span>Tu reçois</span><span>{(quote.netCents / 100).toFixed(2)}€</span></div>
            {overBalance && <p className="text-red-400">Solde insuffisant.</p>}
          </div>
        )}

        <button
          onClick={withdraw}
          disabled={!quote || overBalance || busy}
          className="w-full mt-4 py-3 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] text-sm font-medium disabled:opacity-50"
        >
          {busy ? "..." : "Demander le retrait"}
        </button>
        <p className="text-[10px] text-[var(--foreground-muted)] mt-3">
          Frais dégressifs : 20€ → 8,7% · 50€ → 4,8% · 200€+ → 3,0%. Retrait bloqué 30j après une prime.
        </p>
      </div>
    </div>
  );
}
