/**
 * Réconciliation Corps — modules d'accompagnement de la relation au corps féminin.
 * Contenu pédagogique et bienveillant (jamais thérapeutique certifié, jamais médical).
 * Chaque module ouvre une exploration guidée par LUNA (mode general ou caregiver_support).
 */

export type ReconciliationModuleKey =
  | "acceptation-douleur"
  | "image-corporelle"
  | "feminite"
  | "menopause";

import type { LunaMode } from "@/lib/luna/modes";

export interface ReconciliationModule {
  key: ReconciliationModuleKey;
  title: string;
  emoji: string;
  intro: string;
  /** Invitations d'écriture / réflexion proposées à l'utilisatrice. */
  prompts: string[];
  /** Mode LUNA à utiliser pour l'exploration accompagnée de ce module. */
  lunaMode: LunaMode;
}

export const RECONCILIATION_MODULES: ReconciliationModule[] = [
  {
    key: "acceptation-douleur",
    title: "Accueillir la douleur",
    emoji: "🤍",
    intro:
      "La douleur cyclique n'est pas une fatalité à subir en silence. Apprends à l'écouter, à la nommer, et à demander du soutien quand elle dépasse l'ordinaire.",
    prompts: [
      "Où ressens-tu la douleur dans ton corps, et qu'essaie-t-elle de te dire ?",
      "Quels gestes t'apaisent vraiment quand elle est là ?",
      "Quand la douleur devient-elle un signal qu'il faut consulter ?",
    ],
    lunaMode: "general",
  },
  {
    key: "image-corporelle",
    title: "Image corporelle",
    emoji: "🪞",
    intro:
      "Ton corps change au fil du cycle, des saisons, des années. Réconcilier le regard que tu portes sur lui, c'est cultiver une présence plus douce et plus juste.",
    prompts: [
      "Quel mot offrirais-tu à ton corps aujourd'hui, sans jugement ?",
      "Quelle partie de toi mérite plus de gratitude que de critique ?",
      "De qui as-tu hérité ton regard sur ton corps ?",
    ],
    lunaMode: "general",
  },
  {
    key: "feminite",
    title: "Rapport à la féminité",
    emoji: "🌸",
    intro:
      "Il n'y a pas une seule façon d'être femme. Explore ce que la féminité signifie pour toi, au-delà des injonctions reçues.",
    prompts: [
      "Quelle définition de la féminité t'a-t-on transmise, et laquelle choisis-tu ?",
      "Quand te sens-tu pleinement toi-même dans ton corps de femme ?",
      "Qu'aimerais-tu transmettre, et qu'aimerais-tu laisser derrière toi ?",
    ],
    lunaMode: "general",
  },
  {
    key: "menopause",
    title: "Transformation & ménopause",
    emoji: "🌗",
    intro:
      "La ménopause est un passage, pas une fin. Un espace pour honorer la traversée, accueillir les changements et te relier à une nouvelle puissance.",
    prompts: [
      "Que ressens-tu face à cette transformation, sans filtre ?",
      "De quel soutien aurais-tu besoin pour la traverser sereinement ?",
      "Quelle liberté nouvelle pourrait s'ouvrir à toi ?",
    ],
    lunaMode: "caregiver_support",
  },
];

export function getReconciliationModule(
  key: ReconciliationModuleKey
): ReconciliationModule | undefined {
  return RECONCILIATION_MODULES.find((m) => m.key === key);
}
