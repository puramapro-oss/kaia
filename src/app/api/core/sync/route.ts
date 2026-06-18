import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { computeCoherence } from "@/lib/core/coherence";

const Body = z.object({
  eventId: z.string().uuid(),
  dualSyncWith: z.string().uuid().optional(),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { allowed } = await rateLimit(`core_sync:${user.id}`, 60, 3600);
    if (!allowed) {
      return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
    }

    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const service = createServiceClient();
    const { error: updateError } = await service
      .from("core_participations")
      .update({
        moment_z_synced: true,
        dual_sync_with: parsed.data.dualSyncWith ?? null,
      })
      .eq("event_id", parsed.data.eventId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[core/sync] Update error:", updateError);
      return NextResponse.json({ error: "Synchronisation impossible." }, { status: 500 });
    }

    const [{ count: total }, { count: synced }] = await Promise.all([
      service
        .from("core_participations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", parsed.data.eventId),
      service
        .from("core_participations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", parsed.data.eventId)
        .eq("moment_z_synced", true),
    ]);

    const coherence = computeCoherence({
      syncedCount: synced ?? 0,
      totalCount: total ?? 0,
    });

    return NextResponse.json({ ok: true, coherence, syncedCount: synced ?? 0, totalCount: total ?? 0 });
  } catch (err) {
    console.error("[core/sync] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
