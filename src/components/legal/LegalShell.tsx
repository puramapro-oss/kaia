import { type ReactNode } from "react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";

export function LegalShell({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1 max-w-3xl mx-auto px-5 sm:px-8 pt-16 pb-24">
        <header className="mb-10 space-y-2">
          <span className="inline-block text-[11px] font-medium tracking-[0.18em] uppercase text-white/45">
            Mentions légales
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-white/40">Mis à jour le {updatedAt}</p>
        </header>
        <article className="prose prose-invert max-w-none text-white/75 [&_h2]:font-display [&_h2]:text-white [&_h2]:tracking-tight [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_p]:leading-relaxed [&_li]:leading-relaxed [&_a]:text-[var(--color-kaia-accent)] [&_a:hover]:text-[var(--color-kaia-gold)]">
          {children}
        </article>
      </main>
      <MarketingFooter />
    </>
  );
}
