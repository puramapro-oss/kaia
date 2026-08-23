import { redirect } from "next/navigation";

/**
 * Ancienne route, contenu remplacé par le socle légal générique NIYAMA
 * (source unique désormais : /politique-confidentialite, cf CLAUDE.md §13 loi 13).
 * Redirection conservée pour les liens externes/indexés déjà en circulation.
 */
export default function LegacyPrivacyPage() {
  redirect("/politique-confidentialite");
}
