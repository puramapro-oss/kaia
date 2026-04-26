import Link from "next/link";

const SAGE_QUOTES = [
  { text: "Le voyage de mille lieues commence par un seul pas.", author: "Lao Tseu" },
  { text: "Là où il y a une volonté, il y a un chemin.", author: "Vivekananda" },
  { text: "La paix vient de l'intérieur. Ne la cherche pas au-dehors.", author: "Bouddha" },
  { text: "Vis le moment présent.", author: "Eckhart Tolle" },
  { text: "Souris à la vie, et la vie te sourira.", author: "Thich Nhat Hanh" },
];

export function MarketingFooter() {
  const quote = SAGE_QUOTES[new Date().getDate() % SAGE_QUOTES.length];
  return (
    <footer className="relative border-t border-white/[0.06] mt-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 grid gap-10 sm:grid-cols-3">
        <div className="space-y-3 sm:col-span-1">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="h-8 w-8 rounded-xl bg-gradient-to-br from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] grid place-items-center text-white font-display text-sm"
            >
              K
            </span>
            <span className="font-display text-lg text-white">KAÏA</span>
          </div>
          <p className="text-sm text-white/50 max-w-xs leading-relaxed">
            Routine multisensorielle pour le bien-être quotidien. Respire, bouge, accueille.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-[11px] font-medium tracking-[0.18em] uppercase text-white/40">
            Application
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/pricing" className="text-white/65 hover:text-white wellness-anim">Plans</Link></li>
            <li><Link href="/manifesto" className="text-white/65 hover:text-white wellness-anim">Manifeste</Link></li>
            <li><Link href="/login" className="text-white/65 hover:text-white wellness-anim">Se connecter</Link></li>
            <li><Link href="/signup" className="text-white/65 hover:text-white wellness-anim">Créer un compte</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-[11px] font-medium tracking-[0.18em] uppercase text-white/40">
            Mentions
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/legal/cgu" className="text-white/65 hover:text-white wellness-anim">CGU</Link></li>
            <li><Link href="/legal/privacy" className="text-white/65 hover:text-white wellness-anim">Confidentialité</Link></li>
            <li><Link href="/legal/contests-rules" className="text-white/65 hover:text-white wellness-anim">Règlement concours</Link></li>
            <li><Link href="/legal/disclaimer-medical" className="text-white/65 hover:text-white wellness-anim">Avertissement bien-être</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} SASU PURAMA — Frasne, France · Art. 293 B
          </p>
          <p className="text-xs text-white/35 italic max-w-md sm:text-right">
            « {quote.text} » <span className="text-white/25">— {quote.author}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
