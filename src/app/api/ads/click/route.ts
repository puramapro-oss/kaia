import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const Body = z.object({ adId: z.string().uuid() });

/** Incrémente le compteur de clics d'une annonce servie. */
export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalide." }, { status: 400 });

    const admin = createServiceClient();
    const { data: ad } = await admin
      .from("user_ads")
      .select("click_count")
      .eq("id", parsed.data.adId)
      .maybeSingle();
    if (ad) {
      await admin
        .from("user_ads")
        .update({ click_count: (ad.click_count ?? 0) + 1 })
        .eq("id", parsed.data.adId);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
