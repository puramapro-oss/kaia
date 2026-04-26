/**
 * Nature sounds — spatialisation Web Audio (P3+ chargement réel).
 *
 * Mapping placeholder par ambiance. En P2 : table définie, lecture lazy
 * dans `BinauralPlayer` ou layouts ambiants P3.
 *
 * Files attendus : `public/audio/nature/{slug}.mp3` (mono, 64-96 kbps,
 * boucle parfaite ≥ 30s). Si absent → silence (composant gère).
 */

import type { NatureSlug } from "@/lib/multisensorial/motion-tokens";

export interface NatureSoundSpec {
  /** Slug aligné avec NATURE_TOKENS. */
  slug: NatureSlug;
  /** Chemin public attendu. */
  src: string;
  /** Volume par défaut (0..1). */
  defaultVolume: number;
  /** Spatialisation panner (true = stéréo en mouvement, false = mono centre). */
  spatial: boolean;
}

export const NATURE_SOUNDS: NatureSoundSpec[] = [
  { slug: "forest", src: "/audio/nature/forest.mp3", defaultVolume: 0.18, spatial: true },
  { slug: "ocean", src: "/audio/nature/ocean.mp3", defaultVolume: 0.22, spatial: true },
  { slug: "mountain", src: "/audio/nature/mountain.mp3", defaultVolume: 0.14, spatial: false },
  { slug: "desert", src: "/audio/nature/desert.mp3", defaultVolume: 0.14, spatial: true },
  { slug: "savanna", src: "/audio/nature/savanna.mp3", defaultVolume: 0.16, spatial: true },
  { slug: "waterfall", src: "/audio/nature/waterfall.mp3", defaultVolume: 0.22, spatial: false },
  { slug: "jungle", src: "/audio/nature/jungle.mp3", defaultVolume: 0.18, spatial: true },
  { slug: "snow", src: "/audio/nature/snow.mp3", defaultVolume: 0.12, spatial: false },
  { slug: "meadow", src: "/audio/nature/meadow.mp3", defaultVolume: 0.16, spatial: true },
  { slug: "lake", src: "/audio/nature/lake.mp3", defaultVolume: 0.16, spatial: true },
  { slug: "stars", src: "/audio/nature/stars.mp3", defaultVolume: 0.1, spatial: false },
  { slug: "aurora", src: "/audio/nature/aurora.mp3", defaultVolume: 0.12, spatial: false },
];

export function getNatureSound(slug: NatureSlug): NatureSoundSpec {
  return NATURE_SOUNDS.find((s) => s.slug === slug) ?? NATURE_SOUNDS[0];
}
