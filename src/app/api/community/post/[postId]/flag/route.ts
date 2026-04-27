/**
 * POST /api/community/post/[postId]/flag — signalement user.
 * Auto-hide à >= 3 flags via service role. Idempotent par (post_id, user_id).
 *
 * Stockage idempotency : on tente un INSERT dans `community_comments` avec
 * content='__flag__' + hidden=true (cascade-delete suit le post). C'est une
 * légère exploitation de la table existante mais évite une nouvelle migration.
 *
 * Note : si la migration P5 (community_reactions) a été déployée en prod, ce
 * pattern marche. Sinon le service role bumps quand-même flagged_by_user_count.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const FLAG_THRESHOLD = 3;
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

  const rl = await rateLimit(`community-flag:${user.id}`, 20, 3600);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de signalements aujourd'hui." }, { status: 429 });
  }

  const admin = createServiceClient();

  // Vérifie que le post existe
  const { data: post } = await admin
    .from("community_posts")
    .select("id, flagged_by_user_count, hidden")
    .eq("id", parsed.data.postId)
    .single();
  if (!post) {
    return NextResponse.json({ error: "Post introuvable." }, { status: 404 });
  }

  // Marqueur idempotent via community_comments (hidden=true, content sentinel par user_id).
  // On vérifie d'abord pour éviter un double-incrément (pas d'unique constraint sur ce triplet).
  const flagMarker = `__flag_by_${user.id}__`;
  const { count: existingFlag } = await admin
    .from("community_comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", parsed.data.postId)
    .eq("user_id", user.id)
    .eq("content", flagMarker);

  if (existingFlag && existingFlag > 0) {
    return NextResponse.json({ alreadyFlagged: true });
  }

  const { error: markerErr } = await admin.from("community_comments").insert({
    post_id: parsed.data.postId,
    user_id: user.id,
    content: flagMarker,
    hidden: true,
    ai_moderation_status: "approved",
  });

  if (markerErr) {
    return NextResponse.json(
      { error: "Signalement impossible.", details: markerErr.message },
      { status: 500 },
    );
  }

  const newCount = (post.flagged_by_user_count ?? 0) + 1;
  const shouldHide = !post.hidden && newCount >= FLAG_THRESHOLD;

  await admin
    .from("community_posts")
    .update({
      flagged_by_user_count: newCount,
      hidden: shouldHide ? true : post.hidden,
      ai_moderation_status: shouldHide ? "flagged" : undefined,
    })
    .eq("id", parsed.data.postId);

  return NextResponse.json({
    flagged: true,
    flagCount: newCount,
    autoHidden: shouldHide,
  });
}
