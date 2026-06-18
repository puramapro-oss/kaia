// Astronomical lunar phase calculation (no external deps)
export type LunarPhase =
  | "nouvelle_lune"
  | "premier_croissant"
  | "premier_quartier"
  | "gibbeuse_croissante"
  | "pleine_lune"
  | "gibbeuse_decroissante"
  | "dernier_quartier"
  | "dernier_croissant";

export interface LunarInfo {
  phase: LunarPhase;
  illumination: number; // 0-1
  emoji: string;
  label: string;
  daysUntilFull: number;
  daysSinceNew: number;
}

// Known new moon reference: 2000-01-06 18:14 UTC (J2000 epoch)
const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z").getTime();
const LUNAR_CYCLE_MS = 29.530588853 * 24 * 60 * 60 * 1000;

export function getLunarPhase(date = new Date()): LunarInfo {
  const elapsed = date.getTime() - KNOWN_NEW_MOON;
  const cyclePos = ((elapsed % LUNAR_CYCLE_MS) + LUNAR_CYCLE_MS) % LUNAR_CYCLE_MS;
  const daysSinceNew = cyclePos / (24 * 60 * 60 * 1000);
  const fraction = cyclePos / LUNAR_CYCLE_MS;

  // Illumination approximation
  const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * fraction));

  let phase: LunarPhase;
  if (daysSinceNew < 1.85) phase = "nouvelle_lune";
  else if (daysSinceNew < 7.38) phase = "premier_croissant";
  else if (daysSinceNew < 9.22) phase = "premier_quartier";
  else if (daysSinceNew < 13.77) phase = "gibbeuse_croissante";
  else if (daysSinceNew < 15.61) phase = "pleine_lune";
  else if (daysSinceNew < 20.16) phase = "gibbeuse_decroissante";
  else if (daysSinceNew < 22.01) phase = "dernier_quartier";
  else if (daysSinceNew < 27.68) phase = "dernier_croissant";
  else phase = "nouvelle_lune";

  const daysToFull = daysSinceNew < 14.77
    ? 14.77 - daysSinceNew
    : LUNAR_CYCLE_MS / (24 * 60 * 60 * 1000) - daysSinceNew + 14.77;

  const META: Record<LunarPhase, { emoji: string; label: string }> = {
    nouvelle_lune: { emoji: "🌑", label: "Nouvelle Lune" },
    premier_croissant: { emoji: "🌒", label: "Premier Croissant" },
    premier_quartier: { emoji: "🌓", label: "Premier Quartier" },
    gibbeuse_croissante: { emoji: "🌔", label: "Gibbeuse Croissante" },
    pleine_lune: { emoji: "🌕", label: "Pleine Lune" },
    gibbeuse_decroissante: { emoji: "🌖", label: "Gibbeuse Décroissante" },
    dernier_quartier: { emoji: "🌗", label: "Dernier Quartier" },
    dernier_croissant: { emoji: "🌘", label: "Dernier Croissant" },
  };

  return {
    phase,
    illumination,
    emoji: META[phase].emoji,
    label: META[phase].label,
    daysUntilFull: Math.round(daysToFull * 10) / 10,
    daysSinceNew: Math.floor(daysSinceNew),
  };
}

export function getLunarCalendar(startDate: Date, days = 28): Array<{ date: Date; lunar: LunarInfo }> {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return { date, lunar: getLunarPhase(date) };
  });
}
