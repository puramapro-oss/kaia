export type CyclePhase = "menstruation" | "folliculaire" | "ovulation" | "luteale";

export interface PhaseInfo {
  phase: CyclePhase;
  dayInPhase: number;
  daysUntilNext: number;
  nextPhase: CyclePhase;
  emoji: string;
  color: string;
  bgColor: string;
  label: string;
  energy: "basse" | "montante" | "haute" | "descendante";
  description: string;
  recommendations: string[];
}

// Default phase durations (days)
const PHASE_DURATIONS: Record<CyclePhase, number> = {
  menstruation: 5,
  folliculaire: 9,
  ovulation: 3,
  luteale: 11,
};

export function detectPhase(cycleDay: number, cycleDuration = 28): PhaseInfo {
  const day = ((cycleDay - 1) % cycleDuration) + 1;

  // Scale phase durations to cycle length
  const scale = cycleDuration / 28;
  const mensDays = Math.round(PHASE_DURATIONS.menstruation * scale);
  const follDays = Math.round(PHASE_DURATIONS.folliculaire * scale);
  const ovuDays = Math.round(PHASE_DURATIONS.ovulation * scale);

  let phase: CyclePhase;
  let dayInPhase: number;
  let phaseTotal: number;

  if (day <= mensDays) {
    phase = "menstruation";
    dayInPhase = day;
    phaseTotal = mensDays;
  } else if (day <= mensDays + follDays) {
    phase = "folliculaire";
    dayInPhase = day - mensDays;
    phaseTotal = follDays;
  } else if (day <= mensDays + follDays + ovuDays) {
    phase = "ovulation";
    dayInPhase = day - mensDays - follDays;
    phaseTotal = ovuDays;
  } else {
    phase = "luteale";
    dayInPhase = day - mensDays - follDays - ovuDays;
    phaseTotal = cycleDuration - mensDays - follDays - ovuDays;
  }

  const daysUntilNext = phaseTotal - dayInPhase;

  const PHASE_META: Record<CyclePhase, Omit<PhaseInfo, "phase" | "dayInPhase" | "daysUntilNext" | "nextPhase">> = {
    menstruation: {
      emoji: "🌑",
      color: "#E87A7A",
      bgColor: "rgba(232,122,122,0.12)",
      label: "Menstruation",
      energy: "basse",
      description: "Période de renouveau intérieur. Ton corps libère ce qui n'est plus nécessaire.",
      recommendations: [
        "Privilégie le repos et l'introspection",
        "Chaleur sur le ventre, tisanes de framboisier",
        "Mouvement doux : yin yoga, marche tranquille",
      ],
    },
    folliculaire: {
      emoji: "🌒",
      color: "#7AE8A0",
      bgColor: "rgba(122,232,160,0.12)",
      label: "Phase folliculaire",
      energy: "montante",
      description: "Énergie en plein éveil. Ton corps se prépare, ta créativité s'éveille.",
      recommendations: [
        "Lance de nouveaux projets, explore de nouvelles idées",
        "Alimentation riche en protéines et légumes verts",
        "Cardio léger, danse, activités nouvelles",
      ],
    },
    ovulation: {
      emoji: "🌕",
      color: "#E8C87A",
      bgColor: "rgba(232,200,122,0.12)",
      label: "Ovulation",
      energy: "haute",
      description: "Ton pic d'énergie et de magnétisme. Connexion, communication, rayonnement.",
      recommendations: [
        "Moments sociaux, conversations importantes",
        "Aliments antioxydants, fruits de saison",
        "HIIT, sport intense, danse expressive",
      ],
    },
    luteale: {
      emoji: "🌖",
      color: "#C8B9F0",
      bgColor: "rgba(200,185,240,0.12)",
      label: "Phase lutéale",
      energy: "descendante",
      description: "Retour vers l'intérieur. Écoute tes besoins profonds, affine ta vision.",
      recommendations: [
        "Finalise les projets en cours, introspection",
        "Magnésium, chocolat noir, oméga-3",
        "Pilates, yoga, natation, marche en nature",
      ],
    },
  };

  const phaseOrder: CyclePhase[] = ["menstruation", "folliculaire", "ovulation", "luteale"];
  const nextPhase = phaseOrder[(phaseOrder.indexOf(phase) + 1) % 4];

  return {
    phase,
    dayInPhase,
    daysUntilNext,
    nextPhase,
    ...PHASE_META[phase],
  };
}

/**
 * Phase courante d'une utilisatrice à partir de son profil. Défaut "folliculaire"
 * si le cycle n'est pas renseigné. Source unique pour pages + API.
 */
export function getPhaseFromProfile(
  profile: { cycle_start_date?: string | null; cycle_duration?: number | null } | null | undefined
): CyclePhase {
  if (!profile?.cycle_start_date) return "folliculaire";
  const day = getCycleDay(new Date(profile.cycle_start_date));
  return detectPhase(day, profile.cycle_duration || 28).phase;
}

export function getCycleDay(startDate: Date, today = new Date()): number {
  const diffMs = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export function getNextPeriodDate(startDate: Date, cycleDuration = 28): Date {
  const next = new Date(startDate);
  next.setDate(next.getDate() + cycleDuration);
  return next;
}

export function formatDaysUntil(days: number): string {
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
}
