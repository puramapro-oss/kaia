import Link from "next/link";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = { title: "Avertissement bien-être & santé" };

export default function DisclaimerPage() {
  return (
    <LegalShell title="Avertissement bien-être & santé" updatedAt="26 avril 2026">
      <h2>KAÏA est une application de bien-être</h2>
      <p>
        KAÏA propose des outils de respiration, méditation, mouvement doux, gratitude et hygiène
        de vie. Elle ne pose aucun diagnostic, ne propose aucun traitement, et ne se substitue
        jamais à un avis médical, psychologique ou paramédical.
      </p>

      <h2>Avant de pratiquer</h2>
      <ul>
        <li>
          Si tu suis un traitement, parle de KAÏA à ton médecin avant d'intégrer une routine
          quotidienne.
        </li>
        <li>
          Les sons binauraux ne doivent pas être utilisés en conduisant, ni en cas d'antécédents
          d'épilepsie.
        </li>
        <li>
          Les exercices physiques sont à pratiquer dans la limite de tes capacités. Stoppe
          immédiatement en cas de douleur.
        </li>
      </ul>

      <h2>En cas de souffrance ou de pensées sombres</h2>
      <p>
        Tu n'es pas seul·e. Parle à un professionnel ou contacte une ligne d'écoute.
      </p>
      <ul>
        <li>3114 — Numéro national de prévention du suicide (24/7, gratuit, France)</li>
        <li>112 — Urgences européennes</li>
        <li>SOS Amitié — 09 72 39 40 50</li>
        <li>
          <Link href="https://findahelpline.com" target="_blank" rel="noreferrer">
            findahelpline.com
          </Link>{" "}
          — annuaire mondial multilingue
        </li>
      </ul>
    </LegalShell>
  );
}
