import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const schema = z.object({
  spaceId: z.string().uuid(),
  role: z.enum(["fille", "mere"]),
  body: z.string().min(1).max(2000),
});

/** Ajoute une entrée au journal commun (membre authentifié de l'espace). */
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
      return NextResponse.json({ error: "Message invalide (1 à 2000 caractères)." }, { status: 400 });
    }
    const { spaceId, role, body } = parsed.data;

    // RLS valide l'appartenance ; insert refusé sinon.
    const { data: entry, error } = await supabase
      .from("transmission_entries")
      .insert({ space_id: spaceId, author_role: role, author_id: user.id, body })
      .select("id, author_role, body, created_at")
      .single();

    if (error || !entry) {
      console.error("Transmission entry error:", error);
      return NextResponse.json({ error: "Tu n'as pas accès à cet espace." }, { status: 403 });
    }
    return NextResponse.json({ success: true, entry });
  } catch (err) {
    console.error("Transmission entry error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
