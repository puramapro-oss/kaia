"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart, MessageCircle, Flag, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommunityPost {
  id: string;
  content: string;
  mediaUrl: string | null;
  mediaKind: "image" | "video" | null;
  reactionsCount: number;
  commentsCount: number;
  createdAt: string;
  moderationStatus: "pending" | "approved" | "flagged" | "rejected";
  author: { display_name: string | null; avatar_url: string | null };
  isLikedByMe: boolean;
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(d);
}

export function PostCard({ post }: { post: CommunityPost }) {
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(post.isLikedByMe);
  const [count, setCount] = useState(post.reactionsCount);
  const [showMenu, setShowMenu] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const initial = (post.author.display_name ?? "K").charAt(0).toUpperCase();

  const toggleLike = () => {
    // Optimistic
    setLiked((l) => !l);
    setCount((c) => (liked ? Math.max(0, c - 1) : c + 1));
    startTransition(async () => {
      try {
        const res = await fetch(`/api/community/post/${post.id}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { action: string; reactionsCount: number };
        setLiked(data.action === "liked");
        setCount(data.reactionsCount);
      } catch {
        // Rollback
        setLiked((l) => !l);
        setCount((c) => (liked ? c + 1 : Math.max(0, c - 1)));
      }
    });
  };

  const flagPost = () => {
    setShowMenu(false);
    setFlagged(true);
    startTransition(async () => {
      try {
        await fetch(`/api/community/post/${post.id}/flag`, { method: "POST" });
      } catch {
        setFlagged(false);
      }
    });
  };

  return (
    <article className="glass rounded-3xl p-5 sm:p-6 space-y-4">
      <header className="flex items-start gap-3">
        <div
          aria-hidden
          className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--color-kaia-terracotta)] to-[var(--color-kaia-gold)] grid place-items-center text-[#1a1a1a] font-display text-sm shrink-0"
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90 truncate">
            {post.author.display_name ?? "Membre KAÏA"}
          </p>
          <p className="text-[11px] text-white/40">{timeAgo(post.createdAt)}</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            aria-label="Plus d'options"
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] wellness-anim"
          >
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.7} />
          </button>
          {showMenu ? (
            <div className="absolute right-0 top-full mt-1 z-10 w-44 rounded-xl bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 p-1 shadow-xl">
              <button
                type="button"
                onClick={flagPost}
                disabled={flagged || isPending}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/[0.05] rounded-lg disabled:opacity-50 wellness-anim"
              >
                <Flag className="h-3.5 w-3.5" strokeWidth={1.7} />
                {flagged ? "Signalé" : "Signaler"}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <Link href={`/community/${post.id}`} className="block">
        <p className="text-[15px] leading-relaxed text-white/85 whitespace-pre-wrap break-words">
          {post.content}
        </p>
      </Link>

      {post.mediaUrl && post.mediaKind === "image" ? (
        <Link href={`/community/${post.id}`} className="block">
          <img
            src={post.mediaUrl}
            alt=""
            className="w-full rounded-2xl border border-white/[0.06] max-h-[480px] object-cover"
            loading="lazy"
          />
        </Link>
      ) : null}

      <footer className="flex items-center gap-1 pt-1">
        <button
          type="button"
          onClick={toggleLike}
          disabled={isPending}
          aria-pressed={liked}
          aria-label={liked ? "Retirer le like" : "Aimer"}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm wellness-anim disabled:opacity-50",
            liked
              ? "text-[var(--color-kaia-terracotta)] bg-white/[0.04]"
              : "text-white/55 hover:text-white hover:bg-white/[0.04]",
          )}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} strokeWidth={1.7} />
          {count > 0 ? <span>{count}</span> : null}
        </button>

        <Link
          href={`/community/${post.id}`}
          aria-label={`${post.commentsCount} commentaire${post.commentsCount > 1 ? "s" : ""}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-white/55 hover:text-white hover:bg-white/[0.04] wellness-anim"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={1.7} />
          {post.commentsCount > 0 ? <span>{post.commentsCount}</span> : null}
        </Link>
      </footer>
    </article>
  );
}
