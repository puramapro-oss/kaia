import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { buildInvite, invitePath, type TransmissionRole } from "@/lib/transmission/invite";

export const dynamic = "force-dynamic";

/** Crée l'espace de transmission de l'utilisatrice (owner = fille) s'il n'existe pas. */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Un seul espace possédé par utilisatrice (réutilise l'existant).
    const { data: existing } = await supabase
      .from("transmission_spaces")
      .select("id, invite_token, guest_allowed")
      .eq("owner_id", user.id)
      .maybeSingle();

    let space = existing;
    if (!space) {
      const body = await req.json().catch(() => ({}));
      const inviteeAge: number | undefined =
        typeof body?.inviteeAge === "number" ? body.inviteeAge : undefined;
      // Token opaque 256-bit (secret de partage long-lived) — base64url.
      const token = randomBytes(32).toString("base64url");
      const invite = buildInvite({
        spaceId: "pending",
        token,
        role: "mere",
        inviteeAge,
        issuedAt: Date.now(),
      });
      const { data: created, error } = await supabase
        .from("transmission_spaces")
        .insert({
          owner_id: user.id,
          invite_token: token,
          guest_allowed: invite.guestAllowed,
        })
        .select("id, invite_token, guest_allowed")
        .single();
      if (error || !created) {
        console.error("Transmission space create error:", error);
        return NextResponse.json({ error: "Création impossible pour le moment." }, { status: 500 });
      }
      space = created;
    }

    const role: TransmissionRole = "mere";
    const invite = buildInvite({
      spaceId: space.id,
      token: space.invite_token,
      role,
      issuedAt: Date.now(),
    });
    return NextResponse.json({ spaceId: space.id, invitePath: invitePath(invite) });
  } catch (err) {
    console.error("Transmission space error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
