/**
 * POST /api/community/post/[postId]/like — toggle like via RPC apply_reaction (atomique).
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Params = z.object({ postId: z.string().uuid() });

export async function POST(
  request: NextRequest,
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

  const { data, error } = await supabase.rpc("apply_reaction", {
    p_post_id: parsed.data.postId,
    p_kind: "like",
  });

  if (error) {
    if (error.code === "P0002") {
      return NextResponse.json({ error: "Post introuvable." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Like impossible.", details: error.message },
      { status: 500 },
    );
  }

  // RPC retourne un row [{action, reactions_count}]
  const result = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    action: result?.action ?? "liked",
    reactionsCount: result?.reactions_count ?? 0,
  });
}
