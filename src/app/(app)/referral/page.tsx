/**
 * `/referral` — espace parrainage utilisateur particulier (BRIEF §10).
 *
 *  - Lien personnel `/r/<referral_code>`
 *  - Stats : nb filleuls actifs / pending / expired
 *  - Bonus filleul rappelé
 *  - Liste 50 derniers filleuls (anonymisée — pas d'email visible)
 */
import { redirect } from "next/navigation";
import { Heart, Users, Coins, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard, GlassCardHeading } from "@/components/ui/Card";
import { CopyTextButton } from "@/components/influencer/CopyTextButton";
import {
  REFERRAL_FIRST_PERCENT,
  REFERRAL_RECURRING_PERCENT,
  REFERRAL_REFEREE_WELCOME_TOKENS,
} from "@/lib/referral/commission-rules";

export const dynamic = "force-dynamic";

const APP_HOST = process.env.NEXT_PUBLIC_APP_URL ?? "https://kaia.purama.dev";

function formatEur(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  });
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: {
    label: "Actif",
    className:
      "bg-[rgba(47,107,83,0.18)] text-[var(--color-kaia-green-soft)] border border-[var(--color-kaia-green-soft)]/30",
  },
  pending: {
    label: "En attente",
    className:
      "bg-[rgba(244,196,48,0.10)] text-[var(--color-kaia-gold)] border border-[var(--color-kaia-gold)]/30",
  },
  expired: {
    label: "Annulé",
    className: "bg-white/[0.04] text-white/50 border border-white/10",
  },
};

export default async function ReferralPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/referral");

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .maybeSingle();

  const code = profile?.referral_code ?? null;
  const fullUrl = code ? `${APP_HOST}/r/${code}` : null;

  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, status, total_commission_cents, first_payment_at, created_at")
    .eq("referrer_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = referrals ?? [];
  const counts = list.reduce(
    (acc, r) => {
      acc.total++;
      if (r.status === "active") acc.active++;
      if (r.status === "pending") acc.pending++;
      if (r.status === "expired") acc.expired++;
      acc.lifetimeCents += r.total_commission_cents ?? 0;
      return acc;
    },
    { total: 0, active: 0, pending: 0, expired: 0, lifetimeCents: 0 }
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <GlassCardHeading
        eyebrow="Parrainage"
        title="Invite tes proches"
        subtitle={`${REFERRAL_FIRST_PERCENT} % du 1er paiement de chaque ami·e abonné·e + ${REFERRAL_RECURRING_PERCENT} % à vie tant qu'il·elle pratique.`}
      />

      {fullUrl ? (
        <GlassCard className="bg-[rgba(212,144,106,0.04)] border border-[var(--color-kaia-terracotta)]/20">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-kaia-terracotta)] mb-3">
            <Heart className="w-3 h-3" />
            Mon lien personnel
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <code className="text-sm text-white/85 font-mono break-all">{fullUrl}</code>
            <CopyTextButton text={fullUrl}>Copier le lien</CopyTextButton>
          </div>
        </GlassCard>
      ) : null}

      <GlassCard>
        <h3 className="font-display text-lg text-white mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-[var(--color-kaia-gold)]" />
          Le bonus de tes ami·es
        </h3>
        <ul className="space-y-2 text-sm text-white/70">
          <li>• 14 jours d'essai gratuits comme tout le monde</li>
          <li>• −50 % sur le premier mois (auto-appliqué au paiement)</li>
          <li>• +{REFERRAL_REFEREE_WELCOME_TOKENS} tokens de bienvenue</li>
          <li>• 1 ticket pour le tirage hebdomadaire</li>
        </ul>
      </GlassCard>

      <div className="grid sm:grid-cols-3 gap-4">
        <GlassCard>
          <Users className="w-5 h-5 text-[var(--color-kaia-accent)] mb-3" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-1">Filleuls actifs</p>
          <p className="font-display text-3xl text-white tabular-nums">{counts.active}</p>
        </GlassCard>
        <GlassCard>
          <Users className="w-5 h-5 text-[var(--color-kaia-gold)] mb-3" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-1">En attente</p>
          <p className="font-display text-3xl text-white tabular-nums">{counts.pending}</p>
        </GlassCard>
        <GlassCard>
          <Coins className="w-5 h-5 text-[var(--color-kaia-terracotta)] mb-3" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-1">
            Commissions cumulées
          </p>
          <p className="font-display text-3xl text-white tabular-nums">
            {formatEur(counts.lifetimeCents)}
          </p>
        </GlassCard>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-xl text-white">Tes filleuls</h2>
        {list.length === 0 ? (
          <GlassCard>
            <p className="text-sm text-white/60">
              Aucun filleul pour l'instant. Partage ton lien avec une personne qui voudrait
              ralentir.
            </p>
          </GlassCard>
        ) : (
          list.map((r) => {
            const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.pending;
            return (
              <GlassCard
                key={r.id}
                className="flex items-center justify-between gap-4 flex-wrap py-4"
              >
                <div>
                  <p className="text-sm text-white/85">
                    Inscription le {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  </p>
                  <p className="text-xs text-white/40">
                    {r.first_payment_at
                      ? `1er paiement le ${new Date(r.first_payment_at).toLocaleDateString("fr-FR")}`
                      : "En attente du premier paiement"}
                    {" · "}
                    {formatEur(r.total_commission_cents ?? 0)} générés
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                  {badge.label}
                </span>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
