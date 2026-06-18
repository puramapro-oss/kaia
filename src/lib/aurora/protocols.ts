export type AuroraVariant = "calm" | "focus" | "sleep" | "ignite";
export type AuroraPhaseKey = "armement" | "double_soupir" | "resonance_core" | "omega_lock" | "glide_out";

export interface AuroraPhase {
  key: AuroraPhaseKey;
  label: string;
  durationSec: number;
  instruction: string;
  breathRhythm?: { inhale: number; hold: number; exhale: number; pause: number };
  color: string;
}

export interface AuroraProtocol {
  variant: AuroraVariant;
  label: string;
  tagline: string;
  emoji: string;
  totalDurationMin: number;
  phases: AuroraPhase[];
  epilepsyWarning: boolean;
}

const CALM: AuroraProtocol = {
  variant: "calm",
  label: "Calme",
  tagline: "Dissolve le stress. Retrouve ton centre.",
  emoji: "🌊",
  totalDurationMin: 7,
  epilepsyWarning: false,
  phases: [
    {
      key: "armement",
      label: "Armement",
      durationSec: 30,
      color: "#C8B9F0",
      instruction: "Installe-toi confortablement. Ferme les yeux. Pose une main sur le cœur.",
    },
    {
      key: "double_soupir",
      label: "Double Soupir",
      durationSec: 60,
      color: "#B0D0F0",
      instruction: "Deux grandes inspirations, puis expire par la bouche avec un long soupir libérateur.",
      breathRhythm: { inhale: 4, hold: 0, exhale: 8, pause: 1 },
    },
    {
      key: "resonance_core",
      label: "Résonance Core",
      durationSec: 180,
      color: "#90C0E8",
      instruction: "Inspire 5 secondes, expire 5 secondes. Laisse ton corps trouver son rythme.",
      breathRhythm: { inhale: 5, hold: 0, exhale: 5, pause: 0 },
    },
    {
      key: "omega_lock",
      label: "Omega Lock",
      durationSec: 90,
      color: "#7AAAD0",
      instruction: "Après une expiration douce, laisse une pause naturelle. Ne force pas.",
      breathRhythm: { inhale: 5, hold: 0, exhale: 6, pause: 3 },
    },
    {
      key: "glide_out",
      label: "Glide Out",
      durationSec: 60,
      color: "#C8B9F0",
      instruction: "Reprends doucement. Sens ton corps. Bois un verre d'eau.",
    },
  ],
};

const FOCUS: AuroraProtocol = {
  variant: "focus",
  label: "Focus",
  tagline: "Active la clarté mentale. Entre dans le flux.",
  emoji: "⚡",
  totalDurationMin: 8,
  epilepsyWarning: false,
  phases: [
    {
      key: "armement",
      label: "Armement",
      durationSec: 30,
      color: "#E8C87A",
      instruction: "Assieds-toi droit. Regard à mi-hauteur. Définis ton intention pour la session.",
    },
    {
      key: "double_soupir",
      label: "Double Soupir",
      durationSec: 45,
      color: "#F0D890",
      instruction: "2 inspirations courtes par le nez, puis 1 longue expiration par la bouche.",
      breathRhythm: { inhale: 2, hold: 1, exhale: 4, pause: 0 },
    },
    {
      key: "resonance_core",
      label: "Résonance Core",
      durationSec: 200,
      color: "#E8D070",
      instruction: "Inspire 4, expire 4. Rythme rapide et engagé. Mental alerte.",
      breathRhythm: { inhale: 4, hold: 0, exhale: 4, pause: 0 },
    },
    {
      key: "omega_lock",
      label: "Omega Lock",
      durationSec: 120,
      color: "#D0C060",
      instruction: "Inspire profondément, bloque 4 secondes, expire lentement.",
      breathRhythm: { inhale: 4, hold: 4, exhale: 6, pause: 2 },
    },
    {
      key: "glide_out",
      label: "Glide Out",
      durationSec: 45,
      color: "#E8C87A",
      instruction: "Ouvre les yeux. Tu es ancré·e et alerte. La session commence.",
    },
  ],
};

const SLEEP: AuroraProtocol = {
  variant: "sleep",
  label: "Sommeil",
  tagline: "Glisse vers le repos. Libère la journée.",
  emoji: "🌙",
  totalDurationMin: 10,
  epilepsyWarning: false,
  phases: [
    {
      key: "armement",
      label: "Armement",
      durationSec: 60,
      color: "#3A3060",
      instruction: "Allonge-toi. Couverture sur toi. Lumière éteinte ou très tamisée.",
    },
    {
      key: "double_soupir",
      label: "Double Soupir",
      durationSec: 90,
      color: "#4A4080",
      instruction: "Soupire deux fois longuement. Laisse ton corps s'alourdir.",
      breathRhythm: { inhale: 3, hold: 0, exhale: 10, pause: 2 },
    },
    {
      key: "resonance_core",
      label: "Résonance Core",
      durationSec: 180,
      color: "#5A5090",
      instruction: "4-7-8 : inspire 4, bloque 7, expire 8. Ralentis à chaque cycle.",
      breathRhythm: { inhale: 4, hold: 7, exhale: 8, pause: 0 },
    },
    {
      key: "omega_lock",
      label: "Omega Lock",
      durationSec: 150,
      color: "#2A2050",
      instruction: "Expire tout l'air. Pause naturelle. Laisse le sommeil venir.",
      breathRhythm: { inhale: 3, hold: 0, exhale: 8, pause: 5 },
    },
    {
      key: "glide_out",
      label: "Glide Out",
      durationSec: 120,
      color: "#1A1030",
      instruction: "Continue aussi longtemps que tu veux. Bonne nuit.",
    },
  ],
};

const IGNITE: AuroraProtocol = {
  variant: "ignite",
  label: "Ignite",
  tagline: "Libère l'énergie vitale. Brûle les blocages.",
  emoji: "🔥",
  totalDurationMin: 9,
  epilepsyWarning: true,
  phases: [
    {
      key: "armement",
      label: "Armement",
      durationSec: 30,
      color: "#F0B0C0",
      instruction: "Debout ou assis. Ancre tes pieds. Secoue légèrement les bras.",
    },
    {
      key: "double_soupir",
      label: "Double Soupir",
      durationSec: 60,
      color: "#E89090",
      instruction: "Inspire fort par le nez, puis expire FORT par la bouche × 3.",
      breathRhythm: { inhale: 2, hold: 0, exhale: 2, pause: 0 },
    },
    {
      key: "resonance_core",
      label: "Résonance Core",
      durationSec: 240,
      color: "#E07070",
      instruction: "Respiration Wim Hof légère : 30 inspirations courtes, puis expire et tiens.",
      breathRhythm: { inhale: 2, hold: 0, exhale: 2, pause: 0 },
    },
    {
      key: "omega_lock",
      label: "Omega Lock",
      durationSec: 90,
      color: "#D05050",
      instruction: "Après la série, expire tout et bloque. Ressens le feu intérieur.",
      breathRhythm: { inhale: 4, hold: 15, exhale: 6, pause: 0 },
    },
    {
      key: "glide_out",
      label: "Glide Out",
      durationSec: 60,
      color: "#F0B0C0",
      instruction: "Respire normalement. Sens l'énergie circuler. Tu es vivant·e.",
    },
  ],
};

export const AURORA_PROTOCOLS: Record<AuroraVariant, AuroraProtocol> = {
  calm: CALM,
  focus: FOCUS,
  sleep: SLEEP,
  ignite: IGNITE,
};

export function getProtocol(variant: AuroraVariant): AuroraProtocol {
  return AURORA_PROTOCOLS[variant];
}

export function getTotalDurationSec(protocol: AuroraProtocol): number {
  return protocol.phases.reduce((sum, p) => sum + p.durationSec, 0);
}
