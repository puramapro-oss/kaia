import type { SupportedLocale } from "@/lib/constants";
import type { AudioMode } from "./onboardingStore";

export const TIME_OPTIONS = [1, 3, 5, 10, 15, 30] as const;

export const LOCALE_LABEL: Record<SupportedLocale, { name: string; native: string }> = {
  fr: { name: "Français", native: "Français" },
  en: { name: "English", native: "English" },
  es: { name: "Español", native: "Español" },
  ar: { name: "Arabic", native: "العربية" },
  zh: { name: "Chinese", native: "中文" },
};

export const AUDIO_MODES: Array<{ id: AudioMode; label: string; sub: string }> = [
  { id: "silence", label: "Silence", sub: "Aucun son d'ambiance." },
  { id: "nature", label: "Sons nature", sub: "Forêt, océan, vent — selon la pratique." },
  { id: "binaural", label: "Binauraux", sub: "Fréquences subtiles — bien-être profond." },
  { id: "voice", label: "Voix guidée", sub: "Voix qui accompagne chaque étape." },
];
