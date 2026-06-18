/**
 * CRON `/api/cron/karma-redistribution` — redistribution mensuelle KARMA.
 * Schedule (vercel.json) : `0 2 1 * *` (1er du mois 02:00 UTC).
 *
 * Logique de calcul : `computeDistribution` (lib/karma/redistribution.ts, testée).
 * DÉFÉRÉ (pending deploy) : tant que `ENABLE_KARMA_REDISTRIBUTION !== "true"`,
 * on n'exécute ni écriture de shares ni transfert Stripe. À l'activation :
 *   1. collecter le revenu du mois → computeDistribution(revenue, activités)
 *   2. insérer karma_distributions + karma_user_shares
 *   3. stamper la distribution (OpenTimestamps, lib/opentimestamps.ts)
 *   4. transferts Stripe Connect via /api/karma/payout (50% users, 10% asso)
 */
import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { distributionPeriodSlug } from "@/lib/karma/redistribution";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = distributionPeriodSlug(new Date());

  if (process.env.ENABLE_KARMA_REDISTRIBUTION !== "true") {
    return NextResponse.json({ ok: true, action: "deferred", period });
  }

  // TODO(deploy): collecte revenu + computeDistribution + écriture shares + stamp + transferts.
  return NextResponse.json({ ok: true, action: "pending_implementation", period });
}

export const POST = GET;
