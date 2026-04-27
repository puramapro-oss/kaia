"use client";

/**
 * InfluencerApplyForm — formulaire de candidature ambassadeur (P6).
 * POST /api/influencer/apply
 */
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/Card";

interface ErrorState {
  field?: string;
  message: string;
}

const FIELD_LABEL: Record<string, string> = {
  pitch: "Présentation",
  socials: "Réseaux sociaux",
  audienceSize: "Audience totale",
  niche: "Niche",
};

export function InfluencerApplyForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<ErrorState | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const payload = {
      socials: {
        instagram: (fd.get("instagram") as string)?.trim() || undefined,
        tiktok: (fd.get("tiktok") as string)?.trim() || undefined,
        youtube: (fd.get("youtube") as string)?.trim() || undefined,
        twitter: (fd.get("twitter") as string)?.trim() || undefined,
        website: (fd.get("website") as string)?.trim() || undefined,
      },
      audienceSize: fd.get("audienceSize") ? Number(fd.get("audienceSize")) : undefined,
      niche: (fd.get("niche") as string)?.trim() || undefined,
      pitch: (fd.get("pitch") as string)?.trim() || "",
    };

    // Nettoie undefined dans socials
    const socials = Object.fromEntries(
      Object.entries(payload.socials).filter(([, v]) => v && v.length > 0)
    );

    startTransition(async () => {
      const res = await fetch("/api/influencer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, socials }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError({
          message:
            data?.error ?? "Impossible d'envoyer ta candidature. Réessaie dans une minute.",
        });
        return;
      }
      router.refresh();
    });
  }

  return (
    <GlassCard>
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-xs uppercase tracking-[0.18em] text-white/50 mb-2" htmlFor="pitch">
            {FIELD_LABEL.pitch} <span className="text-[var(--color-kaia-terracotta)]">*</span>
          </label>
          <textarea
            id="pitch"
            name="pitch"
            required
            minLength={20}
            maxLength={800}
            rows={5}
            placeholder="Pourquoi tu veux partager KAÏA ? Décris ton univers en quelques lignes."
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[var(--color-kaia-accent)] wellness-anim"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-white/50 mb-2" htmlFor="instagram">
              Instagram
            </label>
            <input
              id="instagram"
              name="instagram"
              type="text"
              placeholder="@toncompte"
              maxLength={60}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[var(--color-kaia-accent)] wellness-anim"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-white/50 mb-2" htmlFor="tiktok">
              TikTok
            </label>
            <input
              id="tiktok"
              name="tiktok"
              type="text"
              placeholder="@toncompte"
              maxLength={60}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[var(--color-kaia-accent)] wellness-anim"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-white/50 mb-2" htmlFor="youtube">
              YouTube
            </label>
            <input
              id="youtube"
              name="youtube"
              type="text"
              placeholder="@chaine"
              maxLength={60}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[var(--color-kaia-accent)] wellness-anim"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-white/50 mb-2" htmlFor="audienceSize">
              {FIELD_LABEL.audienceSize}
            </label>
            <input
              id="audienceSize"
              name="audienceSize"
              type="number"
              min={0}
              placeholder="Ex : 5000"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[var(--color-kaia-accent)] wellness-anim"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.18em] text-white/50 mb-2" htmlFor="niche">
            {FIELD_LABEL.niche}
          </label>
          <input
            id="niche"
            name="niche"
            type="text"
            placeholder="Bien-être, méditation, lifestyle..."
            maxLength={80}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[var(--color-kaia-accent)] wellness-anim"
          />
        </div>

        {error ? (
          <p
            className="text-sm text-[var(--color-kaia-terracotta)] bg-[rgba(212,144,106,0.06)] border border-[var(--color-kaia-terracotta)]/30 rounded-xl px-4 py-3"
            role="alert"
          >
            {error.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl text-sm font-medium text-white bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] hover:opacity-95 wellness-anim disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Envoi..." : "Envoyer ma candidature"}
        </button>
      </form>
    </GlassCard>
  );
}
