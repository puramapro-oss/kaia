import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startBinaural, getPreset, type BinauralPreset } from "@/lib/audio/binaural";
import { haptic } from "@/lib/multisensorial/haptics";
import type { PracticeCategory } from "@/lib/practices/categories";

export type SessionStatus = "intro" | "running" | "paused" | "post";

interface PracticeStep {
  order: number;
  text_fr: string;
  text_en?: string;
  duration_seconds?: number;
}

interface Practice {
  slug: string;
  title: string;
  category: PracticeCategory;
  durationSeconds: number;
  steps: PracticeStep[];
}

interface PostPulse {
  stress: number | null;
  energy: number | null;
  mood: number | null;
}

const PRESET_BY_CATEGORY: Partial<Record<PracticeCategory, BinauralPreset>> = {
  meditation: "alpha",
  breathing: "alpha",
  mantra: "theta",
  reprogramming: "theta",
  movement: "beta",
  learning: "beta",
  mudra: "alpha",
};

interface UseSessionPlayerStateProps {
  practice: Practice;
  sessionId: string;
  audioMode: "silence" | "nature" | "binaural" | "voice";
  speechLocale: string;
  isLastInRoutine: boolean;
  routineId: string | null;
  hapticsEnabled: boolean;
  binauralEnabled: boolean;
}

export function useSessionPlayerState({
  practice,
  sessionId,
  audioMode,
  speechLocale,
  isLastInRoutine,
  routineId,
  hapticsEnabled,
  binauralEnabled,
}: UseSessionPlayerStateProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<SessionStatus>("intro");
  const [stepIdx, setStepIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(practice.durationSeconds);
  const [postPulse, setPostPulse] = useState<PostPulse>({
    stress: null,
    energy: null,
    mood: null,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<{ earned: number; balance: number } | null>(null);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopBinauralRef = useRef<{ stop: () => void } | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const stepsCount = practice.steps.length;
  const currentStep = practice.steps[stepIdx];

  // Web Speech
  const speak = (text: string) => {
    if (audioMode !== "voice") return;
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = speechLocale;
      utter.rate = 0.9;
      utter.pitch = 1;
      utter.volume = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {
      // pas critique
    }
  };

  const start = () => {
    setStatus("running");
    startedAtRef.current = Date.now();
    haptic("success", hapticsEnabled);
    if (currentStep) speak(currentStep.text_fr);

    if (audioMode === "binaural" && binauralEnabled) {
      const presetId: BinauralPreset = PRESET_BY_CATEGORY[practice.category] ?? "alpha";
      try {
        stopBinauralRef.current = startBinaural(getPreset(presetId), { volume: 0.06 });
      } catch {
        // autoplay refus, on ignore
      }
    }
  };

  const pause = () => {
    setStatus("paused");
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    haptic("warning", hapticsEnabled);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
  };

  const resume = () => {
    setStatus("running");
    haptic("light", hapticsEnabled);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
  };

  const skipToEnd = () => {
    setStatus("post");
    setSecondsLeft(0);
    if (tickRef.current) clearInterval(tickRef.current);
  };

  const submitComplete = (pulse?: { stress: number; energy: number; mood: number }) => {
    setSubmitError(null);
    const elapsed = startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current) / 1000)
      : practice.durationSeconds;

    startTransition(async () => {
      try {
        const res = await fetch("/api/practices/complete-session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId,
            durationSeconds: Math.min(elapsed, 1800),
            postState: pulse ?? null,
            completesRoutine: isLastInRoutine,
          }),
        });
        const data = (await res.json()) as {
          newBalance?: number;
          earnedThisSession?: number;
          error?: string;
        };
        if (!res.ok) {
          setSubmitError(data.error ?? "Validation impossible.");
          return;
        }
        if (stopBinauralRef.current) stopBinauralRef.current.stop();
        setCompleted({
          earned: data.earnedThisSession ?? 0,
          balance: data.newBalance ?? 0,
        });
        haptic("success", hapticsEnabled);
      } catch {
        setSubmitError("Connexion perdue, réessaie.");
      }
    });
  };

  const goNext = () => {
    if (isLastInRoutine || !routineId) {
      router.push("/home");
    } else {
      router.push(`/routine/start?routineId=${routineId}`);
    }
    router.refresh();
  };

  // Tick
  useEffect(() => {
    if (status !== "running") return;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setStepIdx((idx) => {
            const nextIdx = idx + 1;
            if (nextIdx < stepsCount) {
              const next = practice.steps[nextIdx];
              if (next) speak(next.text_fr);
              haptic("selection", hapticsEnabled);
              return nextIdx;
            }
            if (tickRef.current) clearInterval(tickRef.current);
            tickRef.current = null;
            setStatus("post");
            return idx;
          });
          const remainingSteps = stepsCount - (stepIdx + 1);
          if (remainingSteps > 0) {
            return Math.max(10, Math.floor(practice.durationSeconds / stepsCount));
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, stepIdx]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (stopBinauralRef.current) stopBinauralRef.current.stop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const totalElapsedPct = Math.max(
    0,
    Math.min(100, ((practice.durationSeconds - secondsLeft) / practice.durationSeconds) * 100),
  );

  return {
    status,
    stepIdx,
    secondsLeft,
    postPulse,
    setPostPulse,
    submitError,
    completed,
    isPending,
    currentStep,
    stepsCount,
    totalElapsedPct,
    start,
    pause,
    resume,
    skipToEnd,
    submitComplete,
    goNext,
  };
}
