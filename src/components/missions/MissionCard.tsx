"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface MissionRow {
  id: string;
  slug: string;
  kind: "solo" | "humanitarian" | "marketing" | "collaborative";
  title: string;
  description: string | null;
  reward_tokens: number;
  proof_kind: string;
  max_completions: number | null;
}

interface Props {
  mission: MissionRow;
  approved: number;
  pending: number;
  maxed: boolean;
}

export function MissionCard({ mission, approved, pending, maxed }: Props) {
  const [proofUrl, setProofUrl] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, startTransition] = useTransition();
  const router = useRouter();

  const isAuto = mission.proof_kind === "api";
  const remaining =
    mission.max_completions != null
      ? Math.max(0, mission.max_completions - approved - pending)
      : null;

  function submit() {
    setError(null);
    setSuccess(null);
    if (!proofUrl) {
      setError("Lien de preuve requis.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/missions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: mission.id, proofUrl }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Erreur inconnue.");
        return;
      }
      setSuccess("Preuve envoyée — validation sous 48 h ✨");
      setProofUrl("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-display text-lg">{mission.title}</h3>
        <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full bg-emerald-300/10 text-emerald-200 whitespace-nowrap">
          <Sparkles className="h-3 w-3" />+{mission.reward_tokens}
        </span>
      </div>
      <p className="text-sm text-white/70 mb-4 flex-1">{mission.description}</p>

      <div className="flex items-center justify-between text-xs text-white/60 mb-3">
        <span>
          {approved > 0 ? `${approved} validée${approved > 1 ? "s" : ""}` : "Pas encore validée"}
          {pending > 0 && ` · ${pending} en attente`}
        </span>
        {remaining != null && <span>{remaining} restante{remaining > 1 ? "s" : ""}</span>}
      </div>

      {maxed ? (
        <button
          disabled
          className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] py-2 text-sm text-white/50 cursor-not-allowed"
        >
          Mission complétée ✓
        </button>
      ) : isAuto ? (
        <p className="text-xs text-white/60 italic">
          Validation automatique dès que la condition est atteinte.
        </p>
      ) : open ? (
        <div className="space-y-2">
          <input
            type="url"
            placeholder="https://… (lien de ta preuve)"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
            aria-label="URL de la preuve"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="flex-1 rounded-lg bg-emerald-300 text-black font-medium py-2 text-sm hover:bg-emerald-200 disabled:opacity-60"
            >
              {submitting ? "Envoi…" : "Envoyer"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm hover:bg-white/[0.08]"
            >
              Annuler
            </button>
          </div>
          {error && (
            <p className="text-xs text-rose-300" role="alert">
              {error}
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-lg bg-emerald-300/15 border border-emerald-300/40 text-emerald-200 py-2 text-sm hover:bg-emerald-300/25"
        >
          Envoyer ma preuve
        </button>
      )}
      {success && (
        <p className="mt-2 text-xs text-emerald-300" role="status">
          {success}
        </p>
      )}
    </div>
  );
}
