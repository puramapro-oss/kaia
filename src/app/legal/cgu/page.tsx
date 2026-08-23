import { redirect } from "next/navigation";

/**
 * Ancienne route, contenu remplacé par le socle légal générique NIYAMA
 * (source unique désormais : /cgu, cf CLAUDE.md §13 loi 13 "1 source vérité").
 * Redirection conservée pour les liens externes/indexés déjà en circulation.
 */
export default function LegacyCGUPage() {
  redirect("/cgu");
}
