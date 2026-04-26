import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * RevenueCat → Supabase sync (P9 entitlement `kaia_active` for iOS / Android IAP).
 * Stub for P1: validates Bearer token, parses minimal payload, updates plan.
 * Full event handling (renewal, cancellation, billing issues) lands in P9.
 */
const RevenueCatEvent = z
  .object({
    event: z.object({
      type: z.string(),
      app_user_id: z.string(),
      entitlement_ids: z.array(z.string()).default([]),
      expiration_at_ms: z.number().nullish(),
    }),
  })
  .passthrough();

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RevenueCatEvent.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { type, app_user_id, entitlement_ids, expiration_at_ms } = parsed.data.event;
  const isActive = entitlement_ids.includes("kaia_active");
  const supabase = createServiceClient();

  if (type === "INITIAL_PURCHASE" || type === "RENEWAL" || type === "PRODUCT_CHANGE") {
    await supabase
      .from("profiles")
      .update({
        plan: isActive ? "active" : "free",
        subscription_current_period_end: expiration_at_ms
          ? new Date(expiration_at_ms).toISOString()
          : null,
      })
      .eq("id", app_user_id);
  } else if (type === "CANCELLATION" || type === "EXPIRATION") {
    await supabase
      .from("profiles")
      .update({ plan: "canceled" })
      .eq("id", app_user_id);
  }

  return NextResponse.json({ ok: true, type });
}
