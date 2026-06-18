export interface GuidageMode {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  durationMinutes: number;
  speakerTurnSeconds: number;
}

export const GUIDAGE_MODES: GuidageMode[] = [
  { id: 1, slug: "silence", name: "Silence Sacré", description: "Contemplation silencieuse en présence collective", icon: "🌑", durationMinutes: 10, speakerTurnSeconds: 0 },
  { id: 2, slug: "affirmations", name: "Affirmations", description: "Chaque participante énonce une affirmation à voix haute", icon: "✨", durationMinutes: 15, speakerTurnSeconds: 60 },
  { id: 3, slug: "respiration", name: "Respiration", description: "Cohérence cardiaque guidée — 5 secondes inspiration, 5 secondes expiration", icon: "🌬️", durationMinutes: 12, speakerTurnSeconds: 0 },
  { id: 4, slug: "partage", name: "Partage", description: "Partage anonyme d'expériences personnelles à tour de rôle", icon: "💬", durationMinutes: 30, speakerTurnSeconds: 120 },
  { id: 5, slug: "gratitude", name: "Gratitude", description: "Expression de gratitude — chaque participante nomme 3 gratitudes", icon: "🙏", durationMinutes: 20, speakerTurnSeconds: 90 },
  { id: 6, slug: "intention", name: "Intention", description: "Formulation collective d'une intention pour le cycle", icon: "🎯", durationMinutes: 20, speakerTurnSeconds: 90 },
  { id: 7, slug: "visualisation", name: "Visualisation", description: "Voyage guidé de visualisation créatrice collective", icon: "🌈", durationMinutes: 25, speakerTurnSeconds: 0 },
  { id: 8, slug: "chant", name: "Chant Sacré", description: "Ton et chant harmonique — vibration collective", icon: "🎵", durationMinutes: 20, speakerTurnSeconds: 0 },
];

export function getGuidageMode(id: number): GuidageMode | undefined {
  return GUIDAGE_MODES.find((m) => m.id === id);
}
