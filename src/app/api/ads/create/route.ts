import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { moderatePost } from "@/lib/community/moderate";
import { isValidBudget, AD_MIN_BUDGET_TOKENS, AD_MAX_BUDGET_TOKENS } from "@/lib/ads/rules";

export const dynamic = "force-dynamic";

const Body = z.object({
  title: z.string().min(3).max(80),
  body: z.string().max(280).optional(),
  ctaLabel: z.string().min(2).max(30),
  ctaUrl: z.string().url().max(500),
  placement: z.enum(["feed", "home"]),
  budgetTokens: z.number().int(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Champs invalides." }, { status: 400 });
    }
    const { title, body, ctaLabel, ctaUrl, placement, budgetTokens } = parsed.data;

    if (!isValidBudget(budgetTokens)) {
      return NextResponse.json(
        { error: `Budget entre ${AD_MIN_BUDGET_TOKENS} et ${AD_MAX_BUDGET_TOKENS} tokens.` },
        { status: 400 }
      );
    }

    // Modération IA (réutilise la modération communauté).
    const moderation = await moderatePost(`${title}\n${body ?? ""}`);
    if (moderation.decision === "rejected") {
      return NextResponse.json({ error: moderation.explanation }, { status: 422 });
    }
    const moderationStatus = moderation.decision === "approved" ? "approved" : "pending";

    const admin = createServiceClient();

    // Solde suffisant ? (apply_token_event ne refuse pas l'overspend sur delta négatif).
    const { data: tokens } = await admin
      .from("user_tokens")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    if ((tokens?.balance ?? 0) < budgetTokens) {
      return NextResponse.json({ error: "Solde de tokens insuffisant." }, { status: 402 });
    }

    // Débit du budget.
    const slug = `ad-${randomBytes(6).toString("hex")}`;
    const { data: deb } = await admin.rpc("apply_token_event", {
      p_user_id: user.id,
      p_delta: -budgetTokens,
      p_reason: "ad_budget",
      p_metadata: { slug, placement },
      p_idempotency_key: `ad-budget-${slug}`,
      p_daily_cap: 200,
    });
    const debRow = Array.isArray(deb) ? deb[0] : deb;
    if (!debRow?.applied) {
      return NextResponse.json({ error: "Débit impossible. Réessaie." }, { status: 409 });
    }

    const { data: ad, error } = await admin
      .from("user_ads")
      .insert({
        user_id: user.id,
        slug,
        title,
        body: body ?? null,
        cta_label: ctaLabel,
        cta_url: ctaUrl,
        placement,
        budget_tokens: budgetTokens,
        moderation_status: moderationStatus,
        active: true,
      })
      .select("id, slug, moderation_status")
      .single();

    if (error || !ad) {
      console.error("Ad create error:", error);
      // Remboursement best-effort si l'insert échoue après débit.
      await admin.rpc("apply_token_event", {
        p_user_id: user.id,
        p_delta: budgetTokens,
        p_reason: "ad_budget_refund",
        p_metadata: { slug },
        p_idempotency_key: `ad-refund-${slug}`,
        p_daily_cap: 1_000_000,
      });
      return NextResponse.json({ error: "Création impossible. Tokens recrédités." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ad });
  } catch (err) {
    console.error("Ad create error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
