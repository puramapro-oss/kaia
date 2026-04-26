/**
 * ElevenLabs voice IDs par locale (P3 — guidage audio guidé).
 *
 * En P2 : table définie, non consommée. ElevenLabs activé en P3 dès que
 * `ELEVENLABS_API_KEY` est livrée (cf. task_plan.md crédentials manquantes).
 *
 * Source des voice IDs : ElevenLabs library (v3, multilingual). À ré-auditer
 * avant prod pour confirmer voix calmes / wellness friendly.
 */

export type SupportedLocale =
  | "fr"
  | "en"
  | "es"
  | "de"
  | "it"
  | "pt"
  | "ar"
  | "zh"
  | "ja"
  | "ko"
  | "hi"
  | "ru"
  | "tr"
  | "nl"
  | "pl"
  | "sv";

export interface VoiceConfig {
  /** Voice ID ElevenLabs. */
  voiceId: string;
  /** Locale code BCP-47. */
  locale: SupportedLocale;
  /** Stability (0..1) — plus haut = ton constant. Wellness = 0.55-0.7. */
  stability: number;
  /** Similarity boost (0..1). */
  similarity: number;
  /** Style (0..1) — 0 pour wellness (sobre). */
  style: number;
  /** Speaker boost — true pour accentuer la présence. */
  speakerBoost: boolean;
}

/**
 * Default-quality wellness voices, favorisant féminin doux par défaut
 * (à confirmer Tissma — possibilité d'ajouter une variante masculine P3).
 */
export const VOICES_BY_LOCALE: Record<SupportedLocale, VoiceConfig> = {
  fr: { voiceId: "FvmvwvObRqIHojkEGh5N", locale: "fr", stability: 0.65, similarity: 0.75, style: 0.0, speakerBoost: true },
  en: { voiceId: "EXAVITQu4vr4xnSDxMaL", locale: "en", stability: 0.65, similarity: 0.75, style: 0.0, speakerBoost: true },
  es: { voiceId: "VR6AewLTigWG4xSOukaG", locale: "es", stability: 0.65, similarity: 0.75, style: 0.0, speakerBoost: true },
  de: { voiceId: "TxGEqnHWrfWFTfGW9XjX", locale: "de", stability: 0.65, similarity: 0.75, style: 0.0, speakerBoost: true },
  it: { voiceId: "AZnzlk1XvdvUeBnXmlld", locale: "it", stability: 0.65, similarity: 0.75, style: 0.0, speakerBoost: true },
  pt: { voiceId: "yoZ06aMxZJJ28mfd3POQ", locale: "pt", stability: 0.65, similarity: 0.75, style: 0.0, speakerBoost: true },
  ar: { voiceId: "ThT5KcBeYPX3keUQqHPh", locale: "ar", stability: 0.6, similarity: 0.75, style: 0.0, speakerBoost: true },
  zh: { voiceId: "XB0fDUnXU5powFXDhCwa", locale: "zh", stability: 0.6, similarity: 0.75, style: 0.0, speakerBoost: true },
  ja: { voiceId: "MF3mGyEYCl7XYWbV9V6O", locale: "ja", stability: 0.6, similarity: 0.75, style: 0.0, speakerBoost: true },
  ko: { voiceId: "GBv7mTt0atIp3Br8iCZE", locale: "ko", stability: 0.6, similarity: 0.75, style: 0.0, speakerBoost: true },
  hi: { voiceId: "Z3R5wn05IrDiVCyEkUrK", locale: "hi", stability: 0.6, similarity: 0.75, style: 0.0, speakerBoost: true },
  ru: { voiceId: "1qEiC6qsybMkmnNdVMbK", locale: "ru", stability: 0.65, similarity: 0.75, style: 0.0, speakerBoost: true },
  tr: { voiceId: "5Q0t7uMcjvnagumLfvZi", locale: "tr", stability: 0.65, similarity: 0.75, style: 0.0, speakerBoost: true },
  nl: { voiceId: "bIHbv24MWmeRgasZH58o", locale: "nl", stability: 0.65, similarity: 0.75, style: 0.0, speakerBoost: true },
  pl: { voiceId: "TX3LPaxmHKxFdv7VOQHJ", locale: "pl", stability: 0.65, similarity: 0.75, style: 0.0, speakerBoost: true },
  sv: { voiceId: "21m00Tcm4TlvDq8ikWAM", locale: "sv", stability: 0.65, similarity: 0.75, style: 0.0, speakerBoost: true },
};

export function getVoice(locale: string): VoiceConfig {
  const code = locale.toLowerCase().split("-")[0] as SupportedLocale;
  return VOICES_BY_LOCALE[code] ?? VOICES_BY_LOCALE.fr;
}
