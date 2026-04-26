import Link from "next/link";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0f]/60 border-b border-white/[0.06]">
      <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="KAÏA — accueil"
        >
          <span
            aria-hidden
            className="h-9 w-9 rounded-2xl bg-gradient-to-br from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] grid place-items-center text-white font-display text-base shadow-[0_4px_20px_-4px_rgba(6,182,212,0.5)]"
          >
            K
          </span>
          <span className="font-display text-xl text-white tracking-tight group-hover:text-[var(--color-kaia-accent)] wellness-anim">
            KAÏA
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link href="/pricing" className="text-white/60 hover:text-white wellness-anim">
            Plans
          </Link>
          <Link href="/manifesto" className="text-white/60 hover:text-white wellness-anim">
            Manifeste
          </Link>
          <Link href="/legal/disclaimer-medical" className="text-white/60 hover:text-white wellness-anim">
            Bien-être & santé
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center h-10 px-4 text-sm text-white/70 hover:text-white wellness-anim"
          >
            Se connecter
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center h-10 px-5 rounded-2xl text-sm font-medium text-white bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] hover:opacity-95 wellness-anim shadow-[0_8px_24px_-12px_rgba(6,182,212,0.5)]"
          >
            Commencer
          </Link>
        </div>
      </nav>
    </header>
  );
}
