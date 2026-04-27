"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Check } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/Card";
import { LOCALE_LABELS, SUPPORTED_LOCALES, isRtl, type Locale } from "@/i18n/locales";

type Labels = {
  search: string;
  current: string;
  saved: string;
  rtlNote: string;
};

type ActionResult = { ok: true } | { ok: false; error: string };

export function LanguagePickerClient({
  currentLocale,
  action,
  labels,
}: {
  currentLocale: Locale;
  action: (formData: FormData) => Promise<ActionResult>;
  labels: Labels;
}) {
  const [filter, setFilter] = useState("");
  const [active, setActive] = useState<Locale>(currentLocale);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return SUPPORTED_LOCALES;
    return SUPPORTED_LOCALES.filter((l) => {
      const label = LOCALE_LABELS[l].toLowerCase();
      return label.includes(needle) || l.toLowerCase().includes(needle);
    });
  }, [filter]);

  const handleSelect = (locale: Locale) => {
    if (locale === active || pending) return;
    const previous = active;
    setActive(locale);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("locale", locale);
      const result = await action(fd);
      if (!result.ok) {
        setActive(previous);
        toast.error(result.error);
        return;
      }
      toast.success(labels.saved);
      // Re-render full app pour appliquer dir + html lang + messages
      setTimeout(() => window.location.reload(), 250);
    });
  };

  return (
    <div className="space-y-4">
      <GlassCard className="flex items-center gap-3">
        <Search className="w-4 h-4 text-white/40" aria-hidden />
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          aria-label={labels.search}
          placeholder={labels.search}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-sm"
        />
      </GlassCard>

      <ul role="listbox" aria-label="Langues" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map((locale) => {
          const isActive = locale === active;
          return (
            <li key={locale}>
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                disabled={pending && isActive}
                onClick={() => handleSelect(locale)}
                className={`group flex items-center gap-3 w-full rounded-2xl border px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-kaia-accent)] ${
                  isActive
                    ? "border-[var(--color-kaia-accent)]/60 bg-[var(--color-kaia-accent)]/10"
                    : "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07]"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    isActive ? "bg-[var(--color-kaia-accent)] text-black" : "bg-white/10 text-white/50"
                  }`}
                >
                  {isActive ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : null}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-white font-medium" dir={isRtl(locale) ? "rtl" : "ltr"}>
                    {LOCALE_LABELS[locale]}
                  </span>
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-white/40 mt-0.5">
                    {locale}
                    {isRtl(locale) ? " · RTL" : null}
                    {isActive ? ` · ${labels.current}` : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
