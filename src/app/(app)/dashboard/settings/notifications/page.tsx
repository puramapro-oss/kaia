"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/Card";

interface NotifToggle {
  key: string;
  label: string;
  description: string;
}

const TOGGLES: NotifToggle[] = [
  {
    key: "daily_routine_reminder",
    label: "Rappel routine quotidienne",
    description: "Reçois un rappel 30 min avant l'heure choisie pour ta routine.",
  },
  {
    key: "weekly_ritual",
    label: "Rituel collectif hebdo",
    description: "Notification chaque lundi pour le rituel de la semaine.",
  },
  {
    key: "contest_result",
    label: "Résultats des concours",
    description: "Sois prévenu·e quand un tirage au sort est effectué.",
  },
  {
    key: "luna_insights",
    label: "Insights LUNA",
    description: "Conseils et observations de LUNA basés sur ton cycle.",
  },
  {
    key: "graines_earned",
    label: "Graines gagnées",
    description: "Notification lorsque tu gagnes des Graines.",
  },
];

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TOGGLES.map((t) => [t.key, true])),
  );
  const [saving, setSaving] = useState<string | null>(null);

  async function toggle(key: string) {
    const next = !prefs[key];
    setSaving(key);
    setPrefs((p) => ({ ...p, [key]: next }));

    try {
      await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled: next }),
      });
    } catch {
      // revert on error
      setPrefs((p) => ({ ...p, [key]: !next }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-terracotta)]/80">
          Réglages
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Notifications
        </h1>
        <p className="text-white/55">
          Choisis ce que KAÏA te communique, et quand.
        </p>
      </header>

      <div className="space-y-3">
        {TOGGLES.map(({ key, label, description }) => {
          const enabled = prefs[key];
          const isSaving = saving === key;
          return (
            <GlassCard key={key} className="flex items-start gap-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl mt-0.5"
                style={{
                  background: enabled ? "var(--color-kaia-accent)26" : "rgba(255,255,255,0.04)",
                  color: enabled ? "var(--color-kaia-accent)" : "rgba(255,255,255,0.3)",
                }}
              >
                {enabled ? (
                  <Bell className="w-5 h-5" strokeWidth={1.6} />
                ) : (
                  <BellOff className="w-5 h-5" strokeWidth={1.6} />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display text-base text-white">{label}</p>
                <p className="text-sm text-white/50 mt-0.5">{description}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                disabled={isSaving}
                aria-label={enabled ? `Désactiver ${label}` : `Activer ${label}`}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-kaia-accent)] mt-1 ${
                  enabled ? "bg-[var(--color-kaia-accent)]" : "bg-white/15"
                }`}
              >
                {isSaving ? (
                  <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-white" />
                ) : (
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                )}
              </button>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard className="text-sm text-white/55 leading-relaxed">
        <p>
          Les notifications push nécessitent l'autorisation du navigateur ou de l'application.
          Si tu as refusé, va dans les paramètres de ton appareil pour les réactiver.
        </p>
      </GlassCard>
    </div>
  );
}
