import type { LegalAppConfig } from "@/lib/legal/types";
import { buildCompanyInfo, buildMediateurInfo } from "@/lib/legal/company";

/**
 * Config NIYAMA de KAÏA — aPaiement/aChatIA vérifiés dans le code réel (Stripe checkout
 * `src/app/api/stripe/checkout`, chat IA `src/components/luna/LunaChatInterface.tsx`).
 * Tarifs repris de l'ancienne page `/legal/cgu` (contenu déjà vérifié, réutilisé tel quel).
 */
export const KAIA_LEGAL_CONFIG: LegalAppConfig = {
  slug: "kaia",
  nom: "KAÏA",
  domaine: "kaia.purama.dev",
  famille: "sante_bienetre",
  company: buildCompanyInfo(),
  mediateur: buildMediateurInfo(),
  descriptionActivite:
    "KAÏA propose des routines de bien-être multisensorielles (respiration, méditation, mouvement, gratitude) fondées sur l'intelligence du cycle féminin. KAÏA ne fournit aucun acte médical, aucun diagnostic, aucun traitement.",
  aPaiement: true,
  aChatIA: true,
  clausesSpecifiquesCgv: [
    {
      titre: "Abonnement et tarifs",
      paragraphes: [
        "KAÏA Premium est proposé à 14,99 € par mois ou 125,91 € par an. Un essai gratuit de 14 jours est offert sans carte bancaire selon l'offre en cours.",
        "L'abonnement se renouvelle automatiquement à la fin de chaque période sauf résiliation par le Client avant la date d'échéance, depuis son espace ou depuis l'App Store / Google Play.",
      ],
    },
  ],
};
