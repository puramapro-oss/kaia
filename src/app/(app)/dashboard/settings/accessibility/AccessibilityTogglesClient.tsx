"use client";

import { useTranslations } from "next-intl";
import { Eye, Type, Activity, ZoomIn, Volume2, Hand } from "lucide-react";
import { GlassCard } from "@/components/ui/Card";
import { useA11y, type A11yPrefs } from "@/components/shared/A11yProvider";

type ToggleConfig = {
  key: keyof A11yPrefs;
  icon: typeof Eye;
  labelKey: string;
  bodyKey: string;
};

const TOGGLES: ToggleConfig[] = [
  { key: "highContrast", icon: Eye, labelKey: "highContrast", bodyKey: "highContrastBody" },
  { key: "dyslexiaFont", icon: Type, labelKey: "dyslexiaFont", bodyKey: "dyslexiaFontBody" },
  { key: "reduceMotion", icon: Activity, labelKey: "reduceMotion", bodyKey: "reduceMotionBody" },
  { key: "largeText", icon: ZoomIn, labelKey: "largeText", bodyKey: "largeTextBody" },
  { key: "audioDescription", icon: Volume2, labelKey: "audioDescription", bodyKey: "audioDescriptionBody" },
  { key: "signLanguage", icon: Hand, labelKey: "signLanguage", bodyKey: "signLanguageBody" },
];

export function AccessibilityTogglesClient() {
  const t = useTranslations("accessibility");
  const { prefs, setPref } = useA11y();

  return (
    <div className="space-y-3" role="group" aria-label={t("title")}>
      {TOGGLES.map(({ key, icon: Icon, labelKey, bodyKey }) => {
        const enabled = prefs[key];
        const inputId = `a11y-${key}`;
        return (
          <GlassCard key={key} className="flex items-start gap-4">
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-white/70"
            >
              <Icon className="w-5 h-5" strokeWidth={1.6} />
            </span>
            <div className="flex-1 min-w-0">
              <label
                htmlFor={inputId}
                className="font-display text-lg text-white cursor-pointer"
              >
                {t(labelKey)}
              </label>
              <p className="text-sm text-white/55 mt-0.5" id={`${inputId}-desc`}>
                {t(bodyKey)}
              </p>
            </div>
            <button
              id={inputId}
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-describedby={`${inputId}-desc`}
              onClick={() => setPref(key, !enabled)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-kaia-accent)] ${
                enabled ? "bg-[var(--color-kaia-accent)]" : "bg-white/15"
              }`}
            >
              <span className="sr-only">{t(labelKey)}</span>
              <span
                aria-hidden
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </GlassCard>
        );
      })}
    </div>
  );
}
