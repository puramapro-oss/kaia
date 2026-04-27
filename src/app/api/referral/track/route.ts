/**
 * GET /api/referral/track?code=xxxx
 *
 *  - Lookup `profiles.referral_code` (service role)
 *  - Set cookie `kaia_ref` httpOnly 30j
 *  - Pas de tracking de click pour le parrainage (privacy ami-ami)
 *  - Réponse JSON : { ok, referrer: { code, displayName } }
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  REFERRAL_COOKIE_NAME,
  REFERRAL_COOKIE_OPTIONS,
  serializeReferralCookie,
} from "@/lib/referral/cookie";
import { rateLimit } from "@/lib/rate-limit";
import { extractIpFromHeaders } from "@/lib/influencer/tracking";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawCode = (url.searchParams.get("code") ?? "").trim().toLowerCase();

  if (!rawCode || !/^[a-z0-9-]{4,32}$/.test(rawCode)) {
    return NextResponse.json({ error: "Code invalide." }, { status: 400 });
  }

  const ip = extractIpFromHeaders(request.headers);
  const { allowed } = await rateLimit(`ref-track:${ip ?? "anon"}`, 60, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const admin = createServiceClient();
  const { data: referrer, error } = await admin
    .from("profiles")
    .select("id, full_name, referral_code")
    .eq("referral_code", rawCode)
    .maybeSingle();

  if (error || !referrer) {
    return NextResponse.json({ error: "Code parrain introuvable." }, { status: 404 });
  }

  const response = NextResponse.json({
    ok: true,
    referrer: {
      code: referrer.referral_code,
      displayName: referrer.full_name ?? "Un·e Kaïanaute",
    },
  });

  response.cookies.set(
    REFERRAL_COOKIE_NAME,
    serializeReferralCookie({
      code: referrer.referral_code as string,
      clickedAt: new Date().toISOString(),
    }),
    REFERRAL_COOKIE_OPTIONS
  );

  return response;
}
