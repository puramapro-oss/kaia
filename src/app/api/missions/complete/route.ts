/**
 * POST /api/missions/complete
 *  - Body : { missionId: uuid, proofUrl: string }
 *  - Anti-fraude :
 *      • account_age >= 7 jours
 *      • proof URL doit être http(s)
 *      • même proof_url ne peut pas valider 2 missions distinctes (DB unique partial index)
 *      • max_completions_per_user respecté
 *  - Phase 1 : status='pending', tokens crédités à la validation admin (P8).
 *  - Mission auto-validée (proof_kind='api') ne passe PAS par cette route — elle est créditée
 *    directement par l'événement métier (streak / 1ʳᵉ routine / etc).
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { isAccountAgeOk, isProofUrlValid } from "@/lib/missions/anti-fraud";

const Body = z.object({
  missionId: z.string().uuid(),
  proofUrl: z.string().min(1).max(2000),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Tu dois être connecté·e pour envoyer une preuve." },
      { status: 401 }
    );
  }

  const limited = await rateLimit(`mission-complete:${user.id}`, 6, 300);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Trop d'envois — patiente quelques minutes." },
      { status: 429 }
    );
  }

  // Anti-fraude account age
  if (!isAccountAgeOk(user.created_at ?? "")) {
    return NextResponse.json(
      {
        error:
          "Ton compte doit avoir au moins 7 jours pour soumettre une preuve. Ça nous protège des bots — merci de ta patience.",
      },
      { status: 403 }
    );
  }

  // Validation URL
  const urlCheck = isProofUrlValid(parsed.data.proofUrl);
  if (!urlCheck.valid) {
    return NextResponse.json(
      { error: "URL de preuve invalide. Utilise un lien https public." },
      { status: 400 }
    );
  }

  const admin = createServiceClient();

  // Mission existe ?
  const { data: mission } = await admin
    .from("missions")
    .select("id, slug, kind, proof_kind, max_completions, reward_tokens, active")
    .eq("id", parsed.data.missionId)
    .maybeSingle();
  if (!mission || !mission.active) {
    return NextResponse.json({ error: "Mission introuvable." }, { status: 404 });
  }
  if (mission.proof_kind === "api") {
    return NextResponse.json(
      { error: "Cette mission est validée automatiquement par l'app." },
      { status: 409 }
    );
  }

  // Quota par user
  if (mission.max_completions != null) {
    const { count } = await supabase
      .from("mission_completions")
      .select("id", { count: "exact", head: true })
      .eq("mission_id", mission.id)
      .in("status", ["approved", "pending"]);
    if ((count ?? 0) >= (mission.max_completions as number)) {
      return NextResponse.json(
        { error: "Limite atteinte pour cette mission." },
        { status: 409 }
      );
    }
  }

  // Anti dedupe : même proof_url + même mission par n'importe quel user → rejet
  const { data: dupeProof } = await admin
    .from("mission_completions")
    .select("id, user_id")
    .eq("mission_id", mission.id)
    .eq("proof_url", parsed.data.proofUrl.trim())
    .maybeSingle();
  if (dupeProof) {
    return NextResponse.json(
      { error: "Cette preuve a déjà été utilisée." },
      { status: 409 }
    );
  }

  const { data: completion, error: insErr } = await admin
    .from("mission_completions")
    .insert({
      mission_id: mission.id,
      user_id: user.id,
      proof_url: parsed.data.proofUrl.trim(),
      status: "pending",
    })
    .select("id")
    .single();
  if (insErr || !completion) {
    return NextResponse.json(
      { error: "Impossible d'enregistrer ta preuve.", details: insErr?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    completionId: completion.id,
    status: "pending",
    note: "Validation admin sous 48 h.",
  });
}
