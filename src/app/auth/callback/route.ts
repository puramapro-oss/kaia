import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { readReferralCookie } from "@/lib/referral/cookie";
import { processRefereeWelcome } from "@/lib/referral/process-welcome";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error: exchangeErr, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeErr) {
      // Si un cookie de parrainage est présent, on appaire le filleul
      // et on crédite +200 tokens bienvenue (idempotent).
      try {
        const cookieStore = await cookies();
        const refCookie = readReferralCookie(cookieStore);
        const userId = data.user?.id;
        if (refCookie?.code && userId) {
          const admin = createServiceClient();
          await processRefereeWelcome({
            admin,
            refereeUserId: userId,
            referrerCode: refCookie.code,
          });
        }
      } catch (err) {
        // Mode dégradé — on ne bloque pas le login si le pairing échoue.
        console.warn("[KAIA auth/callback] referee welcome failed:", err);
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
