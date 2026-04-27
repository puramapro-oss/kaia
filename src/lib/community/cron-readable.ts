/**
 * Convertit un cron 5-fields en label FR lisible (cas couverts en P5).
 * Pour chaque seed connu — extension future si nouveau format.
 */

const PATTERNS: Array<{ re: RegExp; label: string }> = [
  // 0 6 * * 1-5 → Lun-ven 7h
  { re: /^(\d+) (\d+) \* \* 1-5$/, label: "lundi → vendredi · {HOUR}h{MIN}" },
  // 0 20 * * * → Tous les jours 21h
  { re: /^(\d+) (\d+) \* \* \*$/, label: "tous les jours · {HOUR}h{MIN}" },
  // 0 9 * * 0 → Dimanche 10h
  { re: /^(\d+) (\d+) \* \* 0$/, label: "dimanche · {HOUR}h{MIN}" },
  { re: /^(\d+) (\d+) \* \* 1$/, label: "lundi · {HOUR}h{MIN}" },
  { re: /^(\d+) (\d+) \* \* 2$/, label: "mardi · {HOUR}h{MIN}" },
  { re: /^(\d+) (\d+) \* \* 3$/, label: "mercredi · {HOUR}h{MIN}" },
  { re: /^(\d+) (\d+) \* \* 4$/, label: "jeudi · {HOUR}h{MIN}" },
  { re: /^(\d+) (\d+) \* \* 5$/, label: "vendredi · {HOUR}h{MIN}" },
  { re: /^(\d+) (\d+) \* \* 6$/, label: "samedi · {HOUR}h{MIN}" },
];

/**
 * Le cron est en UTC. On l'affiche en heure de Paris (+1h hiver, +2h été).
 * Pour rester simple en P5, on assume Europe/Paris hiver (+1h). Affinable en P9 i18n.
 */
const PARIS_OFFSET_HOURS = 1;

export function formatScheduleFr(cron: string): string {
  for (const { re, label } of PATTERNS) {
    const m = cron.match(re);
    if (m) {
      const utcMin = parseInt(m[1], 10);
      const utcHour = parseInt(m[2], 10);
      const localHour = (utcHour + PARIS_OFFSET_HOURS + 24) % 24;
      const min = utcMin === 0 ? "" : utcMin.toString().padStart(2, "0");
      return label.replace("{HOUR}", String(localHour)).replace("{MIN}", min);
    }
  }
  return cron;
}
