import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { checkTrustGate, type TrustLevel } from "@/lib/core/trust-gate";
import type { PurityLevel } from "@/lib/constants";

const Body = z.object({ eventId: z.string().uuid() });

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { allowed } = await rateLimit(`core_join:${user.id}`, 30, 3600);
    if (!allowed) {
      return NextResponse.json({ error: "Trop de requêtes. Réessaie dans un instant." }, { status: 429 });
    }

    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const service = createServiceClient();

    const { data: event, error: eventError } = await service
      .from("core_events")
      .select("id, trust_level, max_participants, status")
      .eq("id", parsed.data.eventId)
      .single();

    if (eventError || !event || event.status !== "active") {
      return NextResponse.json({ error: "Événement introuvable ou clos." }, { status: 404 });
    }

    // Trust Gate : plan + purity_level + historique CORE (requêtes indépendantes).
    const [{ data: profile }, { count: completed }] = await Promise.all([
      service.from("profiles").select("plan, purity_level").eq("id", user.id).single(),
      service
        .from("core_participations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("moment_z_synced", true),
    ]);

    const gate = checkTrustGate({
      trustLevel: (event.trust_level ?? "open") as TrustLevel,
      plan: profile?.plan ?? "free",
      purityLevel: (profile?.purity_level ?? "aube") as PurityLevel,
      coreEventsCompleted: completed ?? 0,
    });

    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason }, { status: 403 });
    }

    // Capacité.
    const { count: current } = await service
      .from("core_participations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id);

    if ((current ?? 0) >= (event.max_participants ?? 100)) {
      return NextResponse.json({ error: "Cet événement est complet." }, { status: 409 });
    }

    const { error: upsertError } = await service
      .from("core_participations")
      .upsert(
        { event_id: event.id, user_id: user.id },
        { onConflict: "event_id,user_id", ignoreDuplicates: true },
      );

    if (upsertError) {
      console.error("[core/join] Upsert error:", upsertError);
      return NextResponse.json({ error: "Impossible de rejoindre l'événement." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, participantsCount: (current ?? 0) + 1 }, { status: 200 });
  } catch (err) {
    console.error("[core/join] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
