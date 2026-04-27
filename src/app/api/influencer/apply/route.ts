/**
 * POST /api/influencer/apply — Candidature au programme influenceur (P6, BRIEF §9.1).
 *
 *  - Auth obligatoire
 *  - Form Zod : socials, audience_size, niche, pitch
 *  - Crée ou met à jour `kaia.influencer_applications` (UNIQUE user_id) en status `pending`
 *  - Admin valide ensuite via /admin/influencers (P8)
 *  - Rate limit : 3 candidatures / 24h / user (anti-spam)
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({
  socials: z
    .object({
      instagram: z.string().trim().max(60).optional(),
      tiktok: z.string().trim().max(60).optional(),
      youtube: z.string().trim().max(60).optional(),
      twitter: z.string().trim().max(60).optional(),
      website: z.string().trim().url().max(200).optional(),
    })
    .partial()
    .refine(
      (s) => Object.values(s).some((v) => v && v.length > 0),
      "Au moins un réseau social est requis."
    ),
  audienceSize: z.number().int().min(0).max(100_000_000).optional(),
  niche: z.string().trim().min(2).max(80).optional(),
  pitch: z.string().trim().min(20).max(800),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Formulaire incomplet.", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tu dois être connecté·e." }, { status: 401 });
  }

  const { allowed } = await rateLimit(`inf-apply:${user.id}`, 3, 86_400);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de candidatures aujourd'hui. Réessaie demain." },
      { status: 429 }
    );
  }

  const { data, error } = await supabase
    .from("influencer_applications")
    .upsert(
      {
        user_id: user.id,
        socials: parsed.data.socials,
        audience_size: parsed.data.audienceSize ?? null,
        pitch: parsed.data.pitch,
        status: "pending",
      },
      { onConflict: "user_id" }
    )
    .select("id, status, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Impossible d'enregistrer ta candidature.", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    application: { id: data.id, status: data.status, createdAt: data.created_at },
    message:
      "Candidature reçue. Tissma valide les profils sous 48h. Tu recevras un mail dès que ton lien personnel est prêt.",
  });
}
