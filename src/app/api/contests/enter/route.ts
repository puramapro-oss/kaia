/**
 * POST /api/contests/enter
 *  - Body: { contestId: uuid, tickets: int 1..10, source?: string }
 *  - Auth requise
 *  - Si tokens nécessaires (achat shop) → vérifie via earn-rules ailleurs
 *  - Pour la Phase 1, l'utilisateur peut « entrer » avec des tickets gagnés
 *    (pas de spend de tokens ici — utilise /api/tokens/spend pour acheter
 *    des tickets manuellement plus tard)
 *  - Anti-abus : 50 tickets max / user / contest (DB-side via RPC)
 *  - Rate-limit : 10/min/user
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  contestId: z.string().uuid(),
  tickets: z.number().int().min(1).max(10),
  source: z
    .enum(["practice", "subscription", "referral", "ritual", "shop", "donation", "manual"])
    .default("manual"),
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
      { error: "Tu dois être connecté·e pour participer." },
      { status: 401 }
    );
  }

  const limited = await rateLimit(`contest-enter:${user.id}`, 10, 60);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Tu participes trop vite — réessaye dans quelques secondes." },
      { status: 429 }
    );
  }

  const admin = createServiceClient();
  const { data, error } = await admin.rpc("consume_contest_tickets", {
    p_contest_id: parsed.data.contestId,
    p_user_id: user.id,
    p_tickets: parsed.data.tickets,
    p_source: parsed.data.source,
  });

  // Mode dégradé si la RPC n'est pas encore en DB (migration 0004 absente)
  if (error) {
    // Fallback : insertion directe via service role + check manuel basique
    const { data: contest } = await admin
      .from("contests")
      .select("id, status, starts_at, ends_at")
      .eq("id", parsed.data.contestId)
      .maybeSingle();
    if (!contest) {
      return NextResponse.json({ error: "Concours introuvable." }, { status: 404 });
    }
    const now = new Date();
    if (
      !["upcoming", "live"].includes(contest.status as string) ||
      new Date(contest.starts_at as string) > now ||
      new Date(contest.ends_at as string) < now
    ) {
      return NextResponse.json({ error: "Concours fermé." }, { status: 409 });
    }
    const { error: insErr } = await admin.from("contest_entries").insert({
      contest_id: parsed.data.contestId,
      user_id: user.id,
      tickets: parsed.data.tickets,
      source: parsed.data.source,
    });
    if (insErr) {
      return NextResponse.json(
        { error: "Impossible d'enregistrer ta participation.", details: insErr.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, mode: "fallback" });
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.applied) {
    const reason = row?.reason ?? "unknown";
    const status =
      reason === "user_quota_exceeded" ? 429 : reason === "contest_not_found" ? 404 : 409;
    return NextResponse.json(
      { error: friendlyReason(reason), reason, totalTickets: row?.total_tickets ?? null },
      { status }
    );
  }

  return NextResponse.json({
    ok: true,
    entryId: row.entry_id,
    totalTickets: row.total_tickets,
  });
}

function friendlyReason(reason: string): string {
  switch (reason) {
    case "contest_not_found":
      return "Concours introuvable.";
    case "contest_closed":
      return "Ce concours n'accepte plus de nouvelles participations.";
    case "contest_window_invalid":
      return "Ce concours n'est pas encore ouvert.";
    case "user_quota_exceeded":
      return "Tu as atteint la limite de 50 tickets sur ce concours.";
    case "invalid_tickets":
      return "Nombre de tickets invalide.";
    case "invalid_source":
      return "Source de tickets invalide.";
    default:
      return "Participation refusée.";
  }
}
