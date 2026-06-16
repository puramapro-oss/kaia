import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import PuramaBackground from "@/components/shared/PuramaBackground";

export const metadata: Metadata = {
  title: "KAÏA — Intelligence du cycle féminin",
  description: "KAÏA t'accompagne avec LUNA, l'intelligence qui comprend ton cycle. Respiration AURORA, Cercles d'Intention, événements C.O.R.E.",
  openGraph: {
    title: "KAÏA — Intelligence du cycle féminin",
    description: "Découvre LUNA, ton guide personnel du cycle. Bien-être, respiration et communauté.",
    url: "https://kaia.purama.dev",
    siteName: "KAÏA",
    locale: "fr_FR",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-5">
      <PuramaBackground variant="default" />

      <main className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[var(--kaia-moon)] via-[var(--kaia-rose)] to-[var(--kaia-gold)] grid place-items-center shadow-[0_0_60px_rgba(200,185,240,0.4)]">
            <Sparkles className="text-[var(--background)]" size={36} strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-5xl font-semibold tracking-wide gradient-kaia-text">
            KAÏA
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-lg text-[var(--foreground-muted)] leading-relaxed mb-12 max-w-[280px]">
          L&apos;intelligence qui comprend ton cycle
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/signup"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-rose)] text-[var(--background)] font-semibold text-base shadow-[0_0_30px_rgba(200,185,240,0.3)] hover:shadow-[0_0_40px_rgba(200,185,240,0.5)] transition-all duration-300 hover:-translate-y-0.5"
          >
            Commencer
          </Link>
          <Link
            href="/login"
            className="w-full py-4 px-6 rounded-2xl glass text-[var(--foreground)] font-medium text-base hover:bg-[rgba(200,185,240,0.08)] transition-all duration-300"
          >
            Déjà membre — Se connecter
          </Link>
        </div>

        {/* Subtle footer */}
        <p className="mt-10 text-xs text-[var(--foreground-muted)] opacity-50">
          KAÏA · Intelligence du cycle · Purama
        </p>
      </main>
    </div>
  );
}
