'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Moon, Sparkles, Users, User, Settings, Shield, LogOut } from 'lucide-react';
import PuramaBackground from '@/components/shared/PuramaBackground';
import BottomTabBar from '@/components/layout/BottomTabBar';

const NAV_ITEMS = [
  { href: '/accueil', icon: Home, label: 'Accueil' },
  { href: '/cycle', icon: Moon, label: 'Cycle' },
  { href: '/luna', icon: Sparkles, label: 'Luna' },
  { href: '/cercles', icon: Users, label: 'Cercles' },
  { href: '/moi', icon: User, label: 'Moi' },
] as const;

interface KaiaShellProps {
  children: React.ReactNode;
  backgroundVariant?: 'default' | 'calm' | 'focus' | 'sleep' | 'ignite';
  isSuperAdmin?: boolean;
  userEmail?: string;
}

export default function KaiaShell({
  children,
  backgroundVariant = 'default',
  isSuperAdmin = false,
  userEmail,
}: KaiaShellProps) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen">
      {/* Background shader */}
      <PuramaBackground variant={backgroundVariant} />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[280px] z-40 flex-col">
        <div className="flex flex-col h-full glass rounded-none rounded-r-2xl border-y-0 border-l-0">
          {/* Logo */}
          <div className="px-6 pt-8 pb-6">
            <Link href="/accueil" className="flex items-center gap-3 group">
              <span className="text-2xl">🌙</span>
              <span className="font-display text-2xl font-semibold tracking-wide gradient-kaia-text">
                KAÏA
              </span>
            </Link>
            <p className="mt-1 text-xs text-[var(--foreground-muted)] pl-9">
              Intelligence du cycle
            </p>
          </div>

          {/* Nav */}
          <nav aria-label="Navigation principale" className="flex-1 px-3">
            <ul className="space-y-1">
              {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={[
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium',
                        active
                          ? 'bg-[rgba(200,185,240,0.12)] text-[var(--kaia-moon)] shadow-[0_0_20px_rgba(200,185,240,0.08)]'
                          : 'text-[var(--foreground-muted)] hover:bg-[rgba(200,185,240,0.06)] hover:text-[var(--foreground)]',
                      ].join(' ')}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon
                        size={18}
                        strokeWidth={active ? 2.2 : 1.8}
                        className={active ? 'drop-shadow-[0_0_8px_rgba(200,185,240,0.6)]' : ''}
                      />
                      {label}
                      {active && (
                        <span
                          aria-hidden="true"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--kaia-moon)]"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom actions */}
          <div className="px-3 pb-6 space-y-1">
            {isSuperAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-[#ffd700] hover:bg-[rgba(255,215,0,0.08)] transition-colors"
              >
                <Shield size={16} />
                Admin
              </Link>
            )}
            <Link
              href="/moi/reglages"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[rgba(200,185,240,0.06)] transition-colors"
            >
              <Settings size={16} />
              Réglages
            </Link>

            {userEmail && (
              <div className="px-4 pt-2 border-t border-[rgba(200,185,240,0.08)]">
                <p className="text-[10px] text-[var(--foreground-muted)] truncate">{userEmail}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={[
          'relative z-10 min-h-screen',
          'md:ml-[280px]',
          'pb-20 md:pb-0', /* space for bottom tabs on mobile */
        ].join(' ')}
      >
        {children}
      </main>

      {/* Mobile bottom tabs */}
      <BottomTabBar />
    </div>
  );
}
