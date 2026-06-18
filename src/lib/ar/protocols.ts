/**
 * AR Energy Mirror™ — 10 protocoles "crisis-safe".
 *
 * Source de vérité côté app pour l'affichage (le champ `emoji` n'existe PAS en
 * DB — il est purement client). La table `kaia.ar_protocols` (migration 0006)
 * ne sert qu'à fournir l'`id` référencé par `ar_sessions.protocol_id` (FK),
 * résolu par `slug` dans `api/ar/session`. Les `slug` DOIVENT rester alignés
 * entre cette liste et le seed DB ; le reste (name/description/durée) peut
 * diverger sans casser la FK.
 *
 * Tous les protocoles sont `crisisSafe` : 0 flash, 0 stroboscope, sortie
 * possible à tout moment. AUCUNE promesse médicale.
 */

export type ARTargetType = "soi" | "personne" | "animal" | "collectif";

export interface ARProtocol {
  slug: string;
  name: string;
  description: string;
  crisisSafe: boolean;
  targetTypes: ARTargetType[];
  durationSec: number;
  emoji: string;
}

export const AR_PROTOCOLS: ARProtocol[] = [
  { slug: "calme-interieur", name: "Calme Intérieur", description: "Ancrage dans le moment présent", crisisSafe: true, targetTypes: ["soi"], durationSec: 300, emoji: "🌫️" },
  { slug: "liberer-tension", name: "Libérer la Tension", description: "Relâchement des tensions physiques", crisisSafe: true, targetTypes: ["soi"], durationSec: 420, emoji: "🪷" },
  { slug: "energie-cycle", name: "Énergie Cyclique", description: "Harmonisation avec votre phase", crisisSafe: true, targetTypes: ["soi"], durationSec: 360, emoji: "🌙" },
  { slug: "connexion-nature", name: "Connexion Nature", description: "Se reconnecter à la terre et aux éléments", crisisSafe: true, targetTypes: ["soi", "collectif"], durationSec: 480, emoji: "🌿" },
  { slug: "guerison-coeur", name: "Guérison du Cœur", description: "Compassion et auto-soin émotionnel", crisisSafe: true, targetTypes: ["soi"], durationSec: 600, emoji: "💗" },
  { slug: "lumiere-douce", name: "Lumière Douce", description: "Bain de lumière régénérateur", crisisSafe: true, targetTypes: ["soi", "personne"], durationSec: 300, emoji: "✨" },
  { slug: "bouclier-energie", name: "Bouclier Énergétique", description: "Protection et ressourcement", crisisSafe: true, targetTypes: ["soi"], durationSec: 360, emoji: "🛡️" },
  { slug: "flux-vital", name: "Flux Vital", description: "Rééquilibrage des flux énergétiques", crisisSafe: true, targetTypes: ["soi", "personne"], durationSec: 540, emoji: "🌊" },
  { slug: "animal-guide", name: "Animal Guide", description: "Connexion avec votre animal totem", crisisSafe: true, targetTypes: ["animal"], durationSec: 420, emoji: "🦌" },
  { slug: "cercle-sacre", name: "Cercle Sacré", description: "Intention collective synchronisée", crisisSafe: true, targetTypes: ["collectif"], durationSec: 900, emoji: "⭕" },
];

export function getARProtocol(slug: string): ARProtocol | undefined {
  return AR_PROTOCOLS.find((p) => p.slug === slug);
}

export function protocolsForTarget(target: ARTargetType): ARProtocol[] {
  return AR_PROTOCOLS.filter((p) => p.targetTypes.includes(target));
}
