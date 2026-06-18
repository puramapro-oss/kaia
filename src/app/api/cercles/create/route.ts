import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  theme: z.string().min(3).max(200),
  maxParticipants: z.number().int().min(2).max(20).default(12),
  guidageMode: z.number().int().min(1).max(8).optional(),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { allowed } = await rateLimit(`cercles_create:${user.id}`, 3, 3600);
    if (!allowed) {
      return NextResponse.json(
        { error: "Limite atteinte. Tu peux créer 3 cercles par heure." },
        { status: 429 }
      );
    }

    const json = await request.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const { theme, maxParticipants, guidageMode } = parsed.data;

    const serviceClient = createServiceClient();
    const { data: circle, error: insertError } = await serviceClient
      .from("intention_circles")
      .insert({
        facilitator_id: user.id,
        theme,
        max_participants: maxParticipants,
        guidage_mode: guidageMode ?? 1,
        audio_only: true,
        rotation_enabled: true,
        status: "open",
        livekit_room_name: null,
      })
      .select("id, theme, status")
      .single();

    if (insertError || !circle) {
      console.error("[cercles/create] Insert error:", insertError);
      return NextResponse.json({ error: "Erreur lors de la création du cercle" }, { status: 500 });
    }

    return NextResponse.json(
      { circleId: circle.id, theme: circle.theme, status: circle.status },
      { status: 201 }
    );
  } catch (err) {
    console.error("[cercles/create] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
