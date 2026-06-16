'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Moon, Sparkles, Users, User } from 'lucide-react';

const TABS = [
  { href: '/accueil', icon: Home, label: 'Accueil' },
  { href: '/cycle', icon: Moon, label: 'Cycle' },
  { href: '/luna', icon: Sparkles, label: 'Luna' },
  { href: '/cercles', icon: Users, label: 'Cercles' },
  { href: '/moi', icon: User, label: 'Moi' },
] as const;

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom md:hidden"
    >
      <div className="glass border-t border-[rgba(200,185,240,0.08)] border-x-0 border-b-0 rounded-none">
        <ul className="flex items-center justify-around px-2 py-2">
          {TABS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={[
                    'flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-200',
                    active
                      ? 'text-[var(--kaia-moon)]'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="relative">
                    <Icon
                      size={22}
                      strokeWidth={active ? 2.2 : 1.8}
                      className={active ? 'drop-shadow-[0_0_8px_rgba(200,185,240,0.7)]' : ''}
                    />
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--kaia-moon)]"
                      />
                    )}
                  </span>
                  <span className={['text-[10px] font-medium tracking-wide', active ? 'opacity-100' : 'opacity-60'].join(' ')}>
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
