import Link from "next/link";
import { Radio, Clock, CalendarDays, Users, ArrowRight } from "lucide-react";
import type { CoreEventType } from "@/lib/core/moment-z";

export interface CoreEventCard {
  id: string;
  type: CoreEventType;
  title: string;
  description: string | null;
  starts_at: string;
  participants_count: number;
  auto_created_by_radar?: boolean;
}

const TRILOGY: { type: CoreEventType; label: string; sub: string; icon: typeof Radio }[] = [
  { type: "now", label: "Maintenant", sub: "Convergence immédiate", icon: Radio },
  { type: "24h", label: "Dans 24h", sub: "Rendez-vous du jour", icon: Clock },
  { type: "7days", label: "Cette semaine", sub: "Vague longue", icon: CalendarDays },
];

/**
 * Trilogie C.O.R.E. — Maintenant / 24h / 7 jours. Affichage présentationnel
 * (server component), groupé par type.
 */
export default function CORETimeline({ events }: { events: CoreEventCard[] }) {
  const byType = (t: CoreEventType) => events.filter((e) => e.type === t);

  return (
    <div className="space-y-8">
      {TRILOGY.map(({ type, label, sub, icon: Icon }) => {
        const list = byType(type);
        return (
          <section key={type}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-[var(--kaia-moon)]" />
              <h2 className="font-display text-lg font-medium">{label}</h2>
              <span className="text-xs text-[var(--foreground-muted)]">· {sub}</span>
            </div>

            {list.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)] glass rounded-2xl p-4">
                Aucun événement pour l&apos;instant. Crée le premier. 🌙
              </p>
            ) : (
              <div className="space-y-3">
                {list.map((e) => (
                  <Link key={e.id} href={`/core/${e.id}`} className="block">
                    <div className="glass rounded-2xl p-5 hover:bg-[var(--kaia-moon)]/10 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{e.title}</h3>
                            {e.auto_created_by_radar && (
                              <span className="px-2 py-0.5 rounded-full bg-[var(--kaia-gold)]/15 text-[var(--kaia-gold)] text-[10px]">
                                Radar Mondial
                              </span>
                            )}
                          </div>
                          {e.description && (
                            <p className="text-sm text-[var(--foreground-muted)] line-clamp-2">{e.description}</p>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mt-2">
                            <Users className="w-3.5 h-3.5" />
                            <span>{e.participants_count} présentes</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[var(--kaia-moon)] shrink-0 mt-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
