import LegalPage from "@/lib/legal/components/LegalPage";
import { buildMentionsLegales } from "@/lib/legal/content/mentions-legales";
import { CURRENT_LEGAL_VERSIONS } from "@/lib/legal/versions";
import { KAIA_LEGAL_CONFIG } from "@/lib/legal-app-config";

export const metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      titre="Mentions légales"
      sections={buildMentionsLegales(KAIA_LEGAL_CONFIG)}
      derniereMiseAJour={`Version ${CURRENT_LEGAL_VERSIONS.mentions}`}
    />
  );
}
