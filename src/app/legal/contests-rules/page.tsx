import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = { title: "Règlement officiel des concours et tirages" };

export default function ContestsRulesPage() {
  return (
    <LegalShell title="Règlement officiel des concours et tirages" updatedAt="26 avril 2026">
      <h2>Article 1 — Organisateur</h2>
      <p>
        SASU PURAMA, 8 Rue de la Chapelle, 25560 Frasne, organise des jeux-concours et tirages au
        sort gratuits sans obligation d'achat dans le cadre de l'application KAÏA.
      </p>

      <h2>Article 2 — Participants</h2>
      <p>
        Ouvert à toute personne majeure résidant en France ou dans l'Union européenne, titulaire
        d'un compte KAÏA. Les salariés de SASU PURAMA et leurs familles ne peuvent participer.
      </p>

      <h2>Article 3 — Modalités d'attribution des tickets (gratuites)</h2>
      <ul>
        <li>+1 ticket par routine quotidienne complétée</li>
        <li>+1 ticket par parrainage validé</li>
        <li>+2 tickets par mission éthique terminée</li>
        <li>+1 ticket lors d'une participation à un rituel hebdomadaire</li>
        <li>+1 ticket par streak de 7 jours consécutifs</li>
      </ul>
      <p>
        Aucune participation n'est conditionnée à un abonnement payant.
      </p>

      <h2>Article 4 — Tirages</h2>
      <p>
        Les tirages sont effectués automatiquement par un script signé cryptographiquement
        (OpenTimestamps · blockchain Bitcoin) garantissant l'intégrité du résultat. Cadence :
        hebdomadaire (dimanche 20:00 UTC), mensuelle (1er du mois 12:00 UTC), annuelle
        (31/12 23:30 UTC).
      </p>

      <h2>Article 5 — Dotations</h2>
      <p>
        10 gagnants par tirage, montants définis selon la cagnotte mutualisée. Aucune contrepartie
        en numéraire n'est garantie : la dotation peut prendre la forme de tokens internes,
        crédits d'abonnement ou dotations partenaires éthiques.
      </p>

      <h2>Article 6 — Remise des dotations</h2>
      <p>
        Les gagnants sont contactés par email sous 7 jours. Sans réponse sous 30 jours, la dotation
        est remise en jeu lors du tirage suivant.
      </p>

      <h2>Article 7 — Dépôt et consultation</h2>
      <p>
        Le présent règlement est consultable à tout moment depuis cette page. Il est réputé
        accepté par toute personne participant à un concours.
      </p>

      <h2>Article 8 — Litiges</h2>
      <p>
        Tout litige sera porté devant les tribunaux compétents de Besançon, France.
      </p>
    </LegalShell>
  );
}
