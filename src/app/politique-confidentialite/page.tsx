import LegalPage from "@/lib/legal/components/LegalPage";
import { buildPolitiqueConfidentialite } from "@/lib/legal/content/politique-confidentialite";
import { CURRENT_LEGAL_VERSIONS } from "@/lib/legal/versions";
import { KAIA_LEGAL_CONFIG } from "@/lib/legal-app-config";

export const metadata = { title: "Politique de confidentialité" };

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPage
      titre="Politique de confidentialité"
      sections={buildPolitiqueConfidentialite(KAIA_LEGAL_CONFIG, process.env)}
      derniereMiseAJour={`Version ${CURRENT_LEGAL_VERSIONS.confidentialite}`}
    />
  );
}
