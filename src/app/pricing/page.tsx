import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { GlassCard } from "@/components/ui/Card";
import { PRICE_MONTHLY_EUR, PRICE_YEARLY_EUR, PRICE_YEARLY_DISCOUNT_PCT, TRIAL_DAYS } from "@/lib/constants";

export const metadata = {
  title: "Plans — un essai libre, puis un seul abonnement",
  description: "14 jours gratuits, puis 14,99 €/mois ou 125,91 €/an (-30 %). Annule en un clic.",
};

const FREE_FEATURES = [
  "1 routine par jour",
  "Catalogue restreint (≈ 30 pratiques)",
  "Cinématique d'ouverture + 1 fond nature",
  "SOS hotlines · sécurité",
  "Communauté en lecture",
];

const PREMIUM_FEATURES = [
  "Routines personnalisées illimitées (IA KAÏA)",
  "Catalogue complet · ≈ 80 pratiques",
  "12 fonds vidéo nature 4K · audio binaural",
  "Voix guidée multilingue (35 langues)",
  "Rituels collectifs hebdomadaires",
  "Tirages et concours · tickets bonus",
  "Mon Univers · Fil de vie",
  "Programme parrainage 50 % à vie",
];

export default function PricingPage() {
  const monthlyYearlyEquivalent = (PRICE_MONTHLY_EUR * 12).toFixed(2).replace(".", ",");

  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-10 text-center">
          <span className="inline-block text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80 mb-5">
            Plans KAÏA
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-white tracking-tight max-w-2xl mx-auto leading-tight">
            Un essai libre,
            <br />
            puis <span className="text-[var(--color-kaia-gold)]">un seul abonnement</span>.
          </h1>
          <p className="mt-5 text-white/60 max-w-xl mx-auto">
            Découvre KAÏA gratuitement pendant {TRIAL_DAYS} jours. Sans carte. Annule en un clic.
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-12">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Free */}
            <GlassCard className="flex flex-col">
              <header className="space-y-3">
                <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-white/40">
                  Découverte
                </span>
                <h2 className="font-display text-3xl text-white tracking-tight">Gratuit</h2>
                <p className="text-sm text-white/55">
                  Pour commencer en douceur, sans engagement.
                </p>
              </header>

              <div className="my-7">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-5xl text-white">0&nbsp;€</span>
                  <span className="text-sm text-white/45">/ pour toujours</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/75">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-white/45" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-12 px-6 rounded-2xl border border-white/10 text-white/80 hover:bg-white/[0.04] hover:text-white wellness-anim text-sm font-medium"
              >
                Créer un compte gratuit
              </Link>
            </GlassCard>

            {/* Premium */}
            <GlassCard className="flex flex-col relative overflow-hidden border-[var(--color-kaia-accent)]/30 bg-white/[0.06]">
              <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.16em] bg-[var(--color-kaia-gold)] text-[#1a1a1a]">
                <Sparkles className="w-3 h-3" /> Populaire
              </span>

              <header className="space-y-3">
                <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]">
                  KAÏA Premium
                </span>
                <h2 className="font-display text-3xl text-white tracking-tight">
                  Tout, en illimité
                </h2>
                <p className="text-sm text-white/65">
                  L'expérience KAÏA complète. Pour celles et ceux qui s'engagent envers eux-mêmes.
                </p>
              </header>

              <div className="my-7 space-y-4">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-5xl text-white">{PRICE_MONTHLY_EUR.toFixed(2).replace(".", ",")}&nbsp;€</span>
                    <span className="text-sm text-white/45">/ mois</span>
                  </div>
                  <p className="text-xs text-white/45 mt-1.5">{TRIAL_DAYS} jours gratuits — sans carte</p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.08]">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl text-white">{PRICE_YEARLY_EUR.toFixed(2).replace(".", ",")}&nbsp;€</span>
                      <span className="text-sm text-white/45">/ an</span>
                    </div>
                    <p className="text-xs text-white/40 mt-1">
                      <span className="line-through">{monthlyYearlyEquivalent}&nbsp;€</span>{" "}
                      <span className="text-[var(--color-kaia-gold)] font-medium">−{PRICE_YEARLY_DISCOUNT_PCT}&nbsp;%</span>
                    </p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/85">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-[var(--color-kaia-accent)]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup?plan=monthly"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl text-sm font-medium text-white bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] hover:opacity-95 wellness-anim shadow-[0_8px_28px_-12px_rgba(6,182,212,0.45)]"
              >
                Commencer mon essai
                <ArrowRight className="w-4 h-4" />
              </Link>
            </GlassCard>
          </div>
        </section>

        {/* /financer teaser */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-12">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <p className="text-sm text-emerald-100/85">
              💰 La plupart des utilisateurs ne paient rien grâce aux aides publiques (CPF, AGEFIPH, France Num…).
            </p>
            <Link
              href="/financer"
              className="text-sm font-medium text-emerald-200 hover:text-emerald-100 wellness-anim"
            >
              Vérifier mes aides →
            </Link>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-20">
          <h2 className="font-display text-2xl text-white tracking-tight mb-5">Questions courantes</h2>
          <dl className="space-y-3">
            {[
              {
                q: "Puis-je annuler à tout moment ?",
                a: "Oui. Annulation en un clic depuis ton profil ou ton App Store / Google Play. Aucune justification demandée.",
              },
              {
                q: "Suis-je facturé pendant l'essai ?",
                a: "Non. L'essai gratuit dure 14 jours sans carte bancaire. Tu choisis si tu veux continuer ensuite.",
              },
              {
                q: "Quelle est la différence entre Gratuit et Premium ?",
                a: "Le plan Gratuit donne accès à l'essentiel pour démarrer. Premium débloque toutes les routines, fonds nature, voix multilingues, rituels et concours.",
              },
              {
                q: "KAÏA remplace-t-il un médecin ou un thérapeute ?",
                a: "Non. KAÏA est une application de bien-être et d'hygiène de vie. Si tu traverses une difficulté, parle à un professionnel de santé.",
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group glass rounded-2xl px-5 py-4 cursor-pointer wellness-anim"
              >
                <summary className="flex items-center justify-between text-sm font-medium text-white/90 list-none">
                  {q}
                  <span className="text-white/40 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-white/60 leading-relaxed">{a}</p>
              </details>
            ))}
          </dl>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
