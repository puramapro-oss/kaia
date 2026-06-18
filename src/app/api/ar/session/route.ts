import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { parseConsentPayload, isConsentValid } from "@/lib/ar/consent";
import { getARProtocol } from "@/lib/ar/protocols";

const Body = z.object({
  style: z.enum(["A", "B"]),
  protocolSlug: z.string(),
  targetType: z.enum(["soi", "personne", "animal", "collectif"]),
  consentToken: z.string().min(1),
  durationSec: z.number().int().min(0).max(7200).optional(),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Flag : AR désactivé par défaut tant que WebXR n'est pas validé en prod.
    if (process.env.ENABLE_AR !== "true") {
      return NextResponse.json(
        { error: "Le Miroir Énergétique arrive bientôt." },
        { status: 403 },
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { allowed } = await rateLimit(`ar_session:${user.id}`, 20, 3600);
    if (!allowed) {
      return NextResponse.json({ error: "Trop de sessions. Réessaie plus tard." }, { status: 429 });
    }

    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const d = parsed.data;

    // Consentement OBLIGATOIRE : frais, lié à l'utilisatrice et cohérent.
    const consent = parseConsentPayload(d.consentToken);
    if (
      !consent ||
      consent.userId !== user.id ||
      consent.style !== d.style ||
      consent.protocolSlug !== d.protocolSlug ||
      !isConsentValid(consent, Date.now())
    ) {
      return NextResponse.json(
        { error: "Consentement invalide ou expiré. Re-scanne le QR avant de commencer." },
        { status: 403 },
      );
    }

    const protocol = getARProtocol(d.protocolSlug);
    if (!protocol || !protocol.targetTypes.includes(d.targetType)) {
      return NextResponse.json({ error: "Protocole incompatible avec la cible." }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: protocolRow } = await service
      .from("ar_protocols")
      .select("id")
      .eq("slug", d.protocolSlug)
      .maybeSingle();

    const { data: session, error: insertError } = await service
      .from("ar_sessions")
      .insert({
        user_id: user.id,
        consent_given_at: new Date(consent.issuedAt).toISOString(),
        style: d.style,
        target_type: d.targetType,
        protocol_id: protocolRow?.id ?? null,
        duration_sec: d.durationSec ?? null,
      })
      .select("id")
      .single();

    if (insertError || !session) {
      console.error("[ar/session] Insert error:", insertError);
      return NextResponse.json({ error: "Impossible d'enregistrer la session." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sessionId: session.id }, { status: 201 });
  } catch (err) {
    console.error("[ar/session] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
