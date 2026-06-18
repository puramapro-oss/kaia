/**
 * Rituels cycliques sacrés — table phase → rituels. LUNA peut surcharger la
 * recommandation si le journal récent le justifie (override passé en param).
 * Pédagogique, jamais médical.
 */
import type { CyclePhase } from "@/lib/cycle/phases";

export interface CyclicRitual {
  slug: string;
  title: string;
  description: string;
  durationMin: number;
  emoji: string;
}

export const RITUALS_BY_PHASE: Record<CyclePhase, CyclicRitual[]> = {
  menstruation: [
    { slug: "repos-sacre", title: "Repos Sacré", description: "Ralentir, s'envelopper de douceur, honorer le besoin de repli.", durationMin: 15, emoji: "🌑" },
    { slug: "lacher-prise", title: "Lâcher-Prise", description: "Déposer ce qui n'est plus, écriture libératrice.", durationMin: 10, emoji: "🍂" },
  ],
  folliculaire: [
    { slug: "nouveau-depart", title: "Nouveau Départ", description: "Planter une intention, visualiser l'élan qui revient.", durationMin: 12, emoji: "🌱" },
    { slug: "creativite", title: "Élan Créatif", description: "Mouvement libre, brainstorm, jeu créatif.", durationMin: 15, emoji: "🎨" },
  ],
  ovulation: [
    { slug: "expression", title: "Expression Rayonnante", description: "Prendre la parole, partager, célébrer sa pleine énergie.", durationMin: 12, emoji: "☀️" },
    { slug: "partage", title: "Partage", description: "Se relier aux autres, gratitude exprimée à voix haute.", durationMin: 10, emoji: "💞" },
  ],
  luteale: [
    { slug: "introspection", title: "Introspection", description: "Revue douce du cycle, ce qui a nourri, ce qui a pesé.", durationMin: 15, emoji: "🌙" },
    { slug: "ancrage", title: "Ancrage", description: "Respiration lente, retour au corps, frontières saines.", durationMin: 12, emoji: "🪨" },
  ],
};

export function getRitualsForPhase(phase: CyclePhase): CyclicRitual[] {
  return RITUALS_BY_PHASE[phase];
}

/**
 * Recommandation principale pour une phase. Si `overrideSlug` correspond à un
 * rituel de la phase (override LUNA), il est priorisé ; sinon le premier.
 */
export function recommendRitual(phase: CyclePhase, overrideSlug?: string): CyclicRitual {
  const list = RITUALS_BY_PHASE[phase];
  if (overrideSlug) {
    const match = list.find((r) => r.slug === overrideSlug);
    if (match) return match;
  }
  return list[0];
}
