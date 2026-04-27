"use client";
import { useCallback, useState } from "react";
import { Composer } from "@/components/community/Composer";
import { PostCard, type CommunityPost } from "@/components/community/PostCard";

interface FeedResponse {
  posts: CommunityPost[];
  nextCursor: string | null;
}

export function Feed({ initialPosts }: { initialPosts: CommunityPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/community/post");
      if (res.ok) {
        const data = (await res.json()) as FeedResponse;
        setPosts(data.posts);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <div className="space-y-5">
      <Composer onPosted={refresh} />

      {refreshing ? (
        <p className="text-center text-white/40 text-xs py-1">Actualisation…</p>
      ) : null}

      {posts.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center space-y-2">
          <p className="text-white/70 text-sm">
            La communauté n'a encore rien partagé.
          </p>
          <p className="text-white/40 text-xs">Sois la première personne à écrire.</p>
        </div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
