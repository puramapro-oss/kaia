/**
 * KARMA — redistribution mensuelle. Split 50/10/40 (50% users actifs | 10% asso
 * | 40% SASU) puis répartition du pool users au prorata de l'activité (sessions
 * + jeux) du mois. Fonctions pures et déterministes.
 *
 * Source de vérité du split : `splitRevenue` (lib/karma.ts). Ici on ne fait que
 * répartir le pool users entre les contributrices.
 */
import { splitRevenue, type RevenueSplit } from "@/lib/karma";

export interface UserActivity {
  userId: string;
  /** Score d'activité du mois (sessions AURORA + jeux KARMA + missions). */
  activity: number;
}

export interface UserShare {
  userId: string;
  activity: number;
  shareCents: number;
}

export interface Distribution extends RevenueSplit {
  totalRevenueCents: number;
  shares: UserShare[];
}

/** Slug de période mensuelle `YYYY-MM` (UTC). `now` passé en paramètre. */
export function distributionPeriodSlug(now: Date): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Calcule la distribution complète d'un mois.
 * Le pool users est réparti au prorata de l'`activity` ; le reste d'arrondi est
 * attribué à la contributrice la plus active (déterministe) pour que la somme
 * des parts == usersPool exactement.
 */
export function computeDistribution(
  totalRevenueCents: number,
  activities: UserActivity[],
): Distribution {
  const split = splitRevenue(totalRevenueCents);
  const totalActivity = activities.reduce((sum, a) => sum + Math.max(0, a.activity), 0);

  if (totalActivity === 0 || activities.length === 0) {
    return { ...split, totalRevenueCents, shares: [] };
  }

  const shares: UserShare[] = activities.map((a) => ({
    userId: a.userId,
    activity: a.activity,
    shareCents: Math.floor((Math.max(0, a.activity) / totalActivity) * split.users),
  }));

  // Remainder d'arrondi → contributrice la plus active (index stable).
  const distributed = shares.reduce((sum, s) => sum + s.shareCents, 0);
  const remainder = split.users - distributed;
  if (remainder > 0 && shares.length > 0) {
    let topIdx = 0;
    for (let i = 1; i < shares.length; i++) {
      if (shares[i].activity > shares[topIdx].activity) topIdx = i;
    }
    shares[topIdx].shareCents += remainder;
  }

  return { ...split, totalRevenueCents, shares };
}
