/**
 * Notifications intelligentes — sélection respectueuse : 7 types, max 2/jour,
 * fenêtre 8h-21h (heure locale), opt-out granulaire par type, priorité.
 * Fonctions pures (l'heure et l'état du jour sont passés en paramètres).
 */

export type NotificationType =
  | "cycle_phase"
  | "aurora_daily"
  | "core_now"
  | "circle_match"
  | "karma_game"
  | "luna_daily"
  | "prime_milestone";

/** Ordre de priorité décroissant : les plus utiles passent en premier. */
export const NOTIFICATION_PRIORITY: NotificationType[] = [
  "prime_milestone",
  "cycle_phase",
  "core_now",
  "circle_match",
  "aurora_daily",
  "karma_game",
  "luna_daily",
];

export const MAX_PER_DAY = 2;
export const WINDOW_START_HOUR = 8;
export const WINDOW_END_HOUR = 21;

export interface NotificationCandidate {
  type: NotificationType;
  title: string;
  body: string;
}

export interface SelectInput {
  candidates: NotificationCandidate[];
  /** Types désactivés par l'utilisatrice. */
  optOut?: Set<NotificationType>;
  /** Nombre déjà envoyé aujourd'hui. */
  sentTodayCount?: number;
  /** Heure locale (0-23). */
  hourLocal: number;
}

/** Vrai si l'heure locale est dans la fenêtre respectueuse [8h, 21h]. */
export function isWithinWindow(hourLocal: number): boolean {
  return hourLocal >= WINDOW_START_HOUR && hourLocal <= WINDOW_END_HOUR;
}

function priorityIndex(type: NotificationType): number {
  const i = NOTIFICATION_PRIORITY.indexOf(type);
  return i < 0 ? Number.MAX_SAFE_INTEGER : i;
}

/**
 * Sélectionne les notifications à envoyer maintenant : hors-fenêtre → aucune ;
 * filtre opt-out ; dédoublonne par type ; trie par priorité ; limite au reste
 * du quota quotidien.
 */
export function selectNotifications(input: SelectInput): NotificationCandidate[] {
  const { candidates, optOut, sentTodayCount = 0, hourLocal } = input;

  if (!isWithinWindow(hourLocal)) return [];

  const remaining = Math.max(0, MAX_PER_DAY - sentTodayCount);
  if (remaining === 0) return [];

  const seen = new Set<NotificationType>();
  const eligible = candidates.filter((c) => {
    if (optOut?.has(c.type)) return false;
    if (seen.has(c.type)) return false;
    seen.add(c.type);
    return true;
  });

  eligible.sort((a, b) => priorityIndex(a.type) - priorityIndex(b.type));
  return eligible.slice(0, remaining);
}
