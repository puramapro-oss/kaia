import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  caregiverFor: z.string().uuid(),
  relationship: z.string().max(60).optional(),
});

export const runtime = "nodejs";

/**
 * Relie un compte aidant·e à la personne accompagnée (avec son accord).
 * `caregiverFor` = id de la personne accompagnée. Idempotent par utilisateur.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { allowed } = await rateLimit(`caregiver_link:${user.id}`, 10, 3600);
    if (!allowed) {
      return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
    }

    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    if (parsed.data.caregiverFor === user.id) {
      return NextResponse.json({ error: "Tu ne peux pas t'accompagner toi-même." }, { status: 400 });
    }

    const service = createServiceClient();
    const { error: upsertError } = await service
      .from("caregiver_profiles")
      .upsert(
        {
          user_id: user.id,
          caregiver_for: parsed.data.caregiverFor,
          relationship: parsed.data.relationship ?? null,
          modules_unlocked: ["cycle", "emotional", "aurora", "core", "faq", "wellbeing"],
        },
        { onConflict: "user_id" },
      );

    if (upsertError) {
      console.error("[caregiver/link] Upsert error:", upsertError);
      return NextResponse.json({ error: "Impossible de créer le lien." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[caregiver/link] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
