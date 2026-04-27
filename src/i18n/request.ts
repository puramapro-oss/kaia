import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";
import { DEFAULT_LOCALE, type Locale } from "./locales";
import { getCurrentLocale } from "./get-locale";

/**
 * next-intl v3 server config. Lu automatiquement par NextIntlClientProvider
 * et getTranslations(). Mode cookie-based (pas de [locale] segment routing).
 *
 * Path déclaré dans next.config.ts via createNextIntlPlugin('./src/i18n/request.ts').
 */
export default getRequestConfig(async () => {
  const locale = await getCurrentLocale();
  const messages = await loadMessages(locale);
  return {
    locale,
    messages,
    timeZone: "Europe/Paris",
    now: new Date(),
  };
});

async function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
  try {
    const mod = await import(`../messages/${locale}.json`);
    return (mod.default ?? {}) as AbstractIntlMessages;
  } catch {
    if (locale === DEFAULT_LOCALE) return {} as AbstractIntlMessages;
    // Fallback robuste : si la locale n'a pas encore été générée par le script
    // de traduction, on retombe sur fr.json plutôt que de crasher l'app.
    const fallback = await import(`../messages/${DEFAULT_LOCALE}.json`);
    return (fallback.default ?? {}) as AbstractIntlMessages;
  }
}
