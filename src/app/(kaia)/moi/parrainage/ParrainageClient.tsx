"use client";

import { useState } from "react";
import { Copy, Share2, Euro, Users, CheckCircle, Clock } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import BackButton from "@/components/ui/BackButton";

interface Referral {
  id: string;
  status: string;
  created_at: string;
  total_commission_cents: number;
}

export default function ParrainageClient({
  referralLink,
  totalReferrals,
  totalEarnings,
  recentReferrals,
}: {
  referralLink: string;
  totalReferrals: number;
  totalEarnings: number;
  recentReferrals: Referral[];
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(referralLink);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Rejoins-moi sur KAÏA",
          text: "Découvre KAÏA, ton assistante santé IA personnalisée",
          url: referralLink,
        });
      } catch (error) {
        console.error("Failed to share:", error);
      }
    } else {
      handleCopy();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto">
      <BackButton href="/moi" />

      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">
          Parrainage
        </h1>
        <p className="text-[var(--foreground-muted)] text-sm">
          Invite tes amies et gagne des commissions
        </p>
      </div>

      <div className="glass rounded-2xl p-5 mb-6">
        <label className="text-xs text-[var(--foreground-muted)] mb-2 block">
          Ton lien de parrainage
        </label>
        <div className="flex gap-2">
          <div className="flex-1 bg-[var(--kaia-soft)] rounded-xl px-4 py-3 text-sm font-mono truncate">
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className="w-12 h-12 rounded-xl bg-[var(--kaia-moon)]/20 hover:bg-[var(--kaia-moon)]/30 transition-colors flex items-center justify-center shrink-0"
          >
            {copied ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <Copy className="w-5 h-5 text-[var(--kaia-moon)]" />
            )}
          </button>
          <button
            onClick={handleShare}
            className="w-12 h-12 rounded-xl bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] hover:scale-105 transition-transform flex items-center justify-center shrink-0"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-2xl p-5 text-center">
          <Users className="w-6 h-6 text-[var(--kaia-moon)] mx-auto mb-2" />
          <div className="font-display text-2xl font-semibold gradient-kaia-text mb-1">
            {totalReferrals}
          </div>
          <div className="text-xs text-[var(--foreground-muted)]">Filleules</div>
        </div>

        <div className="glass rounded-2xl p-5 text-center">
          <Euro className="w-6 h-6 text-[var(--kaia-gold)] mx-auto mb-2" />
          <div className="font-display text-2xl font-semibold gradient-kaia-text mb-1">
            €{totalEarnings.toFixed(2)}
          </div>
          <div className="text-xs text-[var(--foreground-muted)]">Commissions gagnées</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 mb-6">
        <h2 className="font-medium mb-2">Comment ça marche ?</h2>
        <p className="text-sm text-[var(--foreground-muted)]">
          Gagne 50% de la 1ère mensualité de chaque filleule + commissions récurrentes à vie
        </p>
      </div>

      {recentReferrals.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h2 className="font-medium mb-4">Filleules récentes</h2>
          <div className="space-y-3">
            {recentReferrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between py-2 border-b border-[var(--kaia-moon)]/10 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] flex items-center justify-center text-xs font-medium">
                    {referral.id.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      Utilisat***{referral.id.slice(-3)}
                    </div>
                    <div className="text-xs text-[var(--foreground-muted)]">
                      {formatDate(referral.created_at)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {referral.status === "active" ? (
                    <div className="flex items-center gap-1.5 text-green-400 text-xs">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-yellow-400 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>En attente</span>
                    </div>
                  )}
                  {referral.total_commission_cents > 0 && (
                    <div className="text-xs text-[var(--kaia-gold)] font-medium mt-1">
                      +€{(referral.total_commission_cents / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
