/**
 * Guide Émotionnel Cyclique — roue des émotions × 4 phases.
 * Pour chaque phase : émotions fréquemment vécues + accueil bienveillant
 * (jamais pathologisant). LUNA peut proposer une exploration plus fine.
 */
import type { CyclePhase } from "@/lib/cycle/phases";

export interface EmotionEntry {
  emotion: string;
  emoji: string;
  /** Pourquoi cette émotion est fréquente à cette phase (cadre pédagogique). */
  context: string;
  /** Geste d'accueil concret, doux, non médical. */
  welcome: string;
}

export const EMOTIONS_BY_PHASE: Record<CyclePhase, EmotionEntry[]> = {
  menstruation: [
    {
      emotion: "Vulnérabilité",
      emoji: "🌧️",
      context: "La descente hormonale ouvre une sensibilité plus à fleur de peau.",
      welcome: "Accueille-la comme une porte vers tes vrais besoins, pas une faiblesse.",
    },
    {
      emotion: "Besoin de retrait",
      emoji: "🐚",
      context: "Le corps invite au repli et à l'intériorité.",
      welcome: "Offre-toi un cocon : moins de stimulations, plus de douceur.",
    },
    {
      emotion: "Clarté intérieure",
      emoji: "🔮",
      context: "Le voile se lève sur ce qui ne te convient plus vraiment.",
      welcome: "Note ces intuitions sans agir tout de suite : elles mûriront.",
    },
  ],
  folliculaire: [
    {
      emotion: "Enthousiasme",
      emoji: "✨",
      context: "L'œstrogène remonte et ravive l'envie d'agir et d'explorer.",
      welcome: "Canalise cet élan vers une intention qui compte pour toi.",
    },
    {
      emotion: "Curiosité",
      emoji: "🧭",
      context: "L'esprit est ouvert, joueur, avide de nouveauté.",
      welcome: "Permets-toi d'apprendre ou de tester quelque chose d'inédit.",
    },
    {
      emotion: "Optimisme",
      emoji: "🌤️",
      context: "La confiance revient naturellement avec l'énergie.",
      welcome: "Pose un petit pas concret vers un rêve mis de côté.",
    },
  ],
  ovulation: [
    {
      emotion: "Confiance",
      emoji: "🌟",
      context: "Le pic hormonal soutient l'assurance et le magnétisme.",
      welcome: "Ose dire, demander, te montrer telle que tu es.",
    },
    {
      emotion: "Élan de connexion",
      emoji: "💞",
      context: "L'envie de relation et d'échange est à son sommet.",
      welcome: "Provoque les retrouvailles et les conversations qui nourrissent.",
    },
    {
      emotion: "Générosité",
      emoji: "🤲",
      context: "Le trop-plein d'énergie cherche à être partagé.",
      welcome: "Donne sans t'oublier : garde une part d'énergie pour toi.",
    },
  ],
  luteale: [
    {
      emotion: "Irritabilité",
      emoji: "🌩️",
      context: "La chute de progestérone amplifie les tensions et l'impatience.",
      welcome: "C'est un signal, pas un défaut : repère le besoin caché derrière.",
    },
    {
      emotion: "Mélancolie",
      emoji: "🍂",
      context: "La phase invite au bilan, parfois teinté de nostalgie.",
      welcome: "Laisse passer la vague sans t'y identifier : elle est cyclique.",
    },
    {
      emotion: "Besoin de frontières",
      emoji: "🛡️",
      context: "Ta tolérance au superflu baisse, ton discernement monte.",
      welcome: "Pose tes limites clairement : c'est un acte de respect de toi.",
    },
  ],
};

export function getEmotionsForPhase(phase: CyclePhase): EmotionEntry[] {
  return EMOTIONS_BY_PHASE[phase];
}

/** Trouve l'entrée d'accueil pour une émotion donnée dans une phase (insensible casse). */
export function findEmotion(phase: CyclePhase, emotion: string): EmotionEntry | undefined {
  const target = emotion.trim().toLowerCase();
  return EMOTIONS_BY_PHASE[phase].find((e) => e.emotion.toLowerCase() === target);
}
