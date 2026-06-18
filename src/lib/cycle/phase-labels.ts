/** Métadonnées d'affichage des phases du cycle — source unique partagée. */
import type { CyclePhase } from "@/lib/cycle/phases";

export const PHASE_LABEL: Record<CyclePhase, string> = {
  menstruation: "Menstruation",
  folliculaire: "Folliculaire",
  ovulation: "Ovulation",
  luteale: "Lutéale",
};

export const PHASES: CyclePhase[] = ["menstruation", "folliculaire", "ovulation", "luteale"];
