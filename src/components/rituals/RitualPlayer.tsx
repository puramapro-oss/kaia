"use client";
import { useState, useTransition, useRef } from "react";
import { Play, Pause, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface RitualSummary {
  id: string;
  slug: string;
  themeLabel: string;
  intro: string;
  intent: string;
  steps: string[];
  closingPhrase: string;
  audioScript: string;
  breathingLabel: string;
  breathingCycles: number;
  alreadyJoined: boolean;
}

export function RitualPlayer({ ritual }: { ritual: RitualSummary }) {
  const [joined, setJoined] = useState(ritual.alreadyJoined);
  const [tokensJustEarned, setTokensJustEarned] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isReading, setIsReading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setError("La lecture vocale n'est pas disponible sur ce navigateur.");
      return;
    }
    const ss = window.speechSynthesis;
    if (isReading) {
      ss.cancel();
      setIsReading(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(ritual.audioScript);
    u.lang = "fr-FR";
    u.rate = 0.92;
    u.pitch = 1.0;
    u.volume = 1.0;
    u.onend = () => setIsReading(false);
    u.onerror = () => setIsReading(false);
    utteranceRef.current = u;
    ss.cancel();
    ss.speak(u);
    setIsReading(true);
  };

  const join = () => {
    if (joined || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/community/rituals/${ritual.id}/join`, {
          method: "POST",
        });
        if (res.status === 410) {
          setError("Le rituel de cette semaine est terminé.");
          return;
        }
        if (!res.ok) {
          setError("Participation impossible.");
          return;
        }
        const data = (await res.json()) as {
          tokensCredited: number;
          alreadyJoined: boolean;
        };
        setJoined(true);
        setTokensJustEarned(data.tokensCredited);
      } catch {
        setError("Connexion perdue.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 sm:p-8 space-y-5">
        <header className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-gold)]">
            <Sparkles className="h-3 w-3" strokeWidth={2} />
            Rituel collectif
          </span>
          <h2 className="font-display text-3xl text-white tracking-tight">
            {ritual.themeLabel}
          </h2>
          <p className="text-base text-white/75 leading-relaxed">{ritual.intro}</p>
          <p className="text-sm text-white/55 italic leading-relaxed">{ritual.intent}</p>
        </header>

        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-[11px] tracking-[0.16em] uppercase text-[var(--color-kaia-accent)]/80 mb-1">
            Respiration
          </p>
          <p className="text-sm text-white/85">
            {ritual.breathingLabel} · {ritual.breathingCycles} cycles
          </p>
        </div>

        <ol className="space-y-3 list-none">
          {ritual.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                aria-hidden
                className="shrink-0 h-6 w-6 rounded-full bg-gradient-to-br from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] grid place-items-center text-[11px] font-display text-white"
              >
                {i + 1}
              </span>
              <p className="text-sm text-white/80 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>

        <p className="text-base text-white/85 italic font-display border-l-2 border-[var(--color-kaia-gold)]/60 pl-4">
          {ritual.closingPhrase}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="ghost" size="md" onClick={speak} type="button">
            {isReading ? (
              <>
                <Pause className="h-4 w-4" strokeWidth={1.7} />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" strokeWidth={1.7} />
                Écouter le guidage
              </>
            )}
          </Button>

          {joined ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--color-kaia-green)]/15 border border-[var(--color-kaia-green)]/40 text-[var(--color-kaia-green)] text-sm font-medium">
              <Check className="h-4 w-4" strokeWidth={2} />
              {tokensJustEarned > 0
                ? `Participé · +${tokensJustEarned} tokens`
                : "Tu as participé cette semaine"}
            </span>
          ) : (
            <Button onClick={join} loading={isPending} type="button">
              Je participe
            </Button>
          )}
        </div>

        {error ? (
          <p role="alert" className="text-[13px] text-[var(--color-kaia-terracotta)]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
