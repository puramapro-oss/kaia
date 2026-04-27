/**
 * Landing parrainage particulier — `/r/<CODE>`
 *
 *  - Server : lookup `profiles.referral_code`, 404 si introuvable
 *  - Client : appelle `/api/referral/track` au mount → set cookie 30j
 *  - Bonus filleul affiché (BRIEF §10) :
 *     · -50 % 1er mois (auto-applied at checkout)
 *     · +200 tokens bienvenue
 *     · 1 ticket contest
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Gift, Coins, Ticket, Heart } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/admin";
import { GlassCard } from "@/components/ui/Card";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { ReferralTracker } from "@/components/referral/ReferralTracker";
import { REFERRAL_REFEREE_WELCOME_TOKENS } from "@/lib/referral/commission-rules";

interface PageProps {
  params: Promise<{ code: string }>;
}

export const dynamic = "force-dynamic";

const CODE_REGEX = /^[a-z0-9-]{4,32}$/;

export default async function ReferralLandingPage({ params }: PageProps) {
  const raw = (await params).code ?? "";
  const code = raw.trim().toLowerCase();
  if (!CODE_REGEX.test(code)) notFound();

  const admin = createServiceClient();
  const { data: referrer } = await admin
    .from("profiles")
    .select("id, full_name, referral_code")
    .eq("referral_code", code)
    .maybeSingle();

  if (!referrer) notFound();

  const displayName = referrer.full_name ?? "Un·e ami·e";

  return (
    <>
      <MarketingHeader />
      <ReferralTracker code={code} />
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-12 text-center">
          <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80 mb-7">
            <Heart className="w-3 h-3 text-[var(--color-kaia-terracotta)]" />
            Invitation de {displayName}
          </span>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-white tracking-tight leading-[1.05] max-w-3xl mx-auto">
            Ton·ta ami·e
            <br />
            <span className="bg-gradient-to-r from-[var(--color-kaia-gold)] via-[var(--color-kaia-terracotta)] to-[var(--color-kaia-accent)] bg-clip-text text-transparent">
              t'offre KAÏA.
            </span>
          </h1>
          <p className="mt-7 text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            14 jours gratuits, puis −50 % sur ton premier mois et un panier de bienvenue qui
            t'attend dès l'inscription.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href={`/signup?ref=${encodeURIComponent(code)}`}
              className="inline-flex items-center justify-center gap-2 h-13 px-8 py-3.5 rounded-2xl text-[15px] font-medium text-white bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] hover:opacity-95 wellness-anim shadow-[0_12px_36px_-12px_rgba(6,182,212,0.5)]"
            >
              Accepter l'invitation
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/manifesto"
              className="inline-flex items-center justify-center h-13 px-7 py-3.5 rounded-2xl text-[15px] text-white/70 hover:text-white wellness-anim"
            >
              Découvrir KAÏA
            </Link>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-20">
          <p className="text-center text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-gold)] mb-6">
            Ton panier de bienvenue
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <GlassCard className="text-left">
              <Gift className="w-5 h-5 text-[var(--color-kaia-terracotta)] mb-3" />
              <h3 className="font-display text-xl text-white mb-2">−50 % le 1er mois</h3>
              <p className="text-sm text-white/60">
                La réduction s'applique automatiquement au moment du paiement, sans code à saisir.
              </p>
            </GlassCard>
            <GlassCard className="text-left">
              <Coins className="w-5 h-5 text-[var(--color-kaia-gold)] mb-3" />
              <h3 className="font-display text-xl text-white mb-2">
                +{REFERRAL_REFEREE_WELCOME_TOKENS} tokens
              </h3>
              <p className="text-sm text-white/60">
                Crédités dans ton portefeuille à l'inscription pour démarrer ta routine.
              </p>
            </GlassCard>
            <GlassCard className="text-left">
              <Ticket className="w-5 h-5 text-[var(--color-kaia-accent)] mb-3" />
              <h3 className="font-display text-xl text-white mb-2">1 ticket concours</h3>
              <p className="text-sm text-white/60">
                Pour le tirage hebdomadaire — règlement complet sur la page Concours.
              </p>
            </GlassCard>
          </div>

          <p className="mt-12 text-center text-[11px] text-white/40 leading-relaxed">
            En t'inscrivant, {displayName} reçoit également une commission par notre programme de
            parrainage. Ton tarif n'est pas affecté.
          </p>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
