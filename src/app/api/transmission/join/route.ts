import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { INVITE_TTL_MS } from "@/lib/transmission/invite";

export const dynamic = "force-dynamic";

const schema = z.object({
  spaceId: z.string().uuid(),
  token: z.string().min(1),
});

/** Une invitée authentifiée rejoint l'espace via le token du lien. */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Lien d'invitation invalide." }, { status: 400 });
    }
    const { spaceId, token } = parsed.data;

    // Validation du token via service client (RLS by-pass contrôlé).
    const admin = createServiceClient();
    const { data: space } = await admin
      .from("transmission_spaces")
      .select("id, owner_id, guest_id, invite_token, created_at")
      .eq("id", spaceId)
      .maybeSingle();

    if (!space || space.invite_token !== token) {
      return NextResponse.json({ error: "Ce lien n'est plus valide." }, { status: 404 });
    }
    if (Date.now() - new Date(space.created_at).getTime() > INVITE_TTL_MS) {
      return NextResponse.json({ error: "Ce lien d'invitation a expiré." }, { status: 410 });
    }
    if (space.owner_id === user.id) {
      // L'owner suit son propre lien → rien à faire.
      return NextResponse.json({ success: true, alreadyMember: true });
    }
    if (space.guest_id && space.guest_id !== user.id) {
      return NextResponse.json({ error: "Cet espace a déjà une invitée." }, { status: 409 });
    }

    const { error } = await admin
      .from("transmission_spaces")
      .update({ guest_id: user.id })
      .eq("id", spaceId);
    if (error) {
      console.error("Transmission join error:", error);
      return NextResponse.json({ error: "Impossible de rejoindre pour le moment." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Transmission join error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
