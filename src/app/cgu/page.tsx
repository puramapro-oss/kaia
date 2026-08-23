import LegalPage from "@/lib/legal/components/LegalPage";
import { buildCGU } from "@/lib/legal/content/cgu";
import { CURRENT_LEGAL_VERSIONS } from "@/lib/legal/versions";
import { KAIA_LEGAL_CONFIG } from "@/lib/legal-app-config";

export const metadata = { title: "Conditions générales d'utilisation" };

export default function CGUPage() {
  return (
    <LegalPage
      titre="Conditions générales d'utilisation"
      sections={buildCGU(KAIA_LEGAL_CONFIG)}
      derniereMiseAJour={`Version ${CURRENT_LEGAL_VERSIONS.cgu}`}
    />
  );
}
