"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {

      console.error("[KAÏA] error boundary captured:", error);
    }
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-5">
      <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-terracotta)]/80">
        Pause respiration
      </span>
      <h1 className="font-display text-5xl sm:text-6xl text-white tracking-tight mt-4 max-w-2xl">
        Petit détour, on revient plus fort.
      </h1>
      <p className="mt-4 text-white/55 max-w-md">
        Une erreur inattendue s'est produite. Tu peux réessayer ou retourner à l'accueil — la
        sérénité reste là où tu la cherches.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center h-12 px-6 rounded-2xl text-sm font-medium text-white bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] hover:opacity-95 wellness-anim"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="inline-flex items-center h-12 px-6 rounded-2xl text-sm border border-white/10 text-white/80 hover:bg-white/5 wellness-anim"
        >
          Retour à l'accueil
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-8 text-[11px] text-white/30">Référence : {error.digest}</p>
      ) : null}
    </main>
  );
}
