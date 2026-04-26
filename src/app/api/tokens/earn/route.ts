import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { EARN_RULES, type EarnReason } from "@/lib/tokens/earn-rules";
import { DAILY_TOKEN_CAP } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * Liste des raisons que l'utilisateur peut déclencher depuis le client.
 * Les raisons `serverOnly: true` (donations, cashback, referral) ne sont JAMAIS
 * autorisées via cet endpoint — seules les routes dédiées (webhook Stripe,
 * cron, etc.) peuvent les appliquer en passant par le service client.
 */
const CLIENT_REASONS = (Object.keys(EARN_RULES) as EarnReason[]).filter(
  (k) => !EARN_RULES[k].serverOnly,
) as [EarnReason, ...EarnReason[]];

const Body = z.object({
  reason: z.enum(CLIENT_REASONS),
  amount: z.number().int().positive().max(500).optional(),
  idempotencyKey: z.string().min(8).max(80).optional(),
  metadata: z.record(z.unknown()).optional(),
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

  // Rate limit user-level (60 ops / minute / user) — les routes critiques
  // (complete-session) ont leurs propres limites côté API plus permissives.
  const rl = await rateLimit(`tokens-earn:${user.id}`, 60, 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes, ralentis un instant." },
      { status: 429 },
    );
  }

  const rule = EARN_RULES[parsed.data.reason];
  const delta = parsed.data.amount ?? rule.baseTokens;
  if (delta <= 0) {
    return NextResponse.json(
      { error: "Montant invalide pour cette raison." },
      { status: 400 },
    );
  }

  // RPC nécessite le service client (security definer côté SQL gère l'autorisation).
  const admin = createServiceClient();
  const { data, error } = await admin.rpc("apply_token_event", {
    p_user_id: user.id,
    p_delta: delta,
    p_reason: parsed.data.reason,
    p_metadata: parsed.data.metadata ?? {},
    p_idempotency_key: parsed.data.idempotencyKey ?? null,
    p_daily_cap: DAILY_TOKEN_CAP,
  });

  if (error) {
    return NextResponse.json(
      { error: "Impossible d'appliquer les tokens.", details: error.message },
      { status: 500 },
    );
  }

  // RPC renvoie un setof — Postgres → array
  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    newBalance: row?.new_balance ?? 0,
    applied: row?.applied ?? false,
    reason: row?.reason ?? "unknown",
    delta,
  });
}
