/**
 * Guide de Vie Cyclique — quotidien adapté aux 4 phases du cycle.
 * Contenu pédagogique réel (jamais médical, jamais Lorem). LUNA peut enrichir
 * le "guide du jour" via l'API, mais ce socle reste disponible hors-ligne.
 *
 * 4 dimensions par phase : repos/énergie, focus, mouvement, alimentation.
 */
import type { CyclePhase } from "@/lib/cycle/phases";

export interface LifeGuideDimension {
  key: "energie" | "focus" | "mouvement" | "alimentation";
  label: string;
  emoji: string;
  tips: string[];
}

export interface PhaseLifeGuide {
  phase: CyclePhase;
  title: string;
  mantra: string;
  dimensions: LifeGuideDimension[];
}

export const LIFE_GUIDE_BY_PHASE: Record<CyclePhase, PhaseLifeGuide> = {
  menstruation: {
    phase: "menstruation",
    title: "Le temps du repos",
    mantra: "Je m'autorise à ralentir et à me déposer.",
    dimensions: [
      {
        key: "energie",
        label: "Énergie & repos",
        emoji: "🌑",
        tips: [
          "Allège ton agenda : reporte ce qui peut l'être, dis non sans culpabilité.",
          "Offre-toi des moments de silence et de chaleur (bain, plaid, tisane).",
          "Couche-toi plus tôt : ton besoin de sommeil est naturellement plus grand.",
        ],
      },
      {
        key: "focus",
        label: "Focus & projets",
        emoji: "🕯️",
        tips: [
          "Bilan intérieur plutôt que lancement : note ce qui se clôt en toi.",
          "Lâche-prise par l'écriture libre, sans relire ni juger.",
        ],
      },
      {
        key: "mouvement",
        label: "Mouvement",
        emoji: "🧘",
        tips: [
          "Yin yoga, étirements doux, marche tranquille au grand air.",
          "Évite les efforts intenses : écoute le signal de fatigue.",
        ],
      },
      {
        key: "alimentation",
        label: "Alimentation",
        emoji: "🍵",
        tips: [
          "Aliments chauds et réconfortants, fer (lentilles, épinards) pour compenser les pertes.",
          "Tisane de framboisier, gingembre pour apaiser les tensions.",
        ],
      },
    ],
  },
  folliculaire: {
    phase: "folliculaire",
    title: "Le temps de l'élan",
    mantra: "Mon énergie revient, j'ose explorer.",
    dimensions: [
      {
        key: "energie",
        label: "Énergie & repos",
        emoji: "🌱",
        tips: [
          "Profite de la montée d'énergie pour avancer ce qui te tient à cœur.",
          "Ton enthousiasme est haut : capitalise dessus sans t'épuiser.",
        ],
      },
      {
        key: "focus",
        label: "Focus & projets",
        emoji: "💡",
        tips: [
          "Phase idéale pour démarrer, apprendre, planifier de nouveaux projets.",
          "Ta pensée est claire et stratégique : pose les fondations.",
        ],
      },
      {
        key: "mouvement",
        label: "Mouvement",
        emoji: "🤸",
        tips: [
          "Cardio léger, danse, randonnée, nouvelles activités sportives.",
          "Ton corps récupère vite : explore, varie les plaisirs.",
        ],
      },
      {
        key: "alimentation",
        label: "Alimentation",
        emoji: "🥗",
        tips: [
          "Protéines et légumes verts pour soutenir l'énergie qui monte.",
          "Aliments fermentés (kéfir, choucroute) pour la vitalité.",
        ],
      },
    ],
  },
  ovulation: {
    phase: "ovulation",
    title: "Le temps du rayonnement",
    mantra: "Je rayonne et je me relie aux autres.",
    dimensions: [
      {
        key: "energie",
        label: "Énergie & repos",
        emoji: "🌕",
        tips: [
          "Pic d'énergie et de magnétisme : ose te montrer, t'exprimer.",
          "Canalise : tout n'a pas besoin d'être fait aujourd'hui.",
        ],
      },
      {
        key: "focus",
        label: "Focus & projets",
        emoji: "🗣️",
        tips: [
          "Conversations importantes, négociations, prises de parole en public.",
          "Phase reine pour collaborer et fédérer autour de tes idées.",
        ],
      },
      {
        key: "mouvement",
        label: "Mouvement",
        emoji: "🔥",
        tips: [
          "HIIT, sport intense, danse expressive : ton corps peut donner beaucoup.",
          "Sports collectifs pour profiter de l'énergie sociale.",
        ],
      },
      {
        key: "alimentation",
        label: "Alimentation",
        emoji: "🫐",
        tips: [
          "Antioxydants, fruits de saison, fibres pour soutenir le foie.",
          "Hydratation renforcée pendant cette phase de haute activité.",
        ],
      },
    ],
  },
  luteale: {
    phase: "luteale",
    title: "Le temps de l'ancrage",
    mantra: "Je reviens vers moi et j'affine ma vision.",
    dimensions: [
      {
        key: "energie",
        label: "Énergie & repos",
        emoji: "🌖",
        tips: [
          "L'énergie redescend : protège ton temps, réduis les sollicitations.",
          "Accueille la sensibilité accrue comme une boussole, pas un défaut.",
        ],
      },
      {
        key: "focus",
        label: "Focus & projets",
        emoji: "📋",
        tips: [
          "Finalise, organise, mets de l'ordre plutôt que de lancer du neuf.",
          "Idéal pour les tâches minutieuses et l'introspection.",
        ],
      },
      {
        key: "mouvement",
        label: "Mouvement",
        emoji: "🏊",
        tips: [
          "Pilates, yoga, natation, marche en nature : doux mais régulier.",
          "Réduis l'intensité à mesure que tu approches des règles.",
        ],
      },
      {
        key: "alimentation",
        label: "Alimentation",
        emoji: "🍫",
        tips: [
          "Magnésium (chocolat noir, oléagineux), oméga-3 pour apaiser le SPM.",
          "Limite sucre et caféine si tu ressens irritabilité ou tensions.",
        ],
      },
    ],
  },
};

export function getLifeGuide(phase: CyclePhase): PhaseLifeGuide {
  return LIFE_GUIDE_BY_PHASE[phase];
}

/** Mantra du jour pour une phase (utilisé en en-tête de page et dans les emails). */
export function getPhaseMantra(phase: CyclePhase): string {
  return LIFE_GUIDE_BY_PHASE[phase].mantra;
}
