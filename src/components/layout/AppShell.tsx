import Link from "next/link";
import {
  Home,
  Sparkles,
  Heart,
  Globe2,
  Users,
  Wallet,
  Settings as SettingsIcon,
  Trophy,
  Sunrise,
} from "lucide-react";
import { type ReactNode } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";

const NAV = [
  { href: "/home", label: "Accueil", icon: Home },
  { href: "/routine/builder", label: "Routine", icon: Sparkles },
  { href: "/universe", label: "Mon univers", icon: Heart },
  { href: "/impact", label: "Impact", icon: Globe2 },
  { href: "/rituals", label: "Rituel", icon: Sunrise },
  { href: "/community", label: "Communauté", icon: Users },
  { href: "/dashboard/contests", label: "Concours", icon: Trophy },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/settings", label: "Réglages", icon: SettingsIcon },
];

const MOBILE_TABS = [
  { href: "/home", label: "Accueil", icon: Home },
  { href: "/routine/builder", label: "Routine", icon: Sparkles },
  { href: "/rituals", label: "Rituel", icon: Sunrise },
  { href: "/community", label: "Cercle", icon: Users },
  { href: "/dashboard/settings", label: "Plus", icon: SettingsIcon },
];

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { email?: string | null; full_name?: string | null };
}) {
  const initial = (user.full_name ?? user.email ?? "K").trim().charAt(0).toUpperCase();
  const display = user.full_name ?? user.email ?? "";

  return (
    <div className="min-h-screen flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-[272px] h-screen sticky top-0 bg-white/[0.025] border-r border-white/[0.06] p-5 justify-between">
        <div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-2 py-2 mb-8 group"
          >
            <span
              aria-hidden
              className="h-9 w-9 rounded-2xl bg-gradient-to-br from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] grid place-items-center text-white font-display text-base"
            >
              K
            </span>
            <span className="font-display text-xl text-white tracking-tight">KAÏA</span>
          </Link>

          <nav className="space-y-0.5">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/55 hover:text-white hover:bg-white/[0.05] wellness-anim"
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.7} />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/[0.03]">
            <div
              aria-hidden
              className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--color-kaia-terracotta)] to-[var(--color-kaia-gold)] grid place-items-center text-[#1a1a1a] font-display text-sm"
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white/85 truncate">{display}</p>
              <p className="text-[11px] text-white/40">Plan : Découverte</p>
            </div>
          </div>
          <SignOutButton className="w-full justify-start" />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 px-5 sm:px-8 pt-6 pb-28 lg:pb-8">{children}</div>

        {/* Bottom tabs mobile */}
        <nav
          aria-label="Navigation principale"
          className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-[#0a0a0f]/85 backdrop-blur-xl border-t border-white/[0.07] flex items-center justify-around px-2 z-40 safe-bottom"
        >
          {MOBILE_TABS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 text-white/45 hover:text-white wellness-anim"
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={1.7} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
