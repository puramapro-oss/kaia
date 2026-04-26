"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, ShieldAlert } from "lucide-react";
import {
  BINAURAL_PRESETS,
  startBinaural,
  type BinauralEngineHandle,
  type BinauralPreset,
  type BinauralPresetSpec,
} from "@/lib/audio/binaural";
import { useMultisensorialPrefs } from "@/hooks/useMultisensorialPrefs";
import { GlassCard } from "@/components/ui/Card";
import { HapticButton } from "./HapticButton";
import { cn } from "@/lib/utils";

interface BinauralPlayerProps {
  /** Preset initial. */
  defaultPreset?: BinauralPreset;
  /** Callback à la fin (timer écoulé). */
  onComplete?: () => void;
}

/**
 * Lecteur binaural autonome : warning épilepsie OBLIGATOIRE avant la première
 * lecture (BRIEF §5.3 + §risques #5). Le user doit explicitement reconnaître
 * pour activer le bouton Play. Le warning est rappelé à chaque ouverture
 * tant que l'engine n'est pas démarré.
 */
export function BinauralPlayer({
  defaultPreset = "alpha",
  onComplete,
}: BinauralPlayerProps) {
  const prefs = useMultisensorialPrefs();
  const [presetId, setPresetId] = useState<BinauralPreset>(defaultPreset);
  const [acknowledged, setAcknowledged] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const handleRef = useRef<BinauralEngineHandle | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const preset: BinauralPresetSpec =
    BINAURAL_PRESETS.find((value) => value.id === presetId) ?? BINAURAL_PRESETS[2];

  const stop = () => {
    handleRef.current?.stop();
    handleRef.current = null;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    setRunning(false);
  };

  // Cleanup garanti au démontage.
  useEffect(() => {
    return () => stop();
  }, []);

  // Stop si le user désactive le toggle pendant l'écoute.
  useEffect(() => {
    if (!prefs.binaural && running) stop();
  }, [prefs.binaural, running]);

  const start = () => {
    if (!acknowledged) return;
    if (handleRef.current?.running) return;
    handleRef.current = startBinaural(preset);
    setElapsed(0);
    setRunning(true);
    tickRef.current = setInterval(() => {
      setElapsed((value) => {
        const next = value + 1;
        if (next >= preset.recommendedSeconds) {
          stop();
          onComplete?.();
        }
        return next;
      });
    }, 1000);
  };

  const togglePreset = (id: BinauralPreset) => {
    if (running) stop();
    setPresetId(id);
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const totalMinutes = Math.floor(preset.recommendedSeconds / 60);
  const progress = Math.min(1, elapsed / preset.recommendedSeconds);

  if (!prefs.binaural) {
    return (
      <GlassCard className="space-y-3">
        <div className="flex items-start gap-3">
          <Headphones className="w-5 h-5 text-white/40 mt-0.5" strokeWidth={1.6} />
          <div>
            <h3 className="font-display text-lg text-white/85">Sons binauraux</h3>
            <p className="text-sm text-white/55 mt-1">
              Active les sons binauraux dans{" "}
              <span className="text-white/80">Réglages → Multisensoriel</span> pour
              bénéficier de ces ambiances cérébrales subtiles.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="space-y-5">
      <div className="flex items-start gap-3">
        <Headphones
          className="w-5 h-5 text-[var(--color-kaia-accent)] mt-0.5"
          strokeWidth={1.6}
        />
        <div className="flex-1">
          <h3 className="font-display text-xl text-white">Sons binauraux</h3>
          <p className="text-sm text-white/55 mt-1">
            À écouter au casque. Choisis une fréquence, prends une posture confortable,
            ferme les yeux.
          </p>
        </div>
      </div>

      {/* Disclaimer — visible tant que non acknowledged. */}
      {!acknowledged ? (
        <div
          role="alertdialog"
          aria-labelledby="binaural-warning-title"
          className="rounded-2xl border border-[var(--color-kaia-gold)]/30 bg-[var(--color-kaia-gold)]/[0.06] p-4 space-y-3"
        >
          <div className="flex items-start gap-2.5">
            <ShieldAlert
              className="w-5 h-5 text-[var(--color-kaia-gold)] mt-0.5"
              strokeWidth={1.7}
            />
            <div>
              <p
                id="binaural-warning-title"
                className="text-sm font-medium text-white"
              >
                Avant de lancer
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-white/70 leading-relaxed">
                <li>• Ne pas utiliser en conduisant ou en opérant des machines.</li>
                <li>• Déconseillé en cas d'épilepsie ou de troubles du rythme cardiaque.</li>
                <li>• Casque audio fortement recommandé (sinon l'effet binaural disparaît).</li>
                <li>• Ce n'est pas un soin médical : c'est une expérience d'attention.</li>
              </ul>
            </div>
          </div>
          <HapticButton
            variant="ghost"
            size="sm"
            onClick={() => setAcknowledged(true)}
            className="w-full sm:w-auto"
          >
            J'ai lu, je continue
          </HapticButton>
        </div>
      ) : null}

      {/* Picker preset — disabled tant que non acknowledged. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {BINAURAL_PRESETS.map((value) => {
          const active = value.id === presetId;
          return (
            <button
              key={value.id}
              type="button"
              onClick={() => togglePreset(value.id)}
              disabled={!acknowledged}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left wellness-anim",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                active
                  ? "border-[var(--color-kaia-accent)]/60 bg-[var(--color-kaia-accent)]/[0.08]"
                  : "border-white/10 hover:border-white/20 bg-white/[0.02]"
              )}
              aria-pressed={active}
            >
              <p className="text-sm font-medium text-white">{value.labelFr.split("·")[0].trim()}</p>
              <p className="text-[11px] text-white/45 mt-0.5">
                {value.beatHz} Hz · {Math.floor(value.recommendedSeconds / 60)} min
              </p>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-white/65">{preset.shortFr}</p>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] wellness-anim"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="text-xs text-white/45 tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")} /{" "}
          {String(totalMinutes).padStart(2, "0")}:00
        </p>
      </div>

      <HapticButton
        onClick={running ? stop : start}
        disabled={!acknowledged}
        hapticIntensity={running ? "warning" : "success"}
        variant="primary"
        size="md"
        className="w-full sm:w-auto"
        aria-label={running ? "Arrêter la séance" : "Lancer la séance"}
      >
        {running ? (
          <>
            <Pause className="w-4 h-4" strokeWidth={1.7} />
            Arrêter
          </>
        ) : (
          <>
            <Play className="w-4 h-4" strokeWidth={1.7} />
            Lancer
          </>
        )}
      </HapticButton>
    </GlassCard>
  );
}
