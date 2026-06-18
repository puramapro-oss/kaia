import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

const Body = z.object({
  circleId: z.string().uuid(),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const { circleId } = parsed.data;

    const serviceClient = createServiceClient();

    const { data: circle, error: circleError } = await serviceClient
      .from("intention_circles")
      .select("id, max_participants, status")
      .eq("id", circleId)
      .single();

    if (circleError || !circle) {
      return NextResponse.json({ error: "Cercle introuvable" }, { status: 404 });
    }

    if (circle.status !== "open") {
      return NextResponse.json({ joined: false, message: "Cercle fermé ou en cours" }, { status: 400 });
    }

    const { count, error: countError } = await serviceClient
      .from("circle_participants")
      .select("id", { count: "exact", head: true })
      .eq("circle_id", circleId)
      .is("left_at", null);

    if (countError) {
      console.error("[cercles/join] Count error:", countError);
      return NextResponse.json({ error: "Erreur lors de la vérification des participants" }, { status: 500 });
    }

    if ((count ?? 0) >= circle.max_participants) {
      return NextResponse.json({ joined: false, message: "Cercle complet" }, { status: 400 });
    }

    const { error: insertError } = await serviceClient
      .from("circle_participants")
      .upsert(
        { circle_id: circleId, user_id: user.id, joined_at: new Date().toISOString() },
        { onConflict: "circle_id,user_id", ignoreDuplicates: true }
      );

    if (insertError) {
      console.error("[cercles/join] Insert error:", insertError);
      return NextResponse.json({ error: "Erreur lors de l'inscription au cercle" }, { status: 500 });
    }

    return NextResponse.json({ joined: true, message: "Rejoindre le cercle avec succès" }, { status: 200 });
  } catch (err) {
    console.error("[cercles/join] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
