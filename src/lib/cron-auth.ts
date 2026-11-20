/**
 * Auth CRON partagée (CLAUDE.md §11). Source unique pour la vérification des
 * routes cron/admin déclenchées par Vercel Cron ou manuellement.
 *
 * Politique unique (évite la divergence fail-open/fail-closed constatée entre
 * routes) :
 *  - `CRON_SECRET` défini → accepte `Authorization: Bearer <secret>` ou
 *    `?secret=<secret>`.
 *  - `CRON_SECRET` absent → refuse toute requête, y compris en développement.
 *    L'en-tête Host est fourni par le client et ne constitue pas une identité.
 *    Les appels locaux doivent également configurer et présenter le secret.
 */
import type { NextRequest } from "next/server";

export function isAuthorizedCron(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return true;
  return new URL(request.url).searchParams.get("secret") === expected;
}
