"use client";

import { useState, useTransition } from "react";
import { Film, Vibrate, Headphones, Sparkles, Check, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/Card";
import { haptic } from "@/lib/multisensorial/haptics";
import { type MultisensorialPrefs } from "@/hooks/useMultisensorialPrefs";
import { updateMultisensorialPrefs } from "./actions";

type ToggleKey = "background_video" | "haptics" | "binaural" | "cinematic";

interface ToggleSpec {
  key: ToggleKey;
  label: string;
  description: string;
  icon: typeof Film;
  accent: string;
  warning?: string;
}

const TOGGLES: ToggleSpec[] = [
  {
    key: "background_video",
    label: "Vidéo nature en arrière-plan",
    description:
      "Forêt, océan, montagne… 12 ambiances respirantes derrière chaque écran. Désactive si ton appareil chauffe ou pour économiser la batterie.",
    icon: Film,
    accent: "var(--color-kaia-green-soft)",
  },
  {
    key: "haptics",
    label: "Vibrations subtiles",
    description:
      "Une pulsation discrète accompagne chaque action importante. Aide à la présence. Sans effet sur les appareils sans moteur haptique.",
    icon: Vibrate,
    accent: "var(--color-kaia-accent)",
  },
  {
    key: "binaural",
    label: "Sons binauraux",
    description:
      "Ondes Alpha · Theta · Beta · Delta pour ancrer respiration et méditation. À écouter au casque.",
    icon: Headphones,
    accent: "var(--color-kaia-gold)",
    warning:
      "Déconseillé en conduisant ou en cas d'épilepsie. Ce n'est pas un soin médical.",
  },
  {
    key: "cinematic",
    label: "Cinématique d'ouverture",
    description:
      "Une mini ouverture rituelle quand tu reviens chaque jour : 4 secondes pour atterrir, skippable au tap.",
    icon: Sparkles,
    accent: "var(--color-kaia-terracotta)",
  },
];

interface MultisensorialToggleListProps {
  initialPrefs: MultisensorialPrefs;
}

export function MultisensorialToggleList({
  initialPrefs,
}: MultisensorialToggleListProps) {
  const [prefs, setPrefs] = useState<MultisensorialPrefs>(initialPrefs);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<ToggleKey | null>(null);

  const setToggle = (key: ToggleKey, next: boolean) => {
    const previous = prefs[key];
    setPrefs((current) => ({ ...current, [key]: next }));
    setError(null);
    haptic(next ? "success" : "selection", prefs.haptics || next);

    startTransition(async () => {
      const result = await updateMultisensorialPrefs({ [key]: next });
      if (!result.ok) {
        // Rollback optimiste en cas d'échec.
        setPrefs((current) => ({ ...current, [key]: previous }));
        setError(result.error);
        return;
      }
      setSavedKey(key);
      setTimeout(() => setSavedKey((value) => (value === key ? null : value)), 1400);
    });
  };

  return (
    <div className="space-y-3">
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-[var(--color-kaia-terracotta)]/30 bg-[var(--color-kaia-terracotta)]/[0.06] px-4 py-3 text-sm text-white/80 flex items-start gap-2"
        >
          <AlertTriangle
            className="w-4 h-4 mt-0.5 text-[var(--color-kaia-terracotta)]"
            strokeWidth={1.7}
          />
          {error}
        </div>
      ) : null}

      {TOGGLES.map(({ key, label, description, icon: Icon, accent, warning }) => {
        const value = prefs[key];
        const isSaved = savedKey === key;
        return (
          <GlassCard key={key} className="flex items-start gap-4">
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: `${accent}26`, color: accent }}
            >
              <Icon className="w-5 h-5" strokeWidth={1.6} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-lg text-white">{label}</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={value}
                  aria-label={`${label} — ${value ? "activé" : "désactivé"}`}
                  disabled={pending}
                  onClick={() => setToggle(key, !value)}
                  className="relative h-7 w-12 rounded-full wellness-anim shrink-0 disabled:opacity-60 disabled:cursor-wait focus-visible:ring-2 focus-visible:ring-[var(--color-kaia-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
                  style={{
                    background: value
                      ? "linear-gradient(135deg, var(--color-kaia-green) 0%, var(--color-kaia-accent) 100%)"
                      : "rgba(255,255,255,0.08)",
                    border: value
                      ? "1px solid rgba(6,182,212,0.4)"
                      : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                    style={{
                      transform: value ? "translateX(20px)" : "translateX(0)",
                    }}
                  />
                </button>
              </div>
              <p className="text-sm text-white/55 mt-1.5 pr-3">{description}</p>
              {warning && value ? (
                <p className="mt-2 inline-flex items-start gap-1.5 text-[12px] text-[var(--color-kaia-gold)]/80">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5" strokeWidth={1.7} />
                  {warning}
                </p>
              ) : null}
              <p
                className="mt-2 text-[11px] tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80 transition-opacity"
                aria-live="polite"
                style={{ opacity: isSaved ? 1 : 0 }}
              >
                <Check className="inline-block w-3 h-3 mr-1" strokeWidth={2} />
                Enregistré
              </p>
            </div>
          </GlassCard>
        );
      })}

      <p className="text-xs text-white/40 px-1 pt-2">
        Tes préférences se synchronisent sur tous tes appareils. Tu peux changer d'avis à tout moment.
      </p>
    </div>
  );
}
