import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { validateSpend, type SpendKind } from "@/lib/tokens/spend-rules";

export const runtime = "nodejs";

const SpendKinds = [
  "promo_subscription_pct",
  "contest_ticket",
  "shop_product",
  "donation_unlock",
  "vip_ritual_access",
] as const satisfies readonly SpendKind[];

const Body = z.object({
  kind: z.enum(SpendKinds),
  discountPct: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(50)]).optional(),
  itemCostTokens: z.number().int().positive().optional(),
  productId: z.string().uuid().optional(),
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

  const rl = await rateLimit(`tokens-spend:${user.id}`, 30, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const { data: tokens, error: tokensErr } = await supabase
    .from("user_tokens")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();
  if (tokensErr) {
    return NextResponse.json(
      { error: "Solde indisponible.", details: tokensErr.message },
      { status: 500 },
    );
  }

  const balance = tokens?.balance ?? 0;
  const validation = validateSpend(parsed.data.kind, balance, {
    discountPct: parsed.data.discountPct,
    itemCostTokens: parsed.data.itemCostTokens,
  });

  if (!validation.ok) {
    if (validation.reason === "insufficient_balance") {
      return NextResponse.json(
        {
          error: `Tu as ${validation.have} tokens, il en faut ${validation.needed}.`,
          needed: validation.needed,
          have: validation.have,
        },
        { status: 402 },
      );
    }
    return NextResponse.json({ error: "Type d'échange invalide." }, { status: 400 });
  }

  const admin = createServiceClient();
  const { data, error } = await admin.rpc("apply_token_event", {
    p_user_id: user.id,
    p_delta: -validation.cost,
    p_reason: `spend_${parsed.data.kind}`,
    p_metadata: {
      kind: parsed.data.kind,
      discountPct: parsed.data.discountPct ?? null,
      productId: parsed.data.productId ?? null,
      ...(parsed.data.metadata ?? {}),
    },
    p_idempotency_key: parsed.data.idempotencyKey ?? null,
  });

  if (error) {
    return NextResponse.json(
      { error: "Impossible de finaliser la dépense.", details: error.message },
      { status: 500 },
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    newBalance: row?.new_balance ?? 0,
    applied: row?.applied ?? false,
    reason: row?.reason ?? "unknown",
    cost: validation.cost,
  });
}
