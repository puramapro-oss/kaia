/**
 * Trust Gate — vérification d'intention bienveillante avant l'accès à un
 * événement C.O.R.E. Combine le niveau de l'événement, le plan VITAE et le
 * niveau de pureté (purity_level) de la participante.
 *
 * Aucun appel réseau : fonction pure, testable.
 */
import { PURITY_LEVELS, type PurityLevel } from "@/lib/constants";

export type TrustLevel = "open" | "member" | "premium";

export interface TrustGateInput {
  trustLevel: TrustLevel;
  plan: string;
  purityLevel: PurityLevel;
  /** Nombre d'événements CORE déjà complétés (réputation). */
  coreEventsCompleted?: number;
}

export interface TrustGateResult {
  allowed: boolean;
  reason?: string;
}

const PAID_PLANS = new Set(["essentiel", "infini", "legende"]);
const PREMIUM_PLANS = new Set(["infini", "legende"]);

/** Rang ordinal d'un niveau de pureté (aube=0 … sagesse=3). */
export function purityRank(level: PurityLevel): number {
  const idx = PURITY_LEVELS.indexOf(level);
  return idx < 0 ? 0 : idx;
}

export function checkTrustGate(input: TrustGateInput): TrustGateResult {
  const { trustLevel, plan, purityLevel, coreEventsCompleted = 0 } = input;

  switch (trustLevel) {
    case "open":
      return { allowed: true };

    case "member": {
      const trusted =
        PAID_PLANS.has(plan) ||
        purityRank(purityLevel) >= purityRank("croissant") ||
        coreEventsCompleted >= 1;
      return trusted
        ? { allowed: true }
        : {
            allowed: false,
            reason:
              "Cet événement est réservé aux membres. Complète un premier rituel ou passe à VITAE pour y accéder.",
          };
    }

    case "premium":
      return PREMIUM_PLANS.has(plan)
        ? { allowed: true }
        : {
            allowed: false,
            reason:
              "Cet événement est réservé aux plans Infini et Légende.",
          };

    default:
      return { allowed: false, reason: "Niveau d'accès inconnu." };
  }
}
