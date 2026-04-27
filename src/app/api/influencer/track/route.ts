/**
 * GET /api/influencer/track?code=XXXX
 *
 *  - Lookup le lien (service role pour passer la RLS publique)
 *  - Set cookie `kaia_inf` httpOnly 30j
 *  - Insère un click anonymisé (sha256 IP + UA)
 *  - Réponse JSON : { ok, link: { id, code, promoActiveUntil, promoDiscountPercent } }
 *
 * Public (utilisé par client component sur /i/[code]).
 * Anti-abuse : rate limit 60 / min / IP.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  INFLUENCER_COOKIE_NAME,
  INFLUENCER_COOKIE_OPTIONS,
  serializeInfluencerCookie,
} from "@/lib/influencer/cookie";
import {
  hashIp,
  hashUserAgent,
  extractIpFromHeaders,
  extractCountryFromHeaders,
} from "@/lib/influencer/tracking";
import { rateLimit } from "@/lib/rate-limit";
import { isValidCodeFormat } from "@/lib/influencer/codes";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = (url.searchParams.get("code") ?? "").trim().toUpperCase();
  if (!code || !isValidCodeFormat(code)) {
    return NextResponse.json({ error: "Code invalide." }, { status: 400 });
  }

  const ip = extractIpFromHeaders(request.headers);
  const ipHash = hashIp(ip);
  const ua = request.headers.get("user-agent");

  // Anti-abuse : 60 hits/min/IP
  const rlKey = `inf-track:${ipHash ?? "anon"}`;
  const { allowed } = await rateLimit(rlKey, 60, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const admin = createServiceClient();
  const { data: link, error } = await admin
    .from("influencer_links")
    .select("id, code, active, promo_active_until, promo_discount_percent, custom_landing_url")
    .eq("code", code)
    .eq("active", true)
    .maybeSingle();

  if (error || !link) {
    return NextResponse.json({ error: "Lien introuvable ou désactivé." }, { status: 404 });
  }

  // Best-effort click insert (graceful si table 0003 absente)
  const country = extractCountryFromHeaders(request.headers);
  await admin
    .from("influencer_link_clicks")
    .insert({
      link_id: link.id,
      ip_hash: ipHash,
      ua_hash: hashUserAgent(ua),
      country_code: country,
      referer: request.headers.get("referer")?.slice(0, 500) ?? null,
    })
    .then(() => undefined, () => undefined);

  const response = NextResponse.json({
    ok: true,
    link: {
      id: link.id,
      code: link.code,
      promoActiveUntil: link.promo_active_until ?? null,
      promoDiscountPercent: link.promo_discount_percent ?? 50,
      customLandingUrl: link.custom_landing_url ?? null,
    },
  });

  response.cookies.set(
    INFLUENCER_COOKIE_NAME,
    serializeInfluencerCookie({
      linkId: link.id,
      code: link.code,
      clickedAt: new Date().toISOString(),
    }),
    INFLUENCER_COOKIE_OPTIONS
  );

  return response;
}
