/**
 * Auth CRON partagée (CLAUDE.md §11). Source unique pour la vérification des
 * routes cron/admin déclenchées par Vercel Cron ou manuellement.
 *
 * Politique unique (évite la divergence fail-open/fail-closed constatée entre
 * routes) :
 *  - `CRON_SECRET` défini → accepte `Authorization: Bearer <secret>` ou
 *    `?secret=<secret>`.
 *  - `CRON_SECRET` absent → autorise UNIQUEMENT localhost (dev local). En prod
 *    le secret est toujours défini (cf §5), donc cette branche est morte.
 */
import type { NextRequest } from "next/server";

export function isAuthorizedCron(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    const host = request.headers.get("host") ?? "";
    return host.startsWith("localhost") || host.startsWith("127.0.0.1");
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return true;
  return new URL(request.url).searchParams.get("secret") === expected;
}
