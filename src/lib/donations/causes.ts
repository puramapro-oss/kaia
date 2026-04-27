/**
 * Causes éligibles aux dons KAÏA — toutes reversées à l'Association PURAMA
 * (habilitée art.200 CGI : 66 % de défiscalisation pour le donneur).
 */
export interface DonationCause {
  slug: string;
  title: string;
  short: string;
  emoji: string;
  fiscalNote: string;
}

export const DONATION_CAUSES: DonationCause[] = [
  {
    slug: "asso-vida",
    title: "Association VIDA — bien-être pour tous",
    short:
      "Soutiens l'accès aux pratiques de bien-être pour les publics les plus précaires.",
    emoji: "💜",
    fiscalNote: "Reçu fiscal automatique (66 % défisc · art. 200 CGI).",
  },
  {
    slug: "trees",
    title: "Reforestation",
    short:
      "1 € = 1 arbre planté en partenariat avec EcoTree (France & Sénégal).",
    emoji: "🌳",
    fiscalNote: "Reçu fiscal automatique (66 % défisc · art. 200 CGI).",
  },
  {
    slug: "ocean",
    title: "Nettoyage des océans",
    short:
      "Soutiens The SeaCleaners pour l'extraction des plastiques en mer.",
    emoji: "🌊",
    fiscalNote: "Reçu fiscal automatique (66 % défisc · art. 200 CGI).",
  },
  {
    slug: "peace",
    title: "Paix intérieure & santé mentale",
    short:
      "Finance des accompagnements psychologiques pour publics vulnérables.",
    emoji: "🕊️",
    fiscalNote: "Reçu fiscal automatique (66 % défisc · art. 200 CGI).",
  },
];

export function getCause(slug: string): DonationCause | undefined {
  return DONATION_CAUSES.find((c) => c.slug === slug);
}

// Barème : 1 token / 0,10 € → 10 tokens par euro
export const DONATION_TOKENS_PER_EURO = 10;
// 1 ticket / 10 € donnés
export const DONATION_TICKETS_PER_TEN_EUROS = 1;

export function computeDonationRewards(amountCents: number): {
  tokens: number;
  tickets: number;
} {
  const euros = Math.max(0, Math.floor(amountCents / 100));
  const tokens = euros * DONATION_TOKENS_PER_EURO;
  const tickets = Math.floor(euros / 10) * DONATION_TICKETS_PER_TEN_EUROS;
  return { tokens, tickets };
}
