import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  meetingType: z.string().max(40).optional(),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { allowed } = await rateLimit(`terra_node:${user.id}`, 5, 86400);
    if (!allowed) {
      return NextResponse.json({ error: "Limite atteinte. Tu peux créer 5 nœuds par jour." }, { status: 429 });
    }

    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Coordonnées invalides" }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: node, error: insertError } = await service
      .from("terra_nova_nodes")
      .insert({
        user_id: user.id,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        meeting_type: parsed.data.meetingType ?? "rencontre",
      })
      .select("id")
      .single();

    if (insertError || !node) {
      console.error("[terra-nova/create-node] Insert error:", insertError);
      return NextResponse.json({ error: "Impossible de créer le nœud." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, nodeId: node.id }, { status: 201 });
  } catch (err) {
    console.error("[terra-nova/create-node] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
