/**
 * Landing publique — `/influencers`
 *
 *  - Présente le programme ambassadeur·rice (BRIEF §9)
 *  - Détail commission 50 % / 10 %, kit comm, payouts
 *  - CTA : `/signup` si pas connecté, `/influencer` si connecté
 */
import Link from "next/link";
import { ArrowRight, Sparkles, Heart, ShieldCheck, Coins, Megaphone } from "lucide-react";
import { GlassCard } from "@/components/ui/Card";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InfluencersLandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ctaHref = user ? "/influencer" : "/signup?redirect=/influencer";
  const ctaLabel = user ? "Mon espace ambassadeur" : "Créer mon compte d'abord";

  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-16 text-center">
          <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80 mb-7">
            <Megaphone className="w-3 h-3" />
            Programme ambassadeur·rice
          </span>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-white tracking-tight leading-[1.05] max-w-3xl mx-auto">
            Partage KAÏA,
            <br />
            <span className="bg-gradient-to-r from-[var(--color-kaia-gold)] via-[var(--color-kaia-terracotta)] to-[var(--color-kaia-accent)] bg-clip-text text-transparent">
              accompagné·e d'une rémunération juste.
            </span>
          </h1>
          <p className="mt-7 text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            50 % du premier paiement de chaque ami·e qui s'abonne. 10 % récurrent à vie tant
            qu'il·elle pratique. Aucun objectif imposé.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center gap-2 h-13 px-8 py-3.5 rounded-2xl text-[15px] font-medium text-white bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] hover:opacity-95 wellness-anim shadow-[0_12px_36px_-12px_rgba(6,182,212,0.5)]"
            >
              {ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/influencers/kit"
              className="inline-flex items-center justify-center h-13 px-7 py-3.5 rounded-2xl text-[15px] text-white/70 hover:text-white wellness-anim"
            >
              Voir le kit de communication
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-12">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="text-left">
              <Coins className="w-5 h-5 text-[var(--color-kaia-gold)] mb-3" />
              <h3 className="font-display text-xl text-white mb-2">50 % + 10 % à vie</h3>
              <p className="text-sm text-white/60">
                Tu reçois la moitié du 1er paiement de chaque filleul, puis 10 % de chaque
                renouvellement, tant qu'il·elle reste abonné·e.
              </p>
            </GlassCard>
            <GlassCard className="text-left">
              <Sparkles className="w-5 h-5 text-[var(--color-kaia-accent)] mb-3" />
              <h3 className="font-display text-xl text-white mb-2">Promo amie 7 jours</h3>
              <p className="text-sm text-white/60">
                Quand tu reçois ton lien, tu débloques automatiquement une réduction temporaire
                pour les premiers·ères qui te suivent.
              </p>
            </GlassCard>
            <GlassCard className="text-left">
              <ShieldCheck className="w-5 h-5 text-[var(--color-kaia-terracotta)] mb-3" />
              <h3 className="font-display text-xl text-white mb-2">Conforme Apple/Google</h3>
              <p className="text-sm text-white/60">
                Le kit fournit des scripts respectant les règles 5.3 d'Apple et le règlement
                Google : pas de note ★ obligatoire, divulgation #ad.
              </p>
            </GlassCard>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-20">
          <GlassCard className="text-left p-8">
            <h2 className="font-display text-3xl text-white mb-6">Comment ça marche</h2>
            <ol className="space-y-5 text-sm text-white/70 leading-relaxed">
              <li className="flex gap-3">
                <span className="font-semibold text-[var(--color-kaia-gold)] mt-0.5">01.</span>
                <span>
                  Tu candidates depuis ton espace ambassadeur·rice (réseaux, audience, niche).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-[var(--color-kaia-gold)] mt-0.5">02.</span>
                <span>Tissma valide ton profil sous 48h. Tu reçois ton code unique.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-[var(--color-kaia-gold)] mt-0.5">03.</span>
                <span>
                  Tu partages <code className="px-1.5 py-0.5 bg-white/5 rounded text-[var(--color-kaia-accent)]">kaia.purama.dev/i/TONCODE</code>{" "}
                  — chaque clic est tracké.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-[var(--color-kaia-gold)] mt-0.5">04.</span>
                <span>
                  Quand un·e ami·e s'abonne, tes commissions sont calculées automatiquement à
                  chaque facture.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-[var(--color-kaia-gold)] mt-0.5">05.</span>
                <span>
                  Tu demandes un versement IBAN dès 50 €. Validation Tissma puis virement (Treezor
                  prochainement pour l'auto-versement).
                </span>
              </li>
            </ol>
          </GlassCard>
        </section>

        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-24">
          <p className="text-center text-[11px] text-white/40 leading-relaxed">
            <Heart className="inline w-3 h-3 text-[var(--color-kaia-terracotta)] mr-1 align-text-bottom" />
            Aucun objectif minimum. Pas d'exclusivité. Tu choisis quand et comment partager — le
            reste, on s'en occupe.
          </p>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
