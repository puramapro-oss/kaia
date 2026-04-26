import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { GlassCard } from "@/components/ui/Card";

export const metadata = {
  title: "Financer mon abonnement KAÏA — aides publiques",
  description:
    "CPF, AGEFIPH, France Num, FDVA, mécénat… Vérifie en 60 secondes si tu peux financer ton abonnement KAÏA.",
};

export default function FinancerPage() {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1 max-w-4xl mx-auto px-5 sm:px-8 pt-20 pb-24 space-y-10">
        <header className="text-center space-y-3">
          <span className="inline-block text-[11px] font-medium tracking-[0.18em] uppercase text-emerald-300/85">
            Financement
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-white tracking-tight max-w-2xl mx-auto leading-tight">
            Et si tu ne payais pas ?
          </h1>
          <p className="text-white/55 max-w-xl mx-auto">
            Un wizard intelligent en 4 étapes te dit en 60 secondes quelles aides publiques
            peuvent rembourser tout ou partie de ton abonnement KAÏA.
          </p>
        </header>

        <GlassCard className="space-y-4 text-center">
          <p className="text-white/70 leading-relaxed max-w-md mx-auto">
            Le moteur d'éligibilité (45 dispositifs : CPF, AGEFIPH, France Num, FDVA, mécénat…) est
            actuellement en construction. Il sera disponible dans les prochaines semaines.
          </p>
          <p className="text-sm text-white/45">
            En attendant, ouvre un compte gratuit — l'essai 14 jours commence sans carte bancaire.
          </p>
        </GlassCard>
      </main>
      <MarketingFooter />
    </>
  );
}
