/**
 * ADS internes §17 — règles métier (pures, testables).
 * Une annonce est financée par un budget en tokens VIDA ; chaque diffusion
 * (serve) coûte `AD_COST_PER_SERVE`. L'annonce cesse d'être servie quand son
 * budget restant ne couvre plus une diffusion, ou hors fenêtre/statut.
 */

export type AdPlacement = "feed" | "home";
export type AdModerationStatus = "pending" | "approved" | "rejected";

export const AD_MIN_BUDGET_TOKENS = 50;
export const AD_MAX_BUDGET_TOKENS = 5000;
export const AD_COST_PER_SERVE = 1;

export interface ServableAd {
  id: string;
  placement: AdPlacement;
  active: boolean;
  moderation_status: AdModerationStatus;
  budget_tokens: number;
  spent_tokens: number;
  start_at: string | null;
  end_at: string | null;
}

/** Budget valide pour une nouvelle annonce ? */
export function isValidBudget(tokens: number): boolean {
  return Number.isInteger(tokens) && tokens >= AD_MIN_BUDGET_TOKENS && tokens <= AD_MAX_BUDGET_TOKENS;
}

/** Budget restant (jamais négatif). */
export function remainingBudget(ad: Pick<ServableAd, "budget_tokens" | "spent_tokens">): number {
  return Math.max(0, ad.budget_tokens - ad.spent_tokens);
}

/** L'annonce peut-elle être diffusée maintenant pour ce placement ? */
export function adIsServable(ad: ServableAd, placement: AdPlacement, nowMs: number): boolean {
  if (!ad.active || ad.moderation_status !== "approved" || ad.placement !== placement) return false;
  if (remainingBudget(ad) < AD_COST_PER_SERVE) return false;
  if (ad.start_at && nowMs < new Date(ad.start_at).getTime()) return false;
  if (ad.end_at && nowMs > new Date(ad.end_at).getTime()) return false;
  return true;
}

/**
 * Sélectionne l'annonce à diffuser parmi des candidates : rotation équitable
 * (la moins servie d'abord, départage par budget restant le plus élevé).
 * Renvoie null si aucune n'est servable.
 */
export function pickAdToServe(ads: ServableAd[], placement: AdPlacement, nowMs: number): ServableAd | null {
  const servable = ads.filter((a) => adIsServable(a, placement, nowMs));
  if (servable.length === 0) return null;
  return servable.sort((a, b) => {
    if (a.spent_tokens !== b.spent_tokens) return a.spent_tokens - b.spent_tokens;
    return remainingBudget(b) - remainingBudget(a);
  })[0];
}
