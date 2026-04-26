/**
 * Motion tokens — manifeste des 12 boucles nature signature de KAÏA.
 *
 * Chaque slot couvre :
 *   - un gradient CSS (placeholder visuel toujours dispo, zéro réseau)
 *   - une fiche Pexels (URL officielle, photographe) pour download manuel optionnel
 *   - un prompt Replicate prêt pour la génération IA (`scripts/generate-nature-videos.ts`)
 *   - un mapping pratique → vidéo (utilisé par les routines)
 *
 * Si `public/videos/nature/{slug}.mp4` existe, ParallaxNatureBackground le charge.
 * Sinon, le gradient CSS est appliqué — l'UX reste fluide.
 */

export type NatureSlug =
  | "forest"
  | "ocean"
  | "mountain"
  | "desert"
  | "savanna"
  | "waterfall"
  | "jungle"
  | "snow"
  | "meadow"
  | "lake"
  | "stars"
  | "aurora";

export interface NatureToken {
  /** Identifiant stable (slug) — clé de fichier `public/videos/nature/{slug}.mp4`. */
  slug: NatureSlug;
  /** Libellé FR pour l'UI (settings, picker). */
  labelFr: string;
  /** Libellé EN pour l'UI. */
  labelEn: string;
  /** Description courte (sous-titre carte). */
  shortFr: string;
  /** Gradient CSS (placeholder vivant + fallback si vidéo absente). */
  gradient: string;
  /** Couleur d'accent principale (overlay subtil, glow). */
  accent: string;
  /** URL publique Pexels (recherche / page de la vidéo officielle pour download manuel). */
  pexelsSearchUrl: string;
  /** Crédit photographe (à reporter sur /legal/credits). */
  pexelsCredit: string;
  /** Prompt Replicate (modèle text-to-video) pour génération IA. */
  replicatePrompt: string;
  /** Tags d'usage : pratiques recommandées avec ce fond. */
  practiceTags: string[];
  /** Tonalité émotionnelle (drive le mood UI). */
  mood: "calm" | "warm" | "vivid" | "cosmic";
}

/**
 * Catalogue complet — 12 ambiances. Order = order dans le picker.
 */
export const NATURE_TOKENS: NatureToken[] = [
  {
    slug: "forest",
    labelFr: "Forêt française",
    labelEn: "French forest",
    shortFr: "Sous-bois doux, lumière filtrée par les feuilles.",
    gradient:
      "radial-gradient(80% 60% at 30% 30%, rgba(40,107,73,0.55) 0%, transparent 60%), radial-gradient(60% 60% at 80% 75%, rgba(20,60,40,0.7) 0%, transparent 70%), linear-gradient(180deg, #0e1f17 0%, #060d09 100%)",
    accent: "#3a8a5a",
    pexelsSearchUrl: "https://www.pexels.com/search/videos/forest%20france/",
    pexelsCredit: "À crediter au moment du download",
    replicatePrompt:
      "Cinematic seamless loop of a French temperate forest with soft sunbeams filtering through beech leaves, gentle wind, ground covered in moss, very slow camera glide, photoreal, golden hour, no people, low contrast, calm wellness mood, 4K",
    practiceTags: ["meditation", "ground", "morning", "focus"],
    mood: "calm",
  },
  {
    slug: "ocean",
    labelFr: "Océan",
    labelEn: "Ocean",
    shortFr: "Vagues longues, horizon doux.",
    gradient:
      "radial-gradient(70% 60% at 50% 30%, rgba(70,130,180,0.5) 0%, transparent 70%), linear-gradient(180deg, #0a2235 0%, #06141f 100%)",
    accent: "#4682b4",
    pexelsSearchUrl: "https://www.pexels.com/search/videos/ocean%20waves%20calm/",
    pexelsCredit: "À crediter au moment du download",
    replicatePrompt:
      "Slow cinematic loop of a calm turquoise ocean at dawn, gentle long waves, soft mist, cinematic anamorphic, no people, very low contrast, photoreal, 4K, wellness ambient",
    practiceTags: ["breath", "evening", "sleep", "calm"],
    mood: "calm",
  },
  {
    slug: "mountain",
    labelFr: "Montagne",
    labelEn: "Mountain",
    shortFr: "Crêtes au lever du jour.",
    gradient:
      "radial-gradient(70% 60% at 60% 35%, rgba(140,140,170,0.4) 0%, transparent 70%), linear-gradient(180deg, #1a2030 0%, #08090f 100%)",
    accent: "#7d8aa8",
    pexelsSearchUrl: "https://www.pexels.com/search/videos/mountain%20sunrise/",
    pexelsCredit: "À crediter au moment du download",
    replicatePrompt:
      "Aerial slow drone loop over a snowy mountain range at sunrise, alpenglow, soft clouds drifting between peaks, photoreal, no people, calm wide establishing shot, 4K",
    practiceTags: ["intention", "morning", "courage"],
    mood: "vivid",
  },
  {
    slug: "desert",
    labelFr: "Désert",
    labelEn: "Desert",
    shortFr: "Dunes ondulant doucement.",
    gradient:
      "radial-gradient(60% 60% at 50% 50%, rgba(212,144,106,0.5) 0%, transparent 70%), linear-gradient(180deg, #1f120a 0%, #0a0604 100%)",
    accent: "#d4906a",
    pexelsSearchUrl: "https://www.pexels.com/search/videos/sand%20dunes%20desert/",
    pexelsCredit: "À crediter au moment du download",
    replicatePrompt:
      "Cinematic loop of warm desert dunes at golden hour, sand grains sliding gently, long shadows, no people, photoreal, soft warm tones, 4K, calm meditative pace",
    practiceTags: ["focus", "warm", "afternoon"],
    mood: "warm",
  },
  {
    slug: "savanna",
    labelFr: "Savane",
    labelEn: "Savanna",
    shortFr: "Herbes hautes au vent.",
    gradient:
      "radial-gradient(70% 50% at 50% 60%, rgba(220,180,90,0.4) 0%, transparent 70%), linear-gradient(180deg, #221c0d 0%, #0a0905 100%)",
    accent: "#dcb45a",
    pexelsSearchUrl: "https://www.pexels.com/search/videos/savanna%20grass%20wind/",
    pexelsCredit: "À crediter au moment du download",
    replicatePrompt:
      "Cinematic loop of golden African savanna at dusk, tall grass swaying in soft wind, distant acacia tree silhouette, photoreal, no people, warm tones, 4K",
    practiceTags: ["ground", "warm", "afternoon"],
    mood: "warm",
  },
  {
    slug: "waterfall",
    labelFr: "Cascade",
    labelEn: "Waterfall",
    shortFr: "Eau vive, brume légère.",
    gradient:
      "radial-gradient(60% 70% at 50% 40%, rgba(120,180,200,0.5) 0%, transparent 70%), linear-gradient(180deg, #0a1a1f 0%, #060c0f 100%)",
    accent: "#7ec1d4",
    pexelsSearchUrl: "https://www.pexels.com/search/videos/waterfall%20slow%20motion/",
    pexelsCredit: "À crediter au moment du download",
    replicatePrompt:
      "Cinematic slow-motion loop of a tropical waterfall, soft mist, lush green rocks, photoreal, no people, calm wellness, 4K, low contrast",
    practiceTags: ["breath", "release", "energy"],
    mood: "vivid",
  },
  {
    slug: "jungle",
    labelFr: "Jungle",
    labelEn: "Jungle",
    shortFr: "Verdure dense, lumière dorée.",
    gradient:
      "radial-gradient(70% 60% at 35% 40%, rgba(60,120,70,0.55) 0%, transparent 70%), radial-gradient(50% 60% at 80% 70%, rgba(244,196,48,0.18) 0%, transparent 70%), linear-gradient(180deg, #0a1a10 0%, #050b06 100%)",
    accent: "#5fa572",
    pexelsSearchUrl: "https://www.pexels.com/search/videos/jungle%20rainforest/",
    pexelsCredit: "À crediter au moment du download",
    replicatePrompt:
      "Cinematic loop deep in a humid Amazon rainforest, soft sun rays piercing the canopy, mist between giant trees, photoreal, no people, low saturation, 4K",
    practiceTags: ["energy", "vitality", "morning"],
    mood: "vivid",
  },
  {
    slug: "snow",
    labelFr: "Étendue neigeuse",
    labelEn: "Snowscape",
    shortFr: "Silence blanc, flocons rares.",
    gradient:
      "radial-gradient(70% 60% at 50% 40%, rgba(220,232,240,0.35) 0%, transparent 70%), linear-gradient(180deg, #0d1318 0%, #050709 100%)",
    accent: "#bcd2dc",
    pexelsSearchUrl: "https://www.pexels.com/search/videos/snow%20landscape%20winter/",
    pexelsCredit: "À crediter au moment du download",
    replicatePrompt:
      "Cinematic loop of a vast snowy Nordic landscape, gentle snowfall, soft pastel sky, photoreal, no people, ultra calm, very low contrast, 4K",
    practiceTags: ["calm", "sleep", "evening"],
    mood: "calm",
  },
  {
    slug: "meadow",
    labelFr: "Prairie",
    labelEn: "Meadow",
    shortFr: "Fleurs sauvages au matin.",
    gradient:
      "radial-gradient(70% 60% at 30% 40%, rgba(244,196,48,0.25) 0%, transparent 70%), radial-gradient(60% 60% at 80% 70%, rgba(40,107,73,0.3) 0%, transparent 70%), linear-gradient(180deg, #14180a 0%, #07090a 100%)",
    accent: "#e6c88a",
    pexelsSearchUrl: "https://www.pexels.com/search/videos/wildflowers%20meadow%20morning/",
    pexelsCredit: "À crediter au moment du download",
    replicatePrompt:
      "Cinematic loop of an alpine meadow with wildflowers swaying in morning breeze, soft golden light, blurred background mountains, photoreal, no people, 4K",
    practiceTags: ["gratitude", "morning", "joy"],
    mood: "warm",
  },
  {
    slug: "lake",
    labelFr: "Lac",
    labelEn: "Lake",
    shortFr: "Miroir d'eau, brume du soir.",
    gradient:
      "radial-gradient(60% 60% at 50% 60%, rgba(80,130,160,0.4) 0%, transparent 70%), linear-gradient(180deg, #0c1820 0%, #060a0d 100%)",
    accent: "#6aa1c4",
    pexelsSearchUrl: "https://www.pexels.com/search/videos/lake%20mirror%20mist/",
    pexelsCredit: "À crediter au moment du download",
    replicatePrompt:
      "Cinematic loop of a still alpine lake at dusk, mist rising, perfect mirror reflection of distant pine trees, photoreal, no people, ultra calm, 4K",
    practiceTags: ["evening", "intention", "calm"],
    mood: "calm",
  },
  {
    slug: "stars",
    labelFr: "Ciel étoilé",
    labelEn: "Starry sky",
    shortFr: "Voie lactée, immobilité cosmique.",
    gradient:
      "radial-gradient(60% 60% at 50% 30%, rgba(120,90,200,0.35) 0%, transparent 70%), radial-gradient(80% 80% at 50% 70%, rgba(20,30,60,0.7) 0%, transparent 70%), linear-gradient(180deg, #06070f 0%, #02030a 100%)",
    accent: "#9d8ce0",
    pexelsSearchUrl: "https://www.pexels.com/search/videos/milky%20way%20stars%20timelapse/",
    pexelsCredit: "À crediter au moment du download",
    replicatePrompt:
      "Cinematic timelapse loop of the Milky Way over a dark mountain silhouette, slow rotation of stars, photoreal, no people, ultra dark, 4K",
    practiceTags: ["meditation", "evening", "sleep"],
    mood: "cosmic",
  },
  {
    slug: "aurora",
    labelFr: "Aurore boréale",
    labelEn: "Aurora",
    shortFr: "Voiles verts dans la nuit polaire.",
    gradient:
      "radial-gradient(70% 60% at 50% 40%, rgba(60,180,140,0.5) 0%, transparent 70%), radial-gradient(50% 60% at 80% 70%, rgba(150,90,200,0.25) 0%, transparent 70%), linear-gradient(180deg, #050a10 0%, #02040a 100%)",
    accent: "#3ec79c",
    pexelsSearchUrl: "https://www.pexels.com/search/videos/aurora%20borealis%20northern%20lights/",
    pexelsCredit: "À crediter au moment du download",
    replicatePrompt:
      "Cinematic loop of vivid green aurora borealis over a snowy Norwegian landscape, slow ribbon-like motion, photoreal, no people, low saturation foreground, 4K",
    practiceTags: ["awe", "evening", "transformation"],
    mood: "cosmic",
  },
];

const TOKENS_BY_SLUG = NATURE_TOKENS.reduce<Record<NatureSlug, NatureToken>>(
  (acc, token) => {
    acc[token.slug] = token;
    return acc;
  },
  {} as Record<NatureSlug, NatureToken>
);

export function getNatureToken(slug: NatureSlug): NatureToken {
  return TOKENS_BY_SLUG[slug];
}

export const DEFAULT_NATURE: NatureSlug = "forest";

/**
 * Mapping pratique → ambiance par défaut.
 * Utilisé quand une pratique demande un fond mais sans préférence explicite.
 */
const PRACTICE_TO_NATURE: Record<string, NatureSlug> = {
  breath: "ocean",
  meditation: "forest",
  mantra: "stars",
  mudra: "meadow",
  exercise: "mountain",
  learning: "lake",
  reprogramming: "aurora",
  gratitude: "meadow",
  intention: "lake",
  sleep: "snow",
  morning: "meadow",
  evening: "lake",
};

export function natureForPractice(category: string): NatureSlug {
  return PRACTICE_TO_NATURE[category] ?? DEFAULT_NATURE;
}

/**
 * Chemin public présumé d'une vidéo. Vérifié runtime par le composant
 * (HEAD/onerror), pas garanti.
 */
export function natureVideoUrl(slug: NatureSlug): string {
  return `/videos/nature/${slug}.mp4`;
}

export function natureVideoUrlWebm(slug: NatureSlug): string {
  return `/videos/nature/${slug}.webm`;
}
