import LegalPage from "@/lib/legal/components/LegalPage";
import { buildCGV } from "@/lib/legal/content/cgv";
import { CURRENT_LEGAL_VERSIONS } from "@/lib/legal/versions";
import { KAIA_LEGAL_CONFIG } from "@/lib/legal-app-config";

export const metadata = { title: "Conditions générales de vente" };

export default function CGVPage() {
  return (
    <LegalPage
      titre="Conditions générales de vente"
      sections={buildCGV(KAIA_LEGAL_CONFIG)}
      derniereMiseAJour={`Version ${CURRENT_LEGAL_VERSIONS.cgv}`}
    />
  );
}
