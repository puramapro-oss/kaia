import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-5">
      <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80">
        Petit détour
      </span>
      <h1 className="font-display text-5xl sm:text-6xl text-white tracking-tight mt-4">
        Cette page n'existe pas.
      </h1>
      <p className="mt-4 text-white/55 max-w-md">
        Mais tu existes. Et c'est l'essentiel. Reviens à l'accueil — on continue ensemble.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center h-12 px-6 rounded-2xl text-sm font-medium text-white bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] hover:opacity-95 wellness-anim"
        >
          Retour à l'accueil
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center h-12 px-6 rounded-2xl text-sm border border-white/10 text-white/80 hover:bg-white/5 wellness-anim"
        >
          Mon espace
        </Link>
      </div>
    </main>
  );
}
