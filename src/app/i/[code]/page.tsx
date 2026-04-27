/**
 * Landing influenceur — `/i/<CODE>`
 *
 *  - Server: lookup le code, 404 si introuvable / désactivé
 *  - Client (component) : appelle /api/influencer/track au mount → set cookie + log click
 *  - Affiche promo timer si `promo_active_until > now()`
 *  - CTA : `/signup?inf=CODE` (le cookie est déjà set)
 *  - Disclaimer "lien sponsorisé" (BRIEF §9.6)
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles, ShieldCheck, Wind, Heart } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/admin";
import { isValidCodeFormat } from "@/lib/influencer/codes";
import { GlassCard } from "@/components/ui/Card";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { InfluencerTracker } from "@/components/influencer/InfluencerTracker";
import { PromoCountdown } from "@/components/influencer/PromoCountdown";

interface PageProps {
  params: Promise<{ code: string }>;
}

export const dynamic = "force-dynamic";

export default async function InfluencerLandingPage({ params }: PageProps) {
  const raw = (await params).code ?? "";
  const code = raw.trim().toUpperCase();
  if (!isValidCodeFormat(code)) notFound();

  const admin = createServiceClient();
  const { data: link } = await admin
    .from("influencer_links")
    .select(
      "id, code, active, user_id, promo_active_until, promo_discount_percent, custom_landing_url"
    )
    .eq("code", code)
    .eq("active", true)
    .maybeSingle();

  if (!link) notFound();

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", link.user_id as string)
    .maybeSingle();

  const promoUntil =
    link.promo_active_until && new Date(link.promo_active_until) > new Date()
      ? (link.promo_active_until as string)
      : null;
  const discount = (link.promo_discount_percent as number | null) ?? 50;
  const displayName = profile?.full_name ?? "Un·e ambassadeur·rice";

  return (
    <>
      <MarketingHeader />
      <InfluencerTracker code={code} />
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-16 text-center">
          <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80 mb-7">
            <span className="h-1 w-1 rounded-full bg-[var(--color-kaia-accent)]" />
            Invitation de {displayName}
          </span>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-white tracking-tight leading-[1.05] max-w-3xl mx-auto">
            Tu es invité·e à
            <br />
            <span className="bg-gradient-to-r from-[var(--color-kaia-gold)] via-[var(--color-kaia-terracotta)] to-[var(--color-kaia-accent)] bg-clip-text text-transparent">
              KAÏA.
            </span>
          </h1>
          <p className="mt-7 text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            14 jours gratuits, puis tu choisis. Une routine multisensorielle courte, chaque jour,
            composée pour toi.
          </p>

          {promoUntil ? (
            <div className="mt-10 max-w-md mx-auto">
              <GlassCard className="p-6 border border-[var(--color-kaia-gold)]/30 bg-[rgba(244,196,48,0.04)]">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[var(--color-kaia-gold)]" />
                  <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-gold)]">
                    Promo amie · −{discount}%
                  </span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  Ton·ta ambassadeur·rice te débloque {discount} % sur ton premier paiement, à
                  utiliser avant la fin du compte à rebours.
                </p>
                <PromoCountdown until={promoUntil} />
              </GlassCard>
            </div>
          ) : null}

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href={`/signup?inf=${encodeURIComponent(code)}`}
              className="inline-flex items-center justify-center gap-2 h-13 px-8 py-3.5 rounded-2xl text-[15px] font-medium text-white bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] hover:opacity-95 wellness-anim shadow-[0_12px_36px_-12px_rgba(6,182,212,0.5)]"
            >
              Commencer 14 jours gratuits
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center h-13 px-7 py-3.5 rounded-2xl text-[15px] text-white/70 hover:text-white wellness-anim"
            >
              Voir les plans
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-20">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="text-left">
              <Wind className="w-5 h-5 text-[var(--color-kaia-accent)] mb-3" />
              <h3 className="font-display text-xl text-white mb-2">Respire en 4 minutes</h3>
              <p className="text-sm text-white/60">
                Cohérence cardiaque, 4-7-8, box. Un guide visuel et sonore te tient la main.
              </p>
            </GlassCard>
            <GlassCard className="text-left">
              <Heart className="w-5 h-5 text-[var(--color-kaia-terracotta)] mb-3" />
              <h3 className="font-display text-xl text-white mb-2">Une routine vivante</h3>
              <p className="text-sm text-white/60">
                Méditation, mouvement, mantra, mudra — composée chaque matin selon ton énergie.
              </p>
            </GlassCard>
            <GlassCard className="text-left">
              <ShieldCheck className="w-5 h-5 text-[var(--color-kaia-gold)] mb-3" />
              <h3 className="font-display text-xl text-white mb-2">Sans pression</h3>
              <p className="text-sm text-white/60">
                Pas d'objectif fitness. Pas de claim médical. Tu fais à ton rythme.
              </p>
            </GlassCard>
          </div>

          <p className="mt-12 text-center text-[11px] text-white/40 leading-relaxed">
            Lien sponsorisé · #ad — KAÏA rémunère ses ambassadeur·rices pour les conversions
            réussies. Le tarif et les conditions restent identiques pour toi.
          </p>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
