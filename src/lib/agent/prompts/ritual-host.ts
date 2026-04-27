/**
 * KAÏA — Génération du rituel collectif hebdomadaire (BRIEF §5.8).
 * Modèle : `claude-opus-4-7` pour la qualité narrative (1× / sem → coût absorbable).
 *
 * Output JSON strict. La page rituel lit ces champs directement.
 */

export type RitualTheme =
  | "depollution"
  | "peace"
  | "love"
  | "forgiveness"
  | "gratitude"
  | "abundance";

export const RITUAL_THEMES: RitualTheme[] = [
  "depollution",
  "peace",
  "love",
  "forgiveness",
  "gratitude",
  "abundance",
];

const THEME_LABEL_FR: Record<RitualTheme, string> = {
  depollution: "Dépollution intérieure",
  peace: "Paix",
  love: "Amour bienveillant",
  forgiveness: "Pardon",
  gratitude: "Gratitude",
  abundance: "Abondance",
};

const THEME_INTENT: Record<RitualTheme, string> = {
  depollution:
    "relâcher ce qui pèse intérieurement (tensions, ressentiments, jugements), pour retrouver de la clarté",
  peace:
    "déposer les armes intérieures, accueillir un état de paix relative au-delà des circonstances",
  love:
    "cultiver une bienveillance active envers soi, ses proches, et un cercle élargi (étrangers, monde)",
  forgiveness:
    "alléger les liens douloureux du passé en pardonnant — à soi, à un autre, ou aux circonstances — sans nier ce qui a eu lieu",
  gratitude:
    "remarquer 3 choses qui fonctionnent dans la vie courante (corps, relations, instant)",
  abundance:
    "déconstruire la sensation de manque en s'ouvrant à ce qui est déjà là, et oser nommer ce qu'on désire",
};

export const RITUAL_HOST_SYSTEM = `Tu es l'animateur·trice du rituel collectif hebdomadaire de KAÏA.
Ton rôle : composer un guidage écrit chaleureux, sobre, accessible aux sceptiques, jamais mièvre.

## CONTRAINTES STRICTES
1. Pas de jargon spirituel exclusif (pas de "vibrations supérieures", "haute fréquence", "Univers entend").
2. Pas de promesse miracle. Pas de claim médical. Pas de "transforme ta vie".
3. Tutoiement chaleureux. Phrases courtes (12-18 mots).
4. Inclusif : athées, chrétiens, musulmans, bouddhistes, agnostiques, sceptiques.
5. Durée totale lue à voix haute : 3 à 5 minutes (pas plus).
6. Inviter sans contraindre. "Tu peux", "si ça te parle", "à ton rythme".

## STRUCTURE OUTPUT (JSON STRICT — aucun markdown)
{
  "intro_short": "Une phrase d'accueil chaleureuse (12-18 mots).",
  "intent_one_line": "Une phrase qui dit l'intention du rituel.",
  "breathing": {
    "pattern_label": "ex: 4-4-6 (inspire-pause-expire)",
    "cycles": 3
  },
  "guidance_steps": [
    "Étape 1 : posture, ancrage corps. 1-2 phrases.",
    "Étape 2 : connexion au thème. 2-3 phrases.",
    "Étape 3 : visualisation/contemplation centrale. 3-5 phrases.",
    "Étape 4 : ouverture (envoyer une intention au monde, à soi, à un proche). 2-3 phrases.",
    "Étape 5 : retour au corps. 1-2 phrases."
  ],
  "closing_phrase": "Une phrase finale courte qui clôt le rituel (10-15 mots).",
  "audio_script_fr": "Texte intégral à lire (3-5 minutes lu à 130 mots/min) — entre 380 et 700 mots. Inclut les pauses (...). Lecture continue, sans listes."
}
`.trim();

export const RITUAL_HOST_JSON_SHAPE = `{
  "intro_short": string,
  "intent_one_line": string,
  "breathing": { "pattern_label": string, "cycles": number },
  "guidance_steps": string[],
  "closing_phrase": string,
  "audio_script_fr": string
}`;

export interface RitualGuidance {
  intro_short: string;
  intent_one_line: string;
  breathing: { pattern_label: string; cycles: number };
  guidance_steps: string[];
  closing_phrase: string;
  audio_script_fr: string;
}

export function buildRitualUserMessage(theme: RitualTheme, isoWeek: string): string {
  return [
    `Rituel collectif KAÏA — semaine ${isoWeek}`,
    `Thème : ${THEME_LABEL_FR[theme]}`,
    `Intention : ${THEME_INTENT[theme]}.`,
    "",
    "Compose le rituel selon le format JSON imposé.",
    "Le ton est chaleureux, sobre, jamais mièvre, accessible à toute personne.",
  ].join("\n");
}

export function getThemeLabelFr(theme: RitualTheme): string {
  return THEME_LABEL_FR[theme];
}
