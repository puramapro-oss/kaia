/**
 * GET /api/newsletter/track?c=campaign&e=email&t=open|click[&u=url]
 *  - Pixel tracking pour open
 *  - 302 redirect pour click (avec URL passée en query &u=)
 *  - Met à jour newsletter_sends.opened_at / clicked_at (best-effort)
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAEAAAUAAcXLZb4AAAAASUVORK5CYII=",
  "base64"
);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const campaign = url.searchParams.get("c");
  const email = url.searchParams.get("e");
  const type = url.searchParams.get("t") ?? "open";
  const target = url.searchParams.get("u");

  // Best-effort logging
  if (campaign && email) {
    try {
      const admin = createServiceClient();
      const update: Record<string, string> = {};
      if (type === "open") update.opened_at = new Date().toISOString();
      if (type === "click") update.clicked_at = new Date().toISOString();
      if (Object.keys(update).length > 0) {
        await admin
          .from("newsletter_sends")
          .update(update)
          .eq("campaign_slug", campaign)
          .eq("email", email)
          .is(type === "open" ? "opened_at" : "clicked_at", null);
      }
    } catch {
      // ignore
    }
  }

  if (type === "click" && target) {
    try {
      const targetUrl = new URL(target);
      if (targetUrl.protocol === "http:" || targetUrl.protocol === "https:") {
        return NextResponse.redirect(targetUrl.toString(), { status: 302 });
      }
    } catch {
      // bad URL, fall through
    }
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
