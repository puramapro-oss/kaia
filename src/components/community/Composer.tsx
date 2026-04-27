"use client";
import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export const MAX_CHARS = 280;

export function Composer({ onPosted }: { onPosted?: () => void }) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const remaining = MAX_CHARS - content.trim().length;
  const tooLong = remaining < 0;
  const empty = content.trim().length === 0;

  const submit = () => {
    if (empty || tooLong || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/community/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim() }),
        });
        if (res.status === 422) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? "Ce message a été rejeté par notre modération.");
          return;
        }
        if (res.status === 429) {
          setError("Tu publies trop vite. Reviens dans 1 minute.");
          return;
        }
        if (!res.ok) {
          setError("Publication impossible. Réessaie.");
          return;
        }
        setContent("");
        onPosted?.();
      } catch {
        setError("Connexion perdue. Réessaie.");
      }
    });
  };

  return (
    <div className="glass rounded-3xl p-5 sm:p-6 space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Partage ton ressenti, un témoignage, un encouragement…"
        rows={3}
        maxLength={MAX_CHARS + 50} // soft buffer pour permettre l'affichage du compteur négatif
        aria-label="Composer un nouveau post"
        className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-white/90 placeholder:text-white/35 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "text-[12px] tabular-nums",
            remaining < 0
              ? "text-[var(--color-kaia-terracotta)]"
              : remaining < 30
                ? "text-[var(--color-kaia-gold)]"
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
          <Send className="h-3.5 w-3.5" strokeWidth={1.7} />
          Publier
        </Button>
      </div>
      {error ? (
        <p
          role="alert"
          className="text-[13px] text-[var(--color-kaia-terracotta)] leading-relaxed"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
