/**
 * GET  /api/community/post/[postId]/comment — liste des commentaires non-hidden
 * POST /api/community/post/[postId]/comment — créer un commentaire (modération IA)
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { moderatePost, MAX_POST_LENGTH } from "@/lib/community/moderate";
import { bumpCommentsCountWithFallback } from "@/lib/community/atomic";

export const runtime = "nodejs";
export const maxDuration = 30;

const Params = z.object({ postId: z.string().uuid() });
const Body = z.object({
  content: z.string().trim().min(1).max(MAX_POST_LENGTH),
});

export async function GET(
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

  // hidden=false exclut déjà les sentinels (like/flag → hidden=true). Sécurité supplémentaire :
  // on filtre les contenus marqueurs au cas où.
  const { data, error } = await supabase
    .from("community_comments")
    .select("id, user_id, content, created_at")
    .eq("post_id", parsed.data.postId)
    .eq("hidden", false)
    .not("content", "like", "__like_by_%")
    .not("content", "like", "__flag_by_%")
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
  }

  // Profils auteurs (lecture publique limitée via service role)
  const authorIds = Array.from(new Set((data ?? []).map((c) => c.user_id)));
  let authors: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
  if (authorIds.length > 0) {
    const admin = createServiceClient();
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", authorIds);
    authors = Object.fromEntries(
      (profiles ?? []).map((p) => [
        p.id,
        { display_name: p.full_name ?? null, avatar_url: p.avatar_url ?? null },
      ]),
    );
  }

  const comments = (data ?? []).map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.created_at,
    author: authors[c.user_id] ?? { display_name: null, avatar_url: null },
  }));

  return NextResponse.json({ comments });
}

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
  const parsedParams = Params.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

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

  const rl = await rateLimit(`community-comment:${user.id}`, 10, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de commentaires. Reviens dans 1 min." }, { status: 429 });
  }

  // Modération
  const moderation = await moderatePost(parsed.data.content);
  if (moderation.decision === "rejected") {
    return NextResponse.json(
      { error: moderation.explanation, decision: moderation.decision },
      { status: 422 },
    );
  }

  // Insert commentaire (RLS self_insert)
  const { data: inserted, error: insertErr } = await supabase
    .from("community_comments")
    .insert({
      post_id: parsedParams.data.postId,
      user_id: user.id,
      content: parsed.data.content,
      ai_moderation_status: moderation.decision,
      hidden: false,
    })
    .select("id, content, created_at")
    .single();

  if (insertErr) {
    return NextResponse.json(
      { error: "Commentaire impossible.", details: insertErr.message },
      { status: 500 },
    );
  }

  // Increment counter atomique (RPC si dispo, fallback service-role sinon)
  const newCount = await bumpCommentsCountWithFallback(supabase, parsedParams.data.postId, 1);

  return NextResponse.json({
    comment: {
      id: inserted.id,
      content: inserted.content,
      createdAt: inserted.created_at,
    },
    commentsCount: newCount,
  });
}
