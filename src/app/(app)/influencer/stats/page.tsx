/**
 * `/influencer/stats` — agrégats clics + conversions + commissions.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MousePointerClick, UserPlus, Coins, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard, GlassCardHeading } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

function formatEur(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  });
}

export default async function InfluencerStatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/influencer/stats");

  const { data: link } = await supabase
    .from("influencer_links")
    .select("id, code, created_at")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  let clicks30d = 0;
  let conversions = 0;
  let lifetime = 0;
  let pending = 0;
  let paid = 0;

  if (link) {
    const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const clicksRes = await supabase
      .from("influencer_link_clicks")
      .select("id", { count: "exact", head: true })
      .eq("link_id", link.id)
      .gte("created_at", since30d);
    clicks30d = clicksRes.error ? 0 : clicksRes.count ?? 0;

    const { data: convs } = await supabase
      .from("influencer_conversions")
      .select("commission_cents, status")
      .eq("link_id", link.id);
    conversions = convs?.length ?? 0;
    for (const c of convs ?? []) {
      lifetime += c.commission_cents ?? 0;
      if (c.status === "paid") paid += c.commission_cents ?? 0;
      if (c.status === "pending") pending += c.commission_cents ?? 0;
    }
  }

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
        eyebrow="Statistiques"
        title="Tes performances"
        subtitle="Clics 30j, conversions, commissions cumulées."
      />

      {!link ? (
        <GlassCard>
          <p className="text-sm text-white/70">Crée d'abord ton lien personnel.</p>
          <Link
            href="/influencer/links"
            className="inline-block mt-4 text-sm text-[var(--color-kaia-accent)] underline-offset-4 hover:underline"
          >
            Aller à la création de lien →
          </Link>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <GlassCard>
            <MousePointerClick className="w-5 h-5 text-[var(--color-kaia-accent)] mb-3" />
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-1">Clics 30j</p>
            <p className="font-display text-3xl text-white tabular-nums">{clicks30d}</p>
          </GlassCard>
          <GlassCard>
            <UserPlus className="w-5 h-5 text-[var(--color-kaia-gold)] mb-3" />
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-1">Conversions</p>
            <p className="font-display text-3xl text-white tabular-nums">{conversions}</p>
          </GlassCard>
          <GlassCard>
            <Coins className="w-5 h-5 text-[var(--color-kaia-terracotta)] mb-3" />
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-1">
              Commissions cumulées
            </p>
            <p className="font-display text-3xl text-white tabular-nums">{formatEur(lifetime)}</p>
          </GlassCard>
          <GlassCard>
            <Wallet className="w-5 h-5 text-[var(--color-kaia-gold)] mb-3" />
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-1">
              Disponible
            </p>
            <p className="font-display text-3xl text-white tabular-nums">{formatEur(pending)}</p>
            <p className="text-xs text-white/50 mt-1">
              Versé : <span className="text-white/80">{formatEur(paid)}</span>
            </p>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
