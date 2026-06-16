import Link from "next/link";
import { type ReactNode } from "react";
import PuramaBackground from "@/components/shared/PuramaBackground";

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
    <div className="relative min-h-screen">
      <PuramaBackground variant="calm" />
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-5 py-10">
        <Link
          href="/"
          className="flex items-center gap-3 mb-10"
          aria-label="KAÏA — accueil"
        >
          <span
            aria-hidden
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[var(--kaia-moon)] to-[var(--kaia-rose)] grid place-items-center font-display text-base font-semibold text-[var(--background)] shadow-[0_0_24px_rgba(200,185,240,0.4)]"
          >
            K
          </span>
          <span className="font-display text-2xl text-[var(--foreground)] tracking-wide gradient-kaia-text">KAÏA</span>
        </Link>

        <div className="w-full max-w-md glass rounded-3xl p-7 sm:p-9">
          <header className="space-y-2 mb-7 text-center">
            <h1 className="font-display text-3xl text-[var(--foreground)] tracking-tight">{title}</h1>
            {subtitle ? <p className="text-sm text-[var(--foreground-muted)]">{subtitle}</p> : null}
          </header>
          {children}
        </div>

        {footer ? <div className="mt-6 text-sm text-[var(--foreground-muted)]">{footer}</div> : null}
      </main>
    </div>
  );
}
