import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({
  practiceId: z.string().uuid(),
  routineId: z.string().uuid().optional(),
  preState: z
    .object({
      stress: z.number().int().min(1).max(5).optional(),
      energy: z.number().int().min(1).max(5).optional(),
      mood: z.number().int().min(1).max(5).optional(),
      note: z.string().max(280).optional(),
    })
    .optional(),
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
      { error: "Paramètres invalides.", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tu dois être connecté·e." }, { status: 401 });
  }

  const rl = await rateLimit(`practice-start:${user.id}`, 30, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de démarrages rapides." }, { status: 429 });
  }

  // Vérifie que la pratique existe et est active.
  const { data: practice, error: pracErr } = await supabase
    .from("practices")
    .select("id, slug, category, duration_seconds, premium_only, active")
    .eq("id", parsed.data.practiceId)
    .maybeSingle();
  if (pracErr || !practice) {
    return NextResponse.json({ error: "Pratique introuvable." }, { status: 404 });
  }
  if (!practice.active) {
    return NextResponse.json({ error: "Pratique non disponible." }, { status: 410 });
  }

  // Si premium_only : vérifier le plan.
  if (practice.premium_only) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.plan !== "active") {
      return NextResponse.json(
        { error: "Cette pratique est réservée aux abonné·e·s.", upgradeUrl: "/pricing" },
        { status: 402 },
      );
    }
  }

  // Si routineId fourni : vérifier qu'elle appartient à l'user.
  if (parsed.data.routineId) {
    const { data: routine } = await supabase
      .from("daily_routines")
      .select("id")
      .eq("id", parsed.data.routineId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!routine) {
      return NextResponse.json({ error: "Routine introuvable." }, { status: 404 });
    }
  }

  const { data: session, error } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      practice_id: practice.id,
      routine_id: parsed.data.routineId ?? null,
      pre_state: parsed.data.preState ?? null,
      status: "started",
    })
    .select("id, started_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Démarrage impossible.", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    sessionId: session.id,
    startedAt: session.started_at,
    practice: {
      id: practice.id,
      slug: practice.slug,
      category: practice.category,
      durationSeconds: practice.duration_seconds,
    },
  });
}
