/**
 * Rotation déterministe des thèmes de rituel hebdomadaire (BRIEF §5.8).
 * Le thème est calculé à partir du numéro de semaine ISO 8601 — donc 100% reproductible
 * et indépendant du moment où le cron tourne.
 */
import { RITUAL_THEMES, type RitualTheme } from "@/lib/agent/prompts/ritual-host";

/**
 * Retourne le numéro de semaine ISO 8601 + l'année ISO pour une date donnée.
 * ISO week-year : la semaine commence le lundi, semaine 1 = celle qui contient le premier jeudi de l'année.
 * Cf. https://en.wikipedia.org/wiki/ISO_week_date
 */
export function isoWeekYear(date: Date): { year: number; week: number } {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Day of week, Mon=1 … Sun=7
  const dayNum = target.getUTCDay() === 0 ? 7 : target.getUTCDay();
  // Move to the Thursday of the same ISO week
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const isoYear = target.getUTCFullYear();
  // Jan 1 of that year
  const jan1 = new Date(Date.UTC(isoYear, 0, 1));
  const week = 1 + Math.round(((target.getTime() - jan1.getTime()) / 86400000 - 3 + ((jan1.getUTCDay() + 6) % 7)) / 7);
  return { year: isoYear, week };
}

/** Format slug "YYYY-Www" (e.g. 2026-W18). */
export function isoWeekSlug(date: Date = new Date()): string {
  const { year, week } = isoWeekYear(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Thème déterministe par semaine ISO. Le hash est simple : (year * 53 + week) mod 6.
 * Garantit une rotation et un même thème pour la même semaine en cas de re-run.
 */
export function pickThemeForWeek(date: Date = new Date()): RitualTheme {
  const { year, week } = isoWeekYear(date);
  const idx = ((year * 53 + week) % RITUAL_THEMES.length + RITUAL_THEMES.length) % RITUAL_THEMES.length;
  return RITUAL_THEMES[idx];
}

/**
 * Bornes UTC d'une semaine ISO (lundi 00:00 → dimanche 23:59:59).
 */
export function isoWeekBounds(date: Date = new Date()): { startsAt: Date; endsAt: Date } {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = target.getUTCDay() === 0 ? 7 : target.getUTCDay();
  // Lundi de la semaine
  const monday = new Date(target);
  monday.setUTCDate(target.getUTCDate() - (dayNum - 1));
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return { startsAt: monday, endsAt: sunday };
}
