/**
 * Helpers atomiques community avec fallback service-role.
 *
 * Si la migration P5 (`0002_p5_community.sql`) est appliquée, on utilise les RPC
 * (apply_reaction, bump_post_comments_count, join_weekly_ritual) — atomiques côté DB.
 *
 * Sinon, fallback service-role : INSERT/UPDATE direct via `createServiceClient`.
 * Le fallback assume une faible probabilité de collision (P5 trafic léger).
 *
 * Détection : code Postgres `42P01` (table absent) ou PostgREST `PGRST202` (RPC absent).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/admin";

interface RpcMissingError {
  code?: string;
  message?: string;
}

function isMissingArtifact(err: RpcMissingError | null | undefined): boolean {
  if (!err) return false;
  // PostgREST : PGRST202 (RPC introuvable), PGRST205 (table introuvable)
  if (err.code === "PGRST202" || err.code === "PGRST205") return true;
  // Postgres natif : 42P01 (relation does not exist), 42883 (function does not exist)
  if (err.code === "42P01" || err.code === "42883") return true;
  // Suite à une erreur 'auth required' depuis la fonction security definer (P0001)
  if (err.code === "P0001") return true;
  // Message brut (PostgREST renvoie parfois sans code)
  const msg = err.message ?? "";
  if (/community_reactions|apply_reaction|bump_post_comments_count|join_weekly_ritual/i.test(msg) &&
      /not.*found|does not exist|schema cache/i.test(msg)) {
    return true;
  }
  return false;
}

/**
 * Like / unlike d'un post.
 * Retourne l'action ("liked" | "unliked") + le nouveau count.
 */
export async function applyReactionWithFallback(
  authClient: SupabaseClient,
  userId: string,
  postId: string,
): Promise<{ action: "liked" | "unliked"; reactionsCount: number }> {
  // 1) Tentative RPC (fast path)
  const { data: rpcData, error: rpcErr } = await authClient.rpc("apply_reaction", {
    p_post_id: postId,
    p_kind: "like",
  });

  if (!rpcErr) {
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    return {
      action: (row?.action as "liked" | "unliked") ?? "liked",
      reactionsCount: row?.reactions_count ?? 0,
    };
  }

  if (!isMissingArtifact(rpcErr)) {
    throw new Error(`apply_reaction RPC failed: ${rpcErr.message}`);
  }

  // 2) Fallback service-role : tracker via community_comments avec content sentinel
  const admin = createServiceClient();
  const sentinel = `__like_by_${userId}__`;

  const { data: existing } = await admin
    .from("community_comments")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .eq("content", sentinel)
    .maybeSingle();

  if (existing) {
    // Unlike : supprimer le sentinel + decrement counter
    await admin.from("community_comments").delete().eq("id", existing.id);
    const { data: post } = await admin
      .from("community_posts")
      .select("reactions_count")
      .eq("id", postId)
      .single();
    const newCount = Math.max(0, (post?.reactions_count ?? 0) - 1);
    await admin
      .from("community_posts")
      .update({ reactions_count: newCount })
      .eq("id", postId);
    return { action: "unliked", reactionsCount: newCount };
  }

  // Like : insérer sentinel + increment counter
  const { error: insertErr } = await admin.from("community_comments").insert({
    post_id: postId,
    user_id: userId,
    content: sentinel,
    hidden: true,
    ai_moderation_status: "approved",
  });
  if (insertErr) {
    throw new Error(`Like fallback insert failed: ${insertErr.message}`);
  }

  const { data: post } = await admin
    .from("community_posts")
    .select("reactions_count")
    .eq("id", postId)
    .single();
  const newCount = (post?.reactions_count ?? 0) + 1;
  await admin
    .from("community_posts")
    .update({ reactions_count: newCount })
    .eq("id", postId);

  return { action: "liked", reactionsCount: newCount };
}

/** Bump comments_count atomique avec fallback. */
export async function bumpCommentsCountWithFallback(
  authClient: SupabaseClient,
  postId: string,
  delta: 1 | -1,
): Promise<number | null> {
  const { data: rpcData, error: rpcErr } = await authClient.rpc("bump_post_comments_count", {
    p_post_id: postId,
    p_delta: delta,
  });

  if (!rpcErr && typeof rpcData === "number") {
    return rpcData;
  }

  if (rpcErr && !isMissingArtifact(rpcErr)) {
    return null;
  }

  // Fallback : service role direct UPDATE
  const admin = createServiceClient();
  const { data: post } = await admin
    .from("community_posts")
    .select("comments_count")
    .eq("id", postId)
    .single();
  if (!post) return null;
  const next = Math.max(0, (post.comments_count ?? 0) + delta);
  await admin
    .from("community_posts")
    .update({ comments_count: next })
    .eq("id", postId);
  return next;
}

/** Vérifie si l'utilisateur a déjà liké un post (fallback aware). */
export async function hasLiked(
  authClient: SupabaseClient,
  userId: string,
  postIds: string[],
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  // Tentative RPC-aware : lecture sur community_reactions (RLS self_read)
  const { data: reacts, error: reactErr } = await authClient
    .from("community_reactions")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (!reactErr) {
    return new Set((reacts ?? []).map((r) => r.post_id));
  }

  if (!isMissingArtifact(reactErr)) {
    return new Set();
  }

  // Fallback : sentinel dans community_comments
  const sentinel = `__like_by_${userId}__`;
  const admin = createServiceClient();
  const { data: comments } = await admin
    .from("community_comments")
    .select("post_id")
    .eq("user_id", userId)
    .eq("content", sentinel)
    .in("post_id", postIds);
  return new Set((comments ?? []).map((c) => c.post_id));
}

export interface RitualJoinResult {
  status: "joined" | "already_joined";
  participantsCount: number;
  alreadyJoined: boolean;
}

/** Rejoindre un rituel hebdo idempotent avec fallback. */
export async function joinRitualWithFallback(
  authClient: SupabaseClient,
  userId: string,
  ritualId: string,
): Promise<RitualJoinResult> {
  const { data: rpcData, error: rpcErr } = await authClient.rpc("join_weekly_ritual", {
    p_ritual_id: ritualId,
  });

  if (!rpcErr) {
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    return {
      status: (row?.status as "joined" | "already_joined") ?? "joined",
      participantsCount: row?.participants_count ?? 0,
      alreadyJoined: !!row?.already_joined,
    };
  }

  if (!isMissingArtifact(rpcErr)) {
    // Erreur métier ré-émise (P0010 = pas commencé, P0011 = terminé, P0002 = inconnu)
    throw rpcErr;
  }

  // Fallback service-role : insert idempotent + bump counter
  const admin = createServiceClient();

  const { data: ritual } = await admin
    .from("weekly_rituals")
    .select("id, starts_at, ends_at, participants_count")
    .eq("id", ritualId)
    .maybeSingle();
  if (!ritual) {
    throw Object.assign(new Error("ritual not found"), { code: "P0002" });
  }
  const now = new Date();
  if (now < new Date(ritual.starts_at)) {
    throw Object.assign(new Error("ritual not started yet"), { code: "P0010" });
  }
  if (now > new Date(ritual.ends_at)) {
    throw Object.assign(new Error("ritual ended"), { code: "P0011" });
  }

  // Idempotency check
  const { data: existing } = await admin
    .from("ritual_participations")
    .select("id")
    .eq("ritual_id", ritualId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return {
      status: "already_joined",
      participantsCount: ritual.participants_count ?? 0,
      alreadyJoined: true,
    };
  }

  await admin.from("ritual_participations").insert({
    ritual_id: ritualId,
    user_id: userId,
    tokens_earned: 30,
  });

  const next = (ritual.participants_count ?? 0) + 1;
  await admin
    .from("weekly_rituals")
    .update({ participants_count: next })
    .eq("id", ritualId);

  return { status: "joined", participantsCount: next, alreadyJoined: false };
}
