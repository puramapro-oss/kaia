/**
 * Garde de bannissement — décision pure (testable) appliquée par le middleware.
 * Un utilisateur banni est redirigé vers /banned, sauf s'il y est déjà ou sur
 * une route publique. Fail-safe : pas de banni → jamais de blocage.
 */

export const BANNED_PATH = "/banned";

export function isBanned(bannedAt: string | null | undefined): boolean {
  return typeof bannedAt === "string" && bannedAt.length > 0;
}

export interface BanGateDecision {
  blocked: boolean;
  redirectTo?: string;
}

/**
 * @param bannedAt  profiles.banned_at (null si non banni)
 * @param pathname  route demandée
 * @param isPublic  la route est-elle publique (déjà calculé par le middleware)
 */
export function evaluateBanGate(args: {
  bannedAt: string | null | undefined;
  pathname: string;
  isPublic: boolean;
}): BanGateDecision {
  if (!isBanned(args.bannedAt)) return { blocked: false };
  // Déjà sur /banned, ou route publique (login, assets…) → on laisse passer
  // pour éviter une boucle de redirection et permettre la déconnexion.
  if (args.pathname === BANNED_PATH || args.isPublic) return { blocked: false };
  return { blocked: true, redirectTo: BANNED_PATH };
}
