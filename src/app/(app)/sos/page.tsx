import Link from "next/link";
import { Phone, MessageCircle, Globe2, ArrowLeft } from "lucide-react";
import { GlassCard } from "@/components/ui/Card";

export const metadata = {
  title: "SOS — KAÏA",
  description: "Numéros et liens d'écoute, accessibles à tout moment.",
};

interface Hotline {
  country: string;
  name: string;
  number: string;
  href: string;
  note?: string;
}

const HOTLINES: Hotline[] = [
  {
    country: "France",
    name: "3114 — Numéro national de prévention du suicide",
    number: "3114",
    href: "tel:3114",
    note: "Gratuit, 24h/24, confidentiel.",
  },
  {
    country: "France",
    name: "112 — Urgences",
    number: "112",
    href: "tel:112",
    note: "Police, pompiers, SAMU.",
  },
  {
    country: "France",
    name: "SOS Amitié",
    number: "09 72 39 40 50",
    href: "tel:0972394050",
    note: "Écoute anonyme 24h/24.",
  },
];

export default function SosPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/home"
        className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white wellness-anim"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.7} />
        Retour
      </Link>

      <header className="space-y-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-kaia-terracotta)]">
          Tu n'es pas seul·e.
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Si c'est dur, là, maintenant — appelle.
        </h1>
        <p className="text-white/65">
          KAÏA n'est pas un soignant. Si tu as besoin d'aide humaine immédiate, voici des
          professionnels qui répondent gratuitement, à toute heure.
        </p>
      </header>

      <div className="space-y-3">
        {HOTLINES.map((h) => (
          <GlassCard key={h.number} className="space-y-2">
            <div className="flex items-center gap-3">
              <Phone
                className="w-5 h-5 text-[var(--color-kaia-accent)]"
                strokeWidth={1.7}
                aria-hidden
              />
              <div className="flex-1">
                <p className="font-display text-lg text-white/95">{h.name}</p>
                <p className="text-xs text-white/45">{h.country}</p>
              </div>
            </div>
            <a
              href={h.href}
              className="inline-flex items-center gap-2 text-2xl font-display text-white tabular-nums hover:text-[var(--color-kaia-accent)] wellness-anim"
            >
              {h.number}
            </a>
            {h.note && <p className="text-sm text-white/55">{h.note}</p>}
          </GlassCard>
        ))}

        <GlassCard className="space-y-2">
          <div className="flex items-center gap-3">
            <Globe2
              className="w-5 h-5 text-[var(--color-kaia-gold)]"
              strokeWidth={1.7}
              aria-hidden
            />
            <p className="font-display text-lg text-white/95">Hors de France ?</p>
          </div>
          <p className="text-sm text-white/65">
            Trouve une ligne d'écoute dans ton pays sur findahelpline.com.
          </p>
          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-kaia-accent)] hover:underline"
          >
            findahelpline.com →
          </a>
        </GlassCard>

        <GlassCard className="space-y-2">
          <div className="flex items-center gap-3">
            <MessageCircle
              className="w-5 h-5 text-white/65"
              strokeWidth={1.7}
              aria-hidden
            />
            <p className="font-display text-lg text-white/95">Une autre façon</p>
          </div>
          <p className="text-sm text-white/65 leading-relaxed">
            Tu peux aussi parler à quelqu'un de proche. Un message, un appel, une visite — la
            connexion humaine compte plus que les mots parfaits.
          </p>
        </GlassCard>
      </div>

      <p className="text-xs text-white/40 text-center pt-4">
        En cas de danger immédiat — appelle le 112.
      </p>
    </div>
  );
}
