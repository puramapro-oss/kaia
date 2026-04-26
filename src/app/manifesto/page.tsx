import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";

export const metadata = {
  title: "Manifeste — pourquoi KAÏA existe",
  description:
    "Une routine de bien-être ne se subit pas. Elle se compose. KAÏA t'invite à revenir à toi, en quelques respirations.",
};

export default function ManifestoPage() {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1 max-w-3xl mx-auto px-5 sm:px-8 pt-20 pb-24 space-y-10 text-white/80 leading-relaxed">
        <header className="space-y-4 text-center">
          <span className="inline-block text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80">
            Manifeste
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-white tracking-tight">
            Reviens à toi.
          </h1>
        </header>

        <section className="space-y-4">
          <p>
            Nous croyons qu'une routine de bien-être se compose. Elle ne s'impose pas. Elle
            commence là où tu es — pas là où on aimerait que tu sois.
          </p>
          <p>
            KAÏA n'est pas un programme. C'est un compagnon discret. Quatre minutes le matin,
            une respiration au cœur de la journée, un geste de gratitude le soir.
          </p>
          <p>
            Nous ne promettons pas de te guérir, ni de te transformer en une autre version
            de toi-même. Nous proposons un espace pour respirer, bouger, accueillir — et
            recommencer demain.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-white tracking-tight">Nos principes</h2>
          <ul className="list-disc ml-6 space-y-2 text-white/70">
            <li>Toujours désactivable — sons, vidéos, vibrations.</li>
            <li>Jamais de promesse médicale. Jamais.</li>
            <li>Tes données restent tes données. Pas de revente, pas de profilage caché.</li>
            <li>Un seul abonnement. Pas de paywall caché. Pas d'add-on.</li>
            <li>Le bien-être est universel — KAÏA parle 35 langues, dont LSF/ASL/BSL.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-white tracking-tight">Notre invitation</h2>
          <p>
            Si tu lis ces lignes, prends une respiration profonde. Inspire 4 secondes,
            retiens 7, expire 8. Voilà. Tu viens de pratiquer KAÏA.
          </p>
          <p className="italic text-white/55">— L'équipe KAÏA · Frasne, France</p>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
