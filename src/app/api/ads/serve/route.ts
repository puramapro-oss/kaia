import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { pickAdToServe, AD_COST_PER_SERVE, type AdPlacement, type ServableAd } from "@/lib/ads/rules";

export const dynamic = "force-dynamic";

/** Renvoie une annonce à diffuser pour un placement, et facture une diffusion. */
export async function GET(req: NextRequest) {
  try {
    const placementParam = req.nextUrl.searchParams.get("placement");
    const placement: AdPlacement = placementParam === "home" ? "home" : "feed";

    const admin = createServiceClient();
    const { data: candidates } = await admin
      .from("user_ads")
      .select("id, placement, active, moderation_status, budget_tokens, spent_tokens, served_count, start_at, end_at, title, body, cta_label, cta_url")
      .eq("placement", placement)
      .eq("active", true)
      .eq("moderation_status", "approved")
      .limit(100);

    const list = candidates ?? [];
    const pick = pickAdToServe(list as unknown as ServableAd[], placement, Date.now());
    if (!pick) return NextResponse.json({ ad: null });

    const full = list.find((c) => c.id === pick.id)!;

    // Facture la diffusion (compteurs + budget consommé).
    await admin
      .from("user_ads")
      .update({
        spent_tokens: pick.spent_tokens + AD_COST_PER_SERVE,
        served_count: (full.served_count ?? 0) + 1,
      })
      .eq("id", pick.id);

    return NextResponse.json({
      ad: { id: full.id, title: full.title, body: full.body, ctaLabel: full.cta_label, ctaUrl: full.cta_url },
    });
  } catch (err) {
    console.error("Ad serve error:", err);
    return NextResponse.json({ ad: null });
  }
}
