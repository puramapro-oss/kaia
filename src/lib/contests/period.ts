/**
 * Calcule les bornes de période pour un concours weekly / monthly / yearly.
 * Tous les calculs en UTC (les CRON Vercel tournent en UTC).
 */

export type Cadence = "weekly" | "monthly" | "yearly";

export interface PeriodWindow {
  startsAt: Date;
  endsAt: Date;
  drawAt: Date;
  slug: string; // ex: "2026-W18", "2026-04", "2026"
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function isoWeek(d: Date): { year: number; week: number } {
  // Algo ISO 8601 week date
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: t.getUTCFullYear(), week };
}

export function currentWeeklyWindow(now: Date = new Date()): PeriodWindow {
  // Semaine ISO : lundi 00:00:00 UTC → dimanche 23:59:59 UTC
  const dayOfWeek = now.getUTCDay() || 7; // 1..7
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (dayOfWeek - 1), 0, 0, 0)
  );
  const sunday = new Date(monday.getTime() + 7 * 86400000 - 1000);
  const drawAt = new Date(
    Date.UTC(sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate(), 20, 0, 0)
  );
  const { year, week } = isoWeek(monday);
  return {
    startsAt: monday,
    endsAt: sunday,
    drawAt,
    slug: `${year}-W${pad2(week)}`,
  };
}

export function currentMonthlyWindow(now: Date = new Date()): PeriodWindow {
  const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const firstOfNext = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  const lastDay = new Date(firstOfNext.getTime() - 1000);
  const drawAt = new Date(
    Date.UTC(firstOfNext.getUTCFullYear(), firstOfNext.getUTCMonth(), 1, 12, 0, 0)
  );
  const slug = `${firstOfMonth.getUTCFullYear()}-${pad2(firstOfMonth.getUTCMonth() + 1)}`;
  return { startsAt: firstOfMonth, endsAt: lastDay, drawAt, slug };
}

export function currentYearlyWindow(now: Date = new Date()): PeriodWindow {
  const firstOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0));
  const lastOfYear = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59));
  const drawAt = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 30, 0));
  return {
    startsAt: firstOfYear,
    endsAt: lastOfYear,
    drawAt,
    slug: `${firstOfYear.getUTCFullYear()}`,
  };
}

export function windowFor(cadence: Cadence, now: Date = new Date()): PeriodWindow {
  switch (cadence) {
    case "weekly":
      return currentWeeklyWindow(now);
    case "monthly":
      return currentMonthlyWindow(now);
    case "yearly":
      return currentYearlyWindow(now);
  }
}
