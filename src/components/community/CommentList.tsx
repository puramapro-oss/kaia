"use client";
import { useState, useTransition, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { display_name: string | null; avatar_url: string | null };
}

const MAX = 280;

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

export function CommentList({
  postId,
  initialCount,
}: {
  postId: string;
  initialCount: number;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX - draft.trim().length;
  const tooLong = remaining < 0;
  const empty = draft.trim().length === 0;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/community/post/${postId}/comment`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: { comments: Comment[] }) => {
        if (!cancelled) setComments(data.comments);
      })
      .catch(() => {
        if (!cancelled) setError("Lecture impossible.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const submit = () => {
    if (empty || tooLong || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/community/post/${postId}/comment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: draft.trim() }),
        });
        if (res.status === 422) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? "Commentaire rejeté.");
          return;
        }
        if (!res.ok) {
          setError("Envoi impossible.");
          return;
        }
        const data = (await res.json()) as {
          comment: Comment;
          commentsCount: number | null;
        };
        // Ajout optimiste — l'API ne renvoie pas l'auteur, on l'auto-remplit
        setComments((prev) => [
          ...prev,
          {
            ...data.comment,
            author: { display_name: "Toi", avatar_url: null },
          },
        ]);
        setCount(data.commentsCount ?? count + 1);
        setDraft("");
      } catch {
        setError("Envoi impossible.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4 space-y-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Réponds avec bienveillance…"
          rows={2}
          aria-label="Composer un commentaire"
          className="w-full resize-none bg-transparent text-sm leading-relaxed text-white/90 placeholder:text-white/35 focus:outline-none"
        />
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "text-[11px] tabular-nums",
              remaining < 0
                ? "text-[var(--color-kaia-terracotta)]"
                : "text-white/35",
            )}
          >
            {remaining}
          </span>
          <Button
            type="button"
            size="sm"
            onClick={submit}
            loading={isPending}
            disabled={empty || tooLong}
          >
            <Send className="h-3 w-3" strokeWidth={1.7} />
            Répondre
          </Button>
        </div>
        {error ? (
          <p role="alert" className="text-[12px] text-[var(--color-kaia-terracotta)]">
            {error}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-white/40 text-sm py-4">Chargement…</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-white/40 text-sm py-4">
            Sois la première personne à répondre.
          </p>
        ) : (
          comments.map((c) => {
            const initial = (c.author.display_name ?? "K").charAt(0).toUpperCase();
            return (
              <div key={c.id} className="flex items-start gap-3">
                <div
                  aria-hidden
                  className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] grid place-items-center text-white text-[11px] font-display shrink-0"
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0 glass rounded-2xl px-4 py-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-medium text-white/85 truncate">
                      {c.author.display_name ?? "Membre"}
                    </span>
                    <span className="text-[10px] text-white/35">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
