import { Suspense } from "react";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { type CommunityPost } from "@/components/community/PostCard";
import { hasLiked } from "@/lib/community/atomic";
import { Feed } from "./Feed";

export const metadata = {
  title: "Communauté — KAÏA",
  description: "Le fil de la communauté KAÏA — témoignages, encouragements, partages.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

async function loadInitialPosts(currentUserId: string): Promise<CommunityPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_posts")
    .select(
      "id, user_id, content, media_url, media_kind, reactions_count, comments_count, ai_moderation_status, created_at",
    )
    .eq("hidden", false)
    .neq("ai_moderation_status", "rejected")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  const posts = data ?? [];
  if (posts.length === 0) return [];

  // Auteurs en batch (service role pour bypass RLS profiles self_read)
  const authorIds = Array.from(new Set(posts.map((p) => p.user_id)));
  const admin = createServiceClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", authorIds);
  const authors = Object.fromEntries(
    (profiles ?? []).map((p) => [
      p.id,
      { display_name: p.full_name ?? null, avatar_url: p.avatar_url ?? null },
    ]),
  );

  // Likes user courant (RPC-aware avec fallback service-role)
  const liked = await hasLiked(supabase, currentUserId, posts.map((p) => p.id));

  return posts.map((p) => ({
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
}

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/community");

  const initialPosts = await loadInitialPosts(user.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80">
          <Users className="h-3 w-3" strokeWidth={2} />
          Communauté
        </span>
        <h1 className="font-display text-3xl text-white tracking-tight">
          Le fil de KAÏA
        </h1>
        <p className="text-sm text-white/55 leading-relaxed">
          Partages, ressentis, encouragements. 280 caractères. Modération bienveillante.
        </p>
      </header>

      <Suspense fallback={null}>
        <Feed initialPosts={initialPosts} />
      </Suspense>
    </div>
  );
}
