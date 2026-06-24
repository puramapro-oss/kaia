/**
 * POST /api/admin/update-pricing
 *  - Body : { plan: 'essentiel'|'infini'|'legende', priceId: string }
 *  - Auth : admin session (requireAdmin)
 *  - Met à jour dynamiquement l'ID de prix Stripe dans la config runtime
 *    (ne modifie PAS le code source — écrit dans admin_config table)
 *  - Les prix hardcodés dans lib/stripe.ts (montants en centimes) restent fixes.
 *    Seul l'ID price_ Stripe peut être override ici.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";

export const runtime = "nodejs";

const Body = z.object({
  plan: z.enum(["essentiel", "infini", "legende"]),
  priceId: z.string().startsWith("price_"),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

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
      { status: 400 },
    );
  }

  const { admin, userId, ip } = guard;
  const { plan, priceId } = parsed.data;

  const configKey = `stripe_price_${plan}`;

  const { error } = await admin.from("admin_config").upsert(
    {
      key: configKey,
      value: priceId,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    // Fallback: table might not exist yet — return 503 w/ instructions
    return NextResponse.json(
      {
        error: "Table admin_config absente. Migre la DB (migration 0008).",
        details: error.message,
      },
      { status: 503 },
    );
  }

  await admin.rpc("log_admin_audit", {
    p_admin_user_id: userId,
    p_action: "pricing_updated",
    p_target_table: "admin_config",
    p_target_id: configKey,
    p_before: null,
    p_after: { plan, priceId },
    p_ip: ip,
  });

  return NextResponse.json({ ok: true, plan, priceId });
}
