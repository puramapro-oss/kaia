"use client";

import { useState } from "react";
import { Heart, MessageCircle, Flag, Plus, X } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Post {
  id: string;
  content: string;
  reactions_count: number;
  comments_count: number;
  created_at: string;
}

export default function CommunauteClient({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [showForm, setShowForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePost = async () => {
    if (!newContent.trim() || newContent.length > 280) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/community/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent, anonymous: true }),
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts([newPost, ...posts]);
        setNewContent("");
        setShowForm(false);
      }
    } catch (error) {
      console.error("Failed to post:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/post/${postId}/like`, {
        method: "POST",
      });

      if (res.ok) {
        setPosts(posts.map((p) =>
          p.id === postId
            ? { ...p, reactions_count: p.reactions_count + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error("Failed to like:", error);
    }
  };

  const handleFlag = async (postId: string) => {
    if (!confirm("Signaler ce message comme inapproprié ?")) return;

    try {
      await fetch(`/api/community/post/${postId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "inappropriate" }),
      });
      alert("Signalement enregistré. Nous examinerons ce contenu.");
    } catch (error) {
      console.error("Failed to flag:", error);
    }
  };

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">
          Communauté Sacrée
        </h1>
        <p className="text-[var(--foreground-muted)] text-sm">
          Partages anonymes et inspirations du cycle
        </p>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-[var(--foreground-muted)]">
              Sois la première à partager ton expérience du cycle. 🌙
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="glass rounded-2xl p-5">
              <p className="text-sm mb-4 leading-relaxed">{post.content}</p>
              <div className="flex items-center gap-4 text-[var(--foreground-muted)] text-xs">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-1.5 hover:text-[var(--kaia-rose)] transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  <span>{post.reactions_count}</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments_count}</span>
                </div>
                <button
                  onClick={() => handleFlag(post.id)}
                  className="flex items-center gap-1.5 hover:text-red-400 transition-colors ml-auto"
                >
                  <Flag className="w-4 h-4" />
                </button>
                <span className="text-[10px]">{formatRelativeTime(post.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm ? (
        <div className="fixed inset-x-0 bottom-0 p-5 bg-[var(--background)] border-t border-[var(--kaia-moon)]/20 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Partager</span>
            <button onClick={() => setShowForm(false)} className="p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value.slice(0, 280))}
            placeholder="Partage ton expérience du cycle de manière anonyme..."
            className="w-full bg-[var(--kaia-soft)] rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--kaia-moon)]/40 min-h-[120px]"
            maxLength={280}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-[var(--foreground-muted)]">
              {newContent.length}/280
            </span>
            <button
              onClick={handlePost}
              disabled={!newContent.trim() || submitting}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "..." : "Publier"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
