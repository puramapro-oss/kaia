/**
 * Kit communication ambassadeur — `/influencers/kit`
 *
 *  - Scripts FR conformes Apple/Google (BRIEF §9.6)
 *  - Disclaimer #ad obligatoire
 *  - Captions Stories Insta / TikTok / YouTube
 *  - Templates DM témoignage
 *
 * Public — pas d'auth requise.
 */
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Copy } from "lucide-react";
import { GlassCard } from "@/components/ui/Card";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { CopyTextButton } from "@/components/influencer/CopyTextButton";

export const dynamic = "force-static";

const SCRIPTS = [
  {
    title: "Story Instagram (15s)",
    body:
      "« J'utilise KAÏA tous les matins depuis [X mois], 4 minutes pour respirer et démarrer la journée plus posé·e. Mon code 👉 [TONCODE] · #ad »",
  },
  {
    title: "TikTok organique",
    body:
      "« Routine bien-être de [X minutes] : respiration cohérence cardiaque + 1 mouvement + 1 intention. Si tu veux essayer KAÏA gratuit 14j, mon lien en bio. #ad #publicite »",
  },
  {
    title: "Reel Insta — voix off",
    body:
      "« Si comme moi tu cherches une routine courte sans pression, KAÏA fait le job. 14 jours gratuits, mon code [TONCODE]. Lien en bio. #ad »",
  },
  {
    title: "DM témoignage (à un·e ami·e qui te demande)",
    body:
      "Salut ! Oui je l'utilise tous les jours, ça m'aide à ralentir le matin. Tu peux essayer 14j gratuit avec mon code [TONCODE], tu auras −50% sur le 1er mois si tu prolonges. #ad (je suis ambassadeur·rice).",
  },
];

const FORBIDDEN = [
  '« Mets-moi 5 ⭐ sur l\'App Store » → Apple 5.3 + Google : récompense pour avis store INTERDITE.',
  '« KAÏA soigne le stress / l\'anxiété / la dépression » → claims médicaux interdits, parle de bien-être / hygiène de vie / accompagnement.',
  '« Plan gratuit illimité ! » → l\'abonnement est la base, l\'essai est de 14 jours gratuit.',
  '« KAÏA c\'est mieux que [concurrent] » → comparaisons commerciales sans preuve : pas autorisées.',
];

export default function InfluencerKitPage() {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-20 sm:pt-24 pb-12">
          <Link
            href="/influencers"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white wellness-anim mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au programme
          </Link>
          <h1 className="font-display text-4xl sm:text-5xl text-white tracking-tight leading-tight mb-4">
            Kit de communication
          </h1>
          <p className="text-base text-white/60 leading-relaxed">
            Tout ce qu'il faut pour partager KAÏA en toute conformité avec les guidelines Apple
            (5.3) et Google. Tu peux t'inspirer librement — adapte à ta voix.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-12">
          <GlassCard className="border border-[var(--color-kaia-terracotta)]/30 bg-[rgba(212,144,106,0.04)]">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-[var(--color-kaia-terracotta)] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-display text-xl text-white mb-3">Trois règles non-négociables</h2>
                <ul className="space-y-2 text-sm text-white/70 leading-relaxed list-disc list-inside">
                  <li>
                    Toute publication contenant ton lien DOIT mentionner{" "}
                    <code className="px-1.5 py-0.5 bg-white/5 rounded text-[var(--color-kaia-accent)]">#ad</code>{" "}
                    ou « lien sponsorisé » (DGCCRF + ARPP).
                  </li>
                  <li>
                    Aucune incitation à noter l'app sur l'App Store ou le Play Store en
                    contrepartie d'un avantage.
                  </li>
                  <li>
                    Pas de promesse médicale (« soigne », « guérit », « traite »). KAÏA est une
                    routine de bien-être, pas un traitement.
                  </li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-12 space-y-4">
          <h2 className="font-display text-2xl text-white mb-4">Scripts prêts-à-publier</h2>
          {SCRIPTS.map((s) => (
            <GlassCard key={s.title} className="text-left">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h3 className="font-display text-lg text-white">{s.title}</h3>
                <CopyTextButton text={s.body}>
                  <Copy className="w-3.5 h-3.5" />
                  Copier
                </CopyTextButton>
              </div>
              <p className="text-sm text-white/70 leading-relaxed font-mono whitespace-pre-wrap">
                {s.body}
              </p>
            </GlassCard>
          ))}
        </section>

        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-20">
          <h2 className="font-display text-2xl text-white mb-4">À ne JAMAIS dire</h2>
          <GlassCard>
            <ul className="space-y-3 text-sm text-white/70 leading-relaxed">
              {FORBIDDEN.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="text-[var(--color-kaia-terracotta)] shrink-0 mt-0.5">✕</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
