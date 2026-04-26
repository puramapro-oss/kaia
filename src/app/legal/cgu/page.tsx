import Link from "next/link";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = { title: "Conditions générales d'utilisation" };

export default function CGUPage() {
  return (
    <LegalShell title="Conditions générales d'utilisation" updatedAt="26 avril 2026">
      <h2>1. Éditeur</h2>
      <p>
        L'application KAÏA (ci-après « le Service ») est éditée par SASU PURAMA, capital social
        1 000 €, siège social 8 Rue de la Chapelle, 25560 Frasne, France, immatriculée au RCS de
        Besançon. Représentant légal : Matiss Frasne. TVA non applicable, art. 293 B du CGI.
      </p>

      <h2>2. Objet</h2>
      <p>
        KAÏA est une application de bien-être et d'hygiène de vie qui propose des routines
        multisensorielles courtes (respiration, méditation, mouvement, gratitude). KAÏA ne fournit
        aucun acte médical, aucun diagnostic, aucun traitement.
      </p>

      <h2>3. Compte utilisateur</h2>
      <p>
        L'inscription est gratuite et requiert une adresse email valide. L'utilisateur est seul
        responsable de la confidentialité de ses identifiants et des actions effectuées depuis
        son compte.
      </p>

      <h2>4. Abonnement</h2>
      <p>
        KAÏA Premium s'élève à 14,99 €/mois ou 125,91 €/an. Un essai gratuit de 14 jours est
        offert sans carte bancaire. L'utilisateur peut annuler à tout moment depuis son espace
        ou depuis l'App Store / Google Play. L'abonnement se renouvelle automatiquement sauf
        résiliation avant la date d'échéance.
      </p>
      <p>
        En souscrivant, l'utilisateur reconnaît avoir compris que la prestation numérique
        commence dès le clic et accepte la perte du droit de rétractation pour la période
        consommée (article L. 221-28 3° du Code de la consommation).
      </p>

      <h2>5. Propriété intellectuelle</h2>
      <p>
        Tous les contenus du Service (audio, vidéo, textes, code) sont la propriété de SASU PURAMA
        ou de ses partenaires. Toute reproduction non autorisée est interdite.
      </p>

      <h2>6. Limites de responsabilité</h2>
      <p>
        KAÏA met tout en œuvre pour assurer la disponibilité du Service mais ne saurait être
        tenu responsable des interruptions ponctuelles ou pertes de données indépendantes de sa
        volonté. KAÏA ne se substitue jamais à un avis médical.
      </p>

      <h2>7. Contact</h2>
      <p>
        Pour toute question : <Link href="mailto:contact@purama.dev">contact@purama.dev</Link>
      </p>
    </LegalShell>
  );
}
