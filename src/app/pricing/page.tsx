import Link from "next/link";
import { Check, Sparkles, ArrowRight, Star } from "lucide-react";
import { TRIAL_DAYS, VITAE_PLAN_KEYS, VITAE_MULTIPLIERS } from "@/lib/constants";

export const metadata = {
  title: "Plans VITAE — intelligence du cycle, à ton rythme",
  description: "14 jours d'essai gratuits. 3 plans VITAE pour accompagner ton cycle féminin. KARMA partagé selon ton plan.",
};

const PLANS = [
  {
    key: VITAE_PLAN_KEYS.ESSENTIEL,
    name: "Essentiel",
    tagline: "Découvrir son cycle",
    priceEur: "9,99",
    multiplier: VITAE_MULTIPLIERS.essentiel,
    highlight: false,
    features: [
      "Suivi du cycle complet",
      "Journal quotidien (humeur, énergie, symptômes)",
      "Analyse LUNA — 3 messages/jour",
      "Recommandations par phase",
      "Programme parrainage KARMA ×1",
      "14 jours d'essai gratuits",
    ],
    cta: "Commencer",
    ctaHref: `/signup?plan=${VITAE_PLAN_KEYS.ESSENTIEL}`,
  },
  {
    key: VITAE_PLAN_KEYS.INFINI,
    name: "Infini",
    tagline: "Vivre en accord avec soi",
    priceEur: "49,99",
    multiplier: VITAE_MULTIPLIERS.infini,
    highlight: true,
    features: [
      "Tout Essentiel",
      "Analyse LUNA illimitée — tous modes",
      "Cercles privés & Aurora Guidance",
      "Insights hormonaux avancés",
      "Chiffrement AES-256 des notes",
      "Programme parrainage KARMA ×5",
      "14 jours d'essai gratuits",
    ],
    cta: "Choisir Infini",
    ctaHref: `/signup?plan=${VITAE_PLAN_KEYS.INFINI}`,
  },
  {
    key: VITAE_PLAN_KEYS.LEGENDE,
    name: "Légende",
    tagline: "Maîtrise totale du cycle",
    priceEur: "99,99",
    multiplier: VITAE_MULTIPLIERS.legende,
    highlight: false,
    features: [
      "Tout Infini",
      "Niveaux Pureté & Aurora max",
      "Accès anticipé aux nouvelles features",
      "Support prioritaire (réponse < 4h)",
      "Programme parrainage KARMA ×10",
      "OpenTimestamps — preuve blockchain",
      "14 jours d'essai gratuits",
    ],
    cta: "Choisir Légende",
    ctaHref: `/signup?plan=${VITAE_PLAN_KEYS.LEGENDE}`,
  },
] as const;

const FAQS = [
  {
    q: "LUNA, c'est qui ?",
    a: "LUNA est l'intelligence artificielle de KAÏA. Elle analyse ton cycle, anticipe tes phases et t'accompagne chaque jour — sans jamais poser de diagnostic médical.",
  },
  {
    q: "Qu'est-ce que le KARMA ×5 ou ×10 ?",
    a: "Le KARMA est le système de redistribution de KAÏA. Chaque mois, une partie des revenus est partagée entre les utilisateurices actif·ves. Ton multiplicateur dépend de ton plan — plus il est élevé, plus ta part est grande.",
  },
  {
    q: "Suis-je facturée pendant l'essai ?",
    a: `Non. L'essai dure ${TRIAL_DAYS} jours, sans carte bancaire. Tu choisis si tu veux continuer ensuite.`,
  },
  {
    q: "KAÏA remplace-t-il un médecin ?",
    a: "Non. KAÏA est une application de bien-être et d'intelligence du cycle. Pour tout problème de santé, consulte un professionnel de santé.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui. Annulation en un clic depuis Réglages > Abonnement. Aucune justification demandée.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0d0d1a' }}>
      {/* Ambient orbs */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 70% 5%, rgba(200,185,240,0.10) 0%, transparent 60%), radial-gradient(ellipse 45% 35% at 15% 95%, rgba(232,200,122,0.06) 0%, transparent 55%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 px-5 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-xl">🌙</span>
          <span
            className="text-xl font-semibold tracking-wide"
            style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              background: 'linear-gradient(135deg, #c8b9f0, #e8c87a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            KAÏA
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-white/60 hover:text-white transition-colors">
            Se connecter
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-xl border border-[rgba(200,185,240,0.25)] text-[#c8b9f0] hover:bg-[rgba(200,185,240,0.08)] transition-colors text-sm font-medium"
          >
            Essai gratuit
          </Link>
        </nav>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 pb-24">
        {/* Hero */}
        <section className="text-center pt-16 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase mb-6"
            style={{ background: 'rgba(200,185,240,0.08)', color: '#c8b9f0', border: '1px solid rgba(200,185,240,0.15)' }}>
            <Sparkles size={12} />
            Plans VITAE
          </div>
          <h1
            className="text-4xl sm:text-5xl font-semibold tracking-tight text-white max-w-2xl mx-auto leading-tight"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Choisis ton niveau
            <br />
            <span style={{ background: 'linear-gradient(135deg, #c8b9f0, #e8c87a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              d&apos;intelligence cyclique
            </span>
          </h1>
          <p className="mt-5 text-white/55 max-w-lg mx-auto text-sm leading-relaxed">
            {TRIAL_DAYS} jours d&apos;essai offerts · sans carte bancaire · annulation en un clic
          </p>
        </section>

        {/* Plans grid */}
        <section className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={[
                'relative flex flex-col rounded-2xl p-6 transition-all duration-300',
                plan.highlight
                  ? 'bg-[rgba(200,185,240,0.08)] border-[1.5px] border-[rgba(200,185,240,0.35)] shadow-[0_0_60px_rgba(200,185,240,0.08)]'
                  : 'bg-[rgba(255,255,255,0.03)] border border-[rgba(200,185,240,0.08)]',
              ].join(' ')}
              style={{ backdropFilter: 'blur(20px) saturate(150%)' }}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest"
                    style={{ background: '#e8c87a', color: '#1a1a1a' }}>
                    <Star size={10} fill="currentColor" />
                    Populaire
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="space-y-2 mb-6">
                <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: '#c8b9f0', opacity: 0.7 }}>
                  {plan.key.toUpperCase()}
                </p>
                <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  {plan.name}
                </h2>
                <p className="text-sm text-white/50">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-[rgba(200,185,240,0.08)]">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-white" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                    {plan.priceEur}&nbsp;€
                  </span>
                  <span className="text-sm text-white/40">/ mois</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(232,200,122,0.10)', color: '#e8c87a' }}>
                  KARMA ×{plan.multiplier}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                    <Check size={15} className="mt-0.5 shrink-0" style={{ color: '#c8b9f0' }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.ctaHref}
                className={[
                  'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-medium transition-all duration-200',
                  plan.highlight
                    ? 'text-[#0d0d1a] font-semibold hover:opacity-90'
                    : 'text-[#c8b9f0] border border-[rgba(200,185,240,0.25)] hover:bg-[rgba(200,185,240,0.08)]',
                ].join(' ')}
                style={plan.highlight ? { background: 'linear-gradient(135deg, #c8b9f0, #e8c87a)' } : {}}
              >
                {plan.cta}
                <ArrowRight size={15} />
              </Link>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section className="mt-20 max-w-2xl mx-auto">
          <h2
            className="text-2xl font-semibold text-white text-center mb-8"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Questions fréquentes
          </h2>
          <dl className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-2xl px-5 py-4 cursor-pointer transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,185,240,0.08)', backdropFilter: 'blur(12px)' }}
              >
                <summary className="flex items-center justify-between text-sm font-medium text-white/85 list-none">
                  {q}
                  <span className="text-white/40 group-open:rotate-45 transition-transform duration-200 text-lg leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-white/55 leading-relaxed">{a}</p>
              </details>
            ))}
          </dl>
        </section>

        {/* Legal */}
        <p className="mt-12 text-center text-[11px] text-white/30 leading-relaxed max-w-lg mx-auto">
          Conformément à l&apos;art. L221-28 3° du Code de la consommation, tu acceptes implicitement la fourniture immédiate du service numérique.
          Le droit de rétractation de 14 jours est ainsi exercé sur les jours restants de l&apos;essai.
          Les primes wallet sont retenues en cas d&apos;annulation dans les {/* RETRACTION_DAYS */}30 premiers jours.
        </p>
      </main>
    </div>
  );
}
