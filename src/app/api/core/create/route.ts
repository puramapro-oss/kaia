import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  type: z.enum(["now", "24h", "7days"]),
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  momentZ: z.string().datetime().optional(),
  maxParticipants: z.number().int().min(2).max(10000).default(100),
  trustLevel: z.enum(["open", "member", "premium"]).default("open"),
  animalFocus: z.boolean().default(false),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { allowed } = await rateLimit(`core_create:${user.id}`, 5, 3600);
    if (!allowed) {
      return NextResponse.json(
        { error: "Limite atteinte. Tu peux créer 5 événements par heure." },
        { status: 429 },
      );
    }

    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const service = createServiceClient();
    const { data: event, error: insertError } = await service
      .from("core_events")
      .insert({
        creator_id: user.id,
        type: d.type,
        title: d.title,
        description: d.description ?? null,
        starts_at: d.startsAt,
        ends_at: d.endsAt ?? null,
        synchronization_moment_z: d.momentZ ?? null,
        max_participants: d.maxParticipants,
        trust_level: d.trustLevel,
        animal_focus: d.animalFocus,
        status: "active",
      })
      .select("id, type, title, status")
      .single();

    if (insertError || !event) {
      console.error("[core/create] Insert error:", insertError);
      return NextResponse.json({ error: "Erreur lors de la création de l'événement" }, { status: 500 });
    }

    return NextResponse.json({ eventId: event.id, title: event.title, status: event.status }, { status: 201 });
  } catch (err) {
    console.error("[core/create] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
