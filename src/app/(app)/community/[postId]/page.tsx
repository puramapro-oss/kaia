import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { PostCard, type CommunityPost } from "@/components/community/PostCard";
import { CommentList } from "@/components/community/CommentList";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;

  // Validation UUID basique pour éviter une 500 sur input garbage
  if (!/^[0-9a-f-]{36}$/i.test(postId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/community/${postId}`);

  const { data: post } = await supabase
    .from("community_posts")
    .select(
      "id, user_id, content, media_url, media_kind, reactions_count, comments_count, ai_moderation_status, created_at",
    )
    .eq("id", postId)
    .eq("hidden", false)
    .neq("ai_moderation_status", "rejected")
    .maybeSingle();

  if (!post) notFound();

  const admin = createServiceClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", post.user_id)
    .maybeSingle();

  const { data: reacts } = await supabase
    .from("community_reactions")
    .select("post_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  const card: CommunityPost = {
    id: post.id,
    content: post.content,
    mediaUrl: post.media_url,
    mediaKind: post.media_kind,
    reactionsCount: post.reactions_count,
    commentsCount: post.comments_count,
    moderationStatus: post.ai_moderation_status,
    createdAt: post.created_at,
    author: {
      display_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
    isLikedByMe: !!reacts,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white wellness-anim"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.7} />
        Retour au fil
      </Link>

      <PostCard post={card} />

      <section className="space-y-3">
        <h2 className="font-display text-lg text-white/85">Commentaires</h2>
        <CommentList postId={post.id} initialCount={post.comments_count} />
      </section>
    </div>
  );
}
