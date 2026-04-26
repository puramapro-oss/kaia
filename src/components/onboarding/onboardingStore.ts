"use client";

import { create } from "zustand";
import type { RoutineGoalSlug } from "@/lib/practices/categories";
import type { SupportedLocale } from "@/lib/constants";

export type OnboardingStep =
  | "cinematic"
  | "welcome"
  | "language"
  | "goal"
  | "time"
  | "audio"
  | "accessibility"
  | "first-routine"
  | "paywall";

export const STEP_ORDER: OnboardingStep[] = [
  "cinematic",
  "welcome",
  "language",
  "goal",
  "time",
  "audio",
  "accessibility",
  "first-routine",
  "paywall",
];

export type AudioMode = "silence" | "nature" | "binaural" | "voice";

interface OnboardingState {
  step: OnboardingStep;
  locale: SupportedLocale;
  goal: RoutineGoalSlug | null;
  dailyTimeMinutes: number;
  audioMode: AudioMode;
  highContrast: boolean;
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  firstRoutineDone: boolean;

  next: () => void;
  prev: () => void;
  goTo: (step: OnboardingStep) => void;

  setLocale: (l: SupportedLocale) => void;
  setGoal: (g: RoutineGoalSlug) => void;
  setDailyTime: (m: number) => void;
  setAudioMode: (m: AudioMode) => void;
  setHighContrast: (v: boolean) => void;
  setDyslexiaFont: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setFirstRoutineDone: (v: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: "cinematic",
  locale: "fr",
  goal: null,
  dailyTimeMinutes: 4,
  audioMode: "nature",
  highContrast: false,
  dyslexiaFont: false,
  reducedMotion: false,
  firstRoutineDone: false,

  next: () =>
    set((state) => {
      const idx = STEP_ORDER.indexOf(state.step);
      const nextIdx = Math.min(idx + 1, STEP_ORDER.length - 1);
      return { step: STEP_ORDER[nextIdx] };
    }),
  prev: () =>
    set((state) => {
      const idx = STEP_ORDER.indexOf(state.step);
      const prevIdx = Math.max(idx - 1, 0);
      return { step: STEP_ORDER[prevIdx] };
    }),
  goTo: (step) => set({ step }),

  setLocale: (locale) => set({ locale }),
  setGoal: (goal) => set({ goal }),
  setDailyTime: (m) => set({ dailyTimeMinutes: m }),
  setAudioMode: (m) => set({ audioMode: m }),
  setHighContrast: (v) => set({ highContrast: v }),
  setDyslexiaFont: (v) => set({ dyslexiaFont: v }),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setFirstRoutineDone: (v) => set({ firstRoutineDone: v }),
}));
