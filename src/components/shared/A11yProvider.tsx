"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type A11yPrefs = {
  highContrast: boolean;
  dyslexiaFont: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  audioDescription: boolean;
  signLanguage: boolean;
};

const DEFAULT_PREFS: A11yPrefs = {
  highContrast: false,
  dyslexiaFont: false,
  largeText: false,
  reduceMotion: false,
  audioDescription: false,
  signLanguage: false,
};

const STORAGE_KEY = "kaia_a11y_prefs";

type Ctx = {
  prefs: A11yPrefs;
  setPref: <K extends keyof A11yPrefs>(key: K, value: A11yPrefs[K]) => void;
};

const A11yContext = createContext<Ctx | null>(null);

/**
 * P9 — Provider d'accessibilité côté client. Persiste 6 toggles dans
 * localStorage et applique des classes/attributs sur <html> pour les
 * stylesheets globales (cf src/app/globals.css `[data-a11y-*]`).
 *
 * Volontairement client-only : pas de round-trip serveur sur chaque toggle,
 * UX instantanée. La persistance serveur (profile.accessibility_*) est
 * gérée séparément par /dashboard/settings/accessibility/page.tsx.
 */
export function A11yProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<A11yPrefs>;
        setPrefs((current) => ({ ...current, ...parsed }));
      }
    } catch {
      // localStorage indisponible (Safari private, quota dépassé) : on garde defaults
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
    const root = document.documentElement;
    root.dataset.a11yHighContrast = prefs.highContrast ? "true" : "false";
    root.dataset.a11yDyslexia = prefs.dyslexiaFont ? "true" : "false";
    root.dataset.a11yLargeText = prefs.largeText ? "true" : "false";
    root.dataset.a11yReduceMotion = prefs.reduceMotion ? "true" : "false";
    root.dataset.a11yAudioDescription = prefs.audioDescription ? "true" : "false";
    root.dataset.a11ySignLanguage = prefs.signLanguage ? "true" : "false";
  }, [prefs, hydrated]);

  const value: Ctx = {
    prefs,
    setPref: (key, value) => {
      setPrefs((current) => ({ ...current, [key]: value }));
    },
  };

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useA11y(): Ctx {
  const ctx = useContext(A11yContext);
  if (!ctx) {
    return { prefs: DEFAULT_PREFS, setPref: () => undefined };
  }
  return ctx;
}
