import Link from "next/link";
import { type ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <Link
        href="/"
        className="flex items-center gap-2.5 mb-10"
        aria-label="KAÏA — accueil"
      >
        <span
          aria-hidden
          className="h-9 w-9 rounded-2xl bg-gradient-to-br from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] grid place-items-center text-white font-display text-base shadow-[0_4px_20px_-4px_rgba(6,182,212,0.5)]"
        >
          K
        </span>
        <span className="font-display text-xl text-white tracking-tight">KAÏA</span>
      </Link>

      <div className="w-full max-w-md glass rounded-3xl p-7 sm:p-9 wellness-anim">
        <header className="space-y-2 mb-7 text-center">
          <h1 className="font-display text-3xl text-white tracking-tight">{title}</h1>
          {subtitle ? <p className="text-sm text-white/55">{subtitle}</p> : null}
        </header>
        {children}
      </div>

      {footer ? <div className="mt-6 text-sm text-white/55">{footer}</div> : null}
    </main>
  );
}
