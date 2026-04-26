/**
 * Binaural beats — pure WebAudio API, zéro dépendance externe.
 *
 * Principe : un beat binaural se produit quand chaque oreille reçoit
 * une fréquence légèrement différente. Le cerveau perçoit la différence
 * (`beatHz`) comme un battement subjectif.
 *
 * AVERTISSEMENT (BRIEF §5.3 + §risques) : disclaimer épilepsie / conduite
 * OBLIGATOIRE avant lecture. Le composant `BinauralPlayer` l'affiche.
 */

export type BinauralPreset = "delta" | "theta" | "alpha" | "beta";

export interface BinauralPresetSpec {
  /** Identifiant interne. */
  id: BinauralPreset;
  /** Libellé FR pour l'UI. */
  labelFr: string;
  /** Libellé EN pour l'UI. */
  labelEn: string;
  /** Description courte (effet recherché — sans claim médical). */
  shortFr: string;
  /** Couleur d'accent (chip, bouton). */
  accent: string;
  /** Fréquence porteuse (Hz). Standard : 200 Hz. */
  carrierHz: number;
  /** Battement (Hz). Différence L/R. */
  beatHz: number;
  /** Durée recommandée (s). */
  recommendedSeconds: number;
}

export const BINAURAL_PRESETS: BinauralPresetSpec[] = [
  {
    id: "delta",
    labelFr: "Delta · sommeil profond",
    labelEn: "Delta · deep sleep",
    shortFr: "Pour glisser vers le sommeil. À écouter allongé, pas en conduite.",
    accent: "#5e6da8",
    carrierHz: 100,
    beatHz: 2,
    recommendedSeconds: 15 * 60,
  },
  {
    id: "theta",
    labelFr: "Theta · méditation profonde",
    labelEn: "Theta · deep meditation",
    shortFr: "Calme intérieur, état méditatif.",
    accent: "#7c5fa6",
    carrierHz: 150,
    beatHz: 6,
    recommendedSeconds: 12 * 60,
  },
  {
    id: "alpha",
    labelFr: "Alpha · détente lucide",
    labelEn: "Alpha · relaxed focus",
    shortFr: "Détente sans somnolence, idéal pour respirer.",
    accent: "#3a8a5a",
    carrierHz: 200,
    beatHz: 10,
    recommendedSeconds: 10 * 60,
  },
  {
    id: "beta",
    labelFr: "Beta · présence vive",
    labelEn: "Beta · alert focus",
    shortFr: "Concentration douce, ancrage attentif.",
    accent: "#06b6d4",
    carrierHz: 250,
    beatHz: 18,
    recommendedSeconds: 8 * 60,
  },
];

export function getPreset(id: BinauralPreset): BinauralPresetSpec {
  return BINAURAL_PRESETS.find((preset) => preset.id === id) ?? BINAURAL_PRESETS[2];
}

export interface BinauralEngineHandle {
  /** Coupe les oscillateurs et libère le contexte. Idempotent. */
  stop(): void;
  /** True si engine actif. */
  readonly running: boolean;
}

/**
 * Démarre un beat binaural. Retourne un handle pour l'arrêter.
 *
 * Note : doit être appelé après une interaction utilisateur (gesture)
 * sinon Safari/Chrome bloquent l'AudioContext (autoplay policy).
 */
export function startBinaural(
  preset: BinauralPresetSpec,
  options: { volume?: number } = {}
): BinauralEngineHandle {
  const volume = Math.min(0.5, Math.max(0, options.volume ?? 0.18));

  if (typeof window === "undefined") {
    return { stop: () => {}, get running() { return false; } };
  }

  const AudioCtxCtor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtxCtor) {
    return { stop: () => {}, get running() { return false; } };
  }

  const ctx = new AudioCtxCtor();
  const merger = ctx.createChannelMerger(2);
  const gain = ctx.createGain();
  gain.gain.value = 0;
  // Fade-in 600ms — évite le pop de démarrage.
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.6);

  const oscL = ctx.createOscillator();
  const oscR = ctx.createOscillator();
  oscL.type = "sine";
  oscR.type = "sine";
  oscL.frequency.value = preset.carrierHz;
  oscR.frequency.value = preset.carrierHz + preset.beatHz;

  const panL = ctx.createStereoPanner();
  const panR = ctx.createStereoPanner();
  panL.pan.value = -1;
  panR.pan.value = 1;

  oscL.connect(panL).connect(merger, 0, 0);
  oscR.connect(panR).connect(merger, 0, 1);
  merger.connect(gain).connect(ctx.destination);

  oscL.start();
  oscR.start();

  let alive = true;

  function stop() {
    if (!alive) return;
    alive = false;
    try {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      setTimeout(() => {
        try {
          oscL.stop();
          oscR.stop();
          ctx.close();
        } catch {
          /* déjà fermé */
        }
      }, 450);
    } catch {
      /* noop */
    }
  }

  return {
    stop,
    get running() {
      return alive;
    },
  };
}
