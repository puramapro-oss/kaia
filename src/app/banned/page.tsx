import type { Metadata } from "next";
import { SignOutButton } from "@/components/auth/SignOutButton";

export const metadata: Metadata = { title: "Compte suspendu — KAÏA", robots: { index: false } };

export default function BannedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="glass rounded-2xl p-8 max-w-md text-center space-y-4">
        <div className="text-4xl">🌙</div>
        <h1 className="font-display text-2xl font-semibold">Ton compte est suspendu</h1>
        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
          L&apos;accès à KAÏA est temporairement suspendu pour ce compte. Si tu penses
          qu&apos;il s&apos;agit d&apos;une erreur, écris-nous — on regardera ensemble.
        </p>
        <a href="mailto:support@kaia.purama.dev" className="inline-block text-sm text-[var(--kaia-moon)]">
          support@kaia.purama.dev
        </a>
        <div className="pt-2 flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
