import type { TransmissionRole } from "@/lib/transmission/invite";

/** Libellés d'affichage des rôles de transmission — source unique partagée. */
export const ROLE_LABEL: Record<TransmissionRole, string> = {
  fille: "Fille",
  mere: "Mère",
};
