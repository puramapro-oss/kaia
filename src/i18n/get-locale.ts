import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, pickLocaleFromHeader, type Locale } from "./locales";

/**
 * Server-only helper. Lit la locale dans cet ordre :
 * 1. Cookie `kaia_locale` (override utilisateur explicite)
 * 2. Header Accept-Language (détection auto navigateur)
 * 3. DEFAULT_LOCALE (fr)
 */
export async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieValue && isLocale(cookieValue)) {
    return cookieValue;
  }

  const headerStore = await headers();
  return pickLocaleFromHeader(headerStore.get("accept-language"));
}

export async function getCookieLocale(): Promise<Locale | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : null;
}
