import Link from "next/link";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <LegalShell title="Politique de confidentialité" updatedAt="26 avril 2026">
      <h2>1. Responsable du traitement</h2>
      <p>
        SASU PURAMA, 8 Rue de la Chapelle, 25560 Frasne, France. DPO :
        <Link href="mailto:matiss.frasne@gmail.com"> matiss.frasne@gmail.com</Link>.
      </p>

      <h2>2. Données collectées</h2>
      <ul>
        <li>Email, prénom, mot de passe (haché).</li>
        <li>Préférences de routine, sessions de pratique anonymes (durée, type).</li>
        <li>Données de paiement traitées par Stripe — KAÏA ne stocke jamais le numéro de carte.</li>
        <li>Logs techniques anonymisés (Sentry, Vercel Analytics) à des fins de qualité de service.</li>
      </ul>

      <h2>3. Bases légales</h2>
      <p>
        Exécution du contrat (compte utilisateur), consentement explicite (analytics, push), intérêt
        légitime (sécurité du Service). RGPD, ePrivacy, DORA.
      </p>

      <h2>4. Durée de conservation</h2>
      <p>
        Les données du compte sont conservées tant que ton compte est actif. À la suppression, elles
        sont effacées sous 30 jours. Les factures sont archivées 10 ans (obligation comptable).
      </p>

      <h2>5. Tes droits</h2>
      <p>
        Accès, rectification, suppression, portabilité, opposition, limitation. Pour exercer ces
        droits, contacte le DPO. Réponse sous 30 jours.
      </p>

      <h2>6. Cookies</h2>
      <p>
        KAÏA utilise des cookies strictement nécessaires (auth, sécurité) et des cookies analytics
        anonymisés. Tu peux les désactiver dans tes paramètres.
      </p>
    </LegalShell>
  );
}
