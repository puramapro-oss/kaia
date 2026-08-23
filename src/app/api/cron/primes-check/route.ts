/**
 * CRON `/api/cron/primes-check` — vérifie les jalons de primes Phase 1.
 * Schedule (vercel.json) : `0 3 * * *` (tous les jours 03:00 UTC).
 *
 * J1 : déclenché en P1 (webhook). J30 : 30j sans annulation → transfert 25€.
 * J60 : 60j → transfert 50€. Montants : `PRIME_AMOUNTS` (lib/constants.ts).
 * Anti-fraude : contrainte UNIQUE primes(user_id, app_id, type) (migration 0006).
 *
 * DÉFÉRÉ (pending deploy) : tant que `ENABLE_PRIMES !== "true"`, pas de transfert.
 */
import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.ENABLE_PRIMES !== "true") {
    return NextResponse.json({ ok: true, action: "deferred" });
  }

  return NextResponse.json({ ok: true, action: "pending_implementation" });
}

export const POST = GET;
