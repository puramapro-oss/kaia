/**
 * `/influencer/payouts` — liste payouts + form demande de versement.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Banknote, Clock, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard, GlassCardHeading } from "@/components/ui/Card";
import { PayoutRequestForm } from "@/components/influencer/PayoutRequestForm";

export const dynamic = "force-dynamic";

function formatEur(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  });
}

const STATUS_LABELS: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "En attente", icon: Clock, color: "text-[var(--color-kaia-gold)]" },
  processing: { label: "En cours", icon: Banknote, color: "text-[var(--color-kaia-accent)]" },
  paid: { label: "Versé", icon: CheckCircle2, color: "text-[var(--color-kaia-green-soft)]" },
  failed: { label: "Échec", icon: XCircle, color: "text-[var(--color-kaia-terracotta)]" },
};

export default async function InfluencerPayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/influencer/payouts");

  const { data: link } = await supabase
    .from("influencer_links")
    .select("id")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  let availableCents = 0;
  if (link) {
    const { data: conversions } = await supabase
      .from("influencer_conversions")
      .select("commission_cents")
      .eq("link_id", link.id)
      .eq("status", "pending");
    availableCents = (conversions ?? []).reduce(
      (s, c) => s + (c.commission_cents ?? 0),
      0
    );
  }

  const { data: payouts } = await supabase
    .from("influencer_payouts")
    .select("id, amount_cents, status, iban, paid_at, created_at, treezor_transaction_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link
        href="/influencer"
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white wellness-anim"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à l'espace
      </Link>

      <GlassCardHeading
        eyebrow="Versements"
        title="Mes paiements"
        subtitle="Demande un versement IBAN dès 50 €. Validation Tissma puis virement (Treezor à venir)."
      />

      <GlassCard className="bg-[rgba(244,196,48,0.04)] border border-[var(--color-kaia-gold)]/20">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-kaia-gold)]/80 mb-2">
          Disponible à demander
        </p>
        <p className="font-display text-4xl text-white tabular-nums mb-4">
          {formatEur(availableCents)}
        </p>
        {availableCents >= 5000 ? (
          <PayoutRequestForm availableCents={availableCents} />
        ) : (
          <p className="text-sm text-white/60">
            Minimum requis : 50,00 €. Continue de partager ton lien pour atteindre le seuil.
          </p>
        )}
      </GlassCard>

      <div className="space-y-3">
        <h2 className="font-display text-xl text-white">Historique</h2>
        {!payouts || payouts.length === 0 ? (
          <GlassCard>
            <p className="text-sm text-white/60">Aucun versement encore. Demande ton premier paiement quand tu atteins 50 €.</p>
          </GlassCard>
        ) : (
          payouts.map((p) => {
            const meta = STATUS_LABELS[p.status] ?? STATUS_LABELS.pending;
            const Icon = meta.icon;
            return (
              <GlassCard key={p.id} className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <Icon className={`w-5 h-5 ${meta.color}`} />
                  <div>
                    <p className="font-display text-lg text-white tabular-nums">
                      {formatEur(p.amount_cents)}
                    </p>
                    <p className="text-xs text-white/50">
                      Demandé le {new Date(p.created_at).toLocaleDateString("fr-FR")}
                      {p.iban ? ` · IBAN ****${p.iban.slice(-4)}` : null}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
