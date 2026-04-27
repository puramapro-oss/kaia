/**
 * GET  /api/community/post — feed paginé (20 derniers, non-hidden, ai_moderation_status != 'rejected')
 * POST /api/community/post — créer un post (modération IA in-line)
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { moderatePost, MAX_POST_LENGTH } from "@/lib/community/moderate";
import { hasLiked } from "@/lib/community/atomic";

export const runtime = "nodejs";
export const maxDuration = 30;

const PostBody = z.object({
  content: z.string().trim().min(1).max(MAX_POST_LENGTH),
  mediaUrl: z.string().url().optional(),
  mediaKind: z.enum(["image", "video"]).optional(),
});

const PAGE_SIZE = 20;
const POST_RATE_LIMIT = { limit: 5, window: 60 }; // 5 posts / min / user

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Auth requise." }, { status: 401 });
  }

  let query = supabase
    .from("community_posts")
    .select(
      "id, user_id, content, media_url, media_kind, reactions_count, comments_count, ai_moderation_status, created_at",
    )
    .eq("hidden", false)
    .neq("ai_moderation_status", "rejected")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Lecture impossible.", details: error.message }, { status: 500 });
  }

  // Récupérer les profils auteurs en batch (RLS profiles : self_read seulement → service client lecture restreinte aux champs publics)
  const authorIds = Array.from(new Set((data ?? []).map((p) => p.user_id)));
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

  // Récupérer les likes du user courant (RPC-aware avec fallback)
  const liked = await hasLiked(supabase, user.id, (data ?? []).map((p) => p.id));

  const posts = (data ?? []).map((p) => ({
    id: p.id,
    content: p.content,
    mediaUrl: p.media_url,
    mediaKind: p.media_kind,
    reactionsCount: p.reactions_count,
    commentsCount: p.comments_count,
    moderationStatus: p.ai_moderation_status,
    createdAt: p.created_at,
    author: authors[p.user_id] ?? { display_name: null, avatar_url: null },
    isLikedByMe: liked.has(p.id),
  }));

  const nextCursor = posts.length === PAGE_SIZE ? posts[posts.length - 1].createdAt : null;

  return NextResponse.json({ posts, nextCursor });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Auth requise." }, { status: 401 });
  }

  const rl = await rateLimit(`community-post:${user.id}`, POST_RATE_LIMIT.limit, POST_RATE_LIMIT.window);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de publications. Reviens dans 1 min." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = PostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { content, mediaUrl, mediaKind } = parsed.data;

  // Modération IA pré-publication
  const moderation = await moderatePost(content);
  if (moderation.decision === "rejected") {
    return NextResponse.json(
      {
        error: moderation.explanation,
        decision: moderation.decision,
        reasons: moderation.reasons,
      },
      { status: 422 },
    );
  }

  // Insert via auth client (RLS self_insert) — l'auteur insère son propre post
  const { data: inserted, error: insertErr } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      content,
      media_url: mediaUrl ?? null,
      media_kind: mediaKind ?? null,
      ai_moderation_status: moderation.decision,
      ai_moderation_reasons: moderation.reasons,
      hidden: false,
    })
    .select("id, content, created_at, ai_moderation_status")
    .single();

  if (insertErr) {
    return NextResponse.json(
      { error: "Création impossible.", details: insertErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    post: {
      id: inserted.id,
      content: inserted.content,
      createdAt: inserted.created_at,
      moderationStatus: inserted.ai_moderation_status,
    },
    moderation: {
      decision: moderation.decision,
      reasons: moderation.reasons,
      explanation: moderation.explanation,
    },
  });
}
