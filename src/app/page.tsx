import Link from "next/link";
import { ArrowRight, Wind, Heart, Sparkles } from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { GlassCard } from "@/components/ui/Card";

const USPS = [
  {
    icon: Wind,
    title: "Respire en 4 minutes",
    body: "Cohérence cardiaque, 4-7-8, box. Un guide visuel et sonore te tient la main.",
  },
  {
    icon: Heart,
    title: "Une routine vivante",
    body: "Méditation, mouvement, mantra, mudra — composée chaque matin selon ton énergie.",
  },
  {
    icon: Sparkles,
    title: "Multisensoriel léger",
    body: "Fond nature, sons binauraux apaisants, cinématique d'ouverture — toujours désactivable.",
  },
];

export default function Home() {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-16 text-center">
          <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80 mb-7">
            <span className="h-1 w-1 rounded-full bg-[var(--color-kaia-accent)]" />
            Bien-être quotidien · 4 minutes
          </span>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-white tracking-tight leading-[1.05] max-w-3xl mx-auto">
            Reviens à toi,
            <br />
            <span className="bg-gradient-to-r from-[var(--color-kaia-gold)] via-[var(--color-kaia-terracotta)] to-[var(--color-kaia-accent)] bg-clip-text text-transparent">
              en quelques respirations.
            </span>
          </h1>
          <p className="mt-7 text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            KAÏA construit avec toi une routine multisensorielle courte chaque jour.
            Respire, bouge, accueille. Sans pression, sans abonnement obligatoire.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/signup"
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
          <p className="mt-5 text-xs text-white/40">
            Sans carte bancaire pour l'essai · Annule en un clic
          </p>
        </section>

        {/* USPs */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
          <div className="grid gap-5 sm:grid-cols-3">
            {USPS.map(({ icon: Icon, title, body }) => (
              <GlassCard key={title} className="space-y-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-kaia-green)]/40 to-[var(--color-kaia-accent)]/30 text-[var(--color-kaia-accent)]">
                  <Icon className="w-5 h-5" strokeWidth={1.6} />
                </span>
                <div className="space-y-2">
                  <h3 className="font-display text-xl text-white tracking-tight">
                    {title}
                  </h3>
                  <p className="text-sm text-white/55 leading-relaxed">{body}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Tease multisensoriel */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
          <GlassCard className="relative overflow-hidden p-8 sm:p-12 text-center">
            <div className="relative space-y-5 max-w-2xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
                Une expérience qui s'adapte à toi.
              </h2>
              <p className="text-white/60 leading-relaxed">
                Fonds vidéo nature, parallax doux, vibrations subtiles, sons binauraux
                Alpha/Theta. Tout est optionnel. Tu choisis ce qui te fait du bien — et tu
                changes d'avis quand tu veux.
              </p>
              <Link
                href="/manifesto"
                className="inline-flex items-center gap-2 text-[var(--color-kaia-accent)] hover:text-[var(--color-kaia-gold)] wellness-anim text-sm font-medium"
              >
                Lire le manifeste KAÏA
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </GlassCard>
        </section>

        {/* Avertissement bien-être (légal Apple + RGPD wellness) */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-12">
          <p className="text-xs text-white/40 text-center leading-relaxed">
            KAÏA est une application de bien-être et d'hygiène de vie. Elle ne remplace
            pas un avis médical, ni un traitement. En cas de souffrance ou de doute,
            consulte un professionnel de santé.
          </p>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
