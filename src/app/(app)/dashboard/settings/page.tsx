import Link from "next/link";
import {
  Sparkles,
  Languages,
  Eye,
  Bell,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { GlassCard } from "@/components/ui/Card";

export const metadata = { title: "Réglages" };

interface SettingsLink {
  href: string;
  label: string;
  description: string;
  icon: typeof Sparkles;
  available: boolean;
  accent: string;
}

const SECTIONS: SettingsLink[] = [
  {
    href: "/dashboard/settings/multisensorial",
    label: "Multisensoriel",
    description: "Vidéo nature, haptique, sons binauraux, cinématique d'ouverture.",
    icon: Sparkles,
    available: true,
    accent: "var(--color-kaia-accent)",
  },
  {
    href: "/dashboard/settings/abonnement",
    label: "Abonnement",
    description: "Plan, facturation, gestion via le portail Stripe.",
    icon: CreditCard,
    available: false,
    accent: "var(--color-kaia-gold)",
  },
  {
    href: "/dashboard/settings/notifications",
    label: "Notifications",
    description: "Rappels routine, rituels hebdo, news bienveillantes.",
    icon: Bell,
    available: false,
    accent: "var(--color-kaia-terracotta)",
  },
  {
    href: "/dashboard/settings/accessibility",
    label: "Accessibilité",
    description: "Contraste, dyslexie, animations réduites, descriptions audio.",
    icon: Eye,
    available: true,
    accent: "#7d8aa8",
  },
  {
    href: "/dashboard/settings/language",
    label: "Langue",
    description: "35 langues disponibles. Détection auto + override manuel.",
    icon: Languages,
    available: true,
    accent: "var(--color-kaia-green-soft)",
  },
];

export default function SettingsHomePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80">
          Réglages
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Ton expérience, ton tempo.
        </h1>
        <p className="text-white/55">
          Tout est ajustable. Rien n'est figé. KAÏA s'adapte à toi.
        </p>
      </header>

      <div className="grid gap-3">
        {SECTIONS.map(({ href, label, description, icon: Icon, available, accent }) => {
          const content = (
            <GlassCard
              className={`flex items-start gap-4 ${
                available ? "" : "opacity-55 cursor-not-allowed hover:bg-white/[0.04]"
              }`}
            >
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: `${accent}26`, color: accent }}
              >
                <Icon className="w-5 h-5" strokeWidth={1.6} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg text-white">{label}</p>
                <p className="text-sm text-white/55 mt-0.5">{description}</p>
                {!available ? (
                  <p className="text-[11px] text-white/35 uppercase tracking-[0.18em] mt-2">
                    Bientôt
                  </p>
                ) : null}
              </div>
              <ChevronRight
                className="w-5 h-5 text-white/30 mt-1.5 shrink-0"
                strokeWidth={1.6}
              />
            </GlassCard>
          );

          return available ? (
            <Link key={href} href={href} className="block focus:outline-none">
              {content}
            </Link>
          ) : (
            <div key={href} aria-disabled="true">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
