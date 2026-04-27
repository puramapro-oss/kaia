/**
 * POST /api/community/post/[postId]/like — toggle like.
 * Utilise apply_reaction RPC si la migration P5 est appliquée, sinon fallback service-role.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { applyReactionWithFallback } from "@/lib/community/atomic";

export const runtime = "nodejs";

const Params = z.object({ postId: z.string().uuid() });

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ postId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Auth requise." }, { status: 401 });
  }

  const params = await ctx.params;
  const parsed = Params.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  const rl = await rateLimit(`community-like:${user.id}`, 30, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de likes. Reviens dans 1 min." }, { status: 429 });
  }

  try {
    const result = await applyReactionWithFallback(supabase, user.id, parsed.data.postId);
    return NextResponse.json({
      action: result.action,
      reactionsCount: result.reactionsCount,
    });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    if (e.code === "P0002") {
      return NextResponse.json({ error: "Post introuvable." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Like impossible.", details: e.message ?? "unknown" },
      { status: 500 },
    );
  }
}
