import type { LegalAppConfig, LegalSection } from '../types';
import { CURRENT_LEGAL_VERSIONS } from '../versions';
import { activeProcessors } from '../processors';

/**
 * Politique de confidentialité générique — couvre le socle technique réel de l'écosystème
 * (CLAUDE.md §5/§11). Les sous-traitants listés sont détectés dynamiquement (`activeProcessors`)
 * à partir des env vars réellement définies pour CETTE app — jamais un sous-traitant non utilisé,
 * même si le reste de l'écosystème s'en sert (principe de minimisation RGPD).
 */
export function buildPolitiqueConfidentialite(
  config: LegalAppConfig,
  env: Record<string, string | undefined> = {},
  sousTraitantsSupplementaires: LegalSection['paragraphes'] = []
): LegalSection[] {
  const { company: c } = config;
  const processorLines = activeProcessors(env).map((p) => `${p.role} : ${p.nom} (${p.paysHebergement}).`);
  const estSanteBienEtre = config.famille === 'sante_bienetre';

  return [
    {
      titre: 'Responsable du traitement',
      paragraphes: [
        `${c.nom} (${c.forme_juridique}), ${c.adresse}, ${c.code_postal} ${c.commune}, ${c.pays}, est responsable du traitement des données personnelles collectées sur ${config.domaine}.`,
        `Contact : ${c.emailContact}`,
      ],
    },
    {
      titre: 'Données collectées',
      paragraphes: ['Selon votre usage du service, nous traitons :'],
      liste: [
        'Données de compte : email, nom, mot de passe (chiffré), photo de profil optionnelle.',
        "Données d'usage : préférences, statistiques de connexion.",
        config.aChatIA ? "Historique de conversation avec l'assistant IA, nécessaire au fonctionnement de la conversation." : '',
        config.aPaiement ? 'Données de paiement : gérées exclusivement par Stripe, jamais stockées sur nos serveurs.' : '',
        'Données techniques : adresse IP, journal de connexion, à des fins de sécurité et de lutte contre la fraude.',
      ].filter(Boolean),
    },
    ...(estSanteBienEtre
      ? [
          {
            titre: 'Données de santé — consentement renforcé (art. 9 RGPD)',
            paragraphes: [
              "Certaines informations que vous renseignez dans l'application (dates et symptômes de cycle, notes de bien-être, réponses aux questionnaires de routine) constituent des données concernant la santé au sens de l'article 9 du RGPD, catégorie particulière de données bénéficiant d'une protection renforcée.",
              "Le traitement de ces données repose exclusivement sur votre consentement explicite (art. 9.2.a RGPD), recueilli lors de la saisie de ces informations. Ce consentement est révocable à tout moment depuis la page « Ma mémoire » (export ou suppression immédiate des données concernées).",
              "Ces données de santé ne sont jamais utilisées à des fins publicitaires, jamais cédées ni vendues à des tiers, et jamais partagées avec des annonceurs ou des courtiers de données. Elles ne servent qu'à personnaliser vos routines et votre suivi de cycle au sein de KAÏA.",
              "Elles sont chiffrées (AES-256) au repos et déchiffrées uniquement à la demande, pour votre seul accès (cf « Ma mémoire », export RGPD).",
            ],
          } as LegalSection,
        ]
      : []),
    {
      titre: 'Finalités et bases légales',
      paragraphes: ['Chaque traitement repose sur une base légale précise :'],
      liste: [
        'Exécution du contrat : fourniture du service, gestion du compte' + (config.aPaiement ? ', facturation' : '') + ' (art. 6.1.b RGPD).',
        'Intérêt légitime : sécurité, prévention de la fraude, amélioration du service (art. 6.1.f RGPD).',
        "Consentement : cookies de mesure d'audience et de marketing (art. 6.1.a RGPD) — révocable à tout moment.",
        config.aPaiement ? 'Obligation légale : conservation des factures et données comptables (art. 6.1.c RGPD).' : '',
      ].filter(Boolean),
    },
    {
      titre: 'Destinataires et sous-traitants',
      paragraphes: [
        'Vos données sont traitées par nos soins et par les sous-traitants suivants, chacun lié par un accord de traitement des données (DPA) :',
      ],
      liste: [...processorLines, ...sousTraitantsSupplementaires],
    },
    {
      titre: 'Durées de conservation',
      paragraphes: [
        "Les données de compte sont conservées tant que le compte est actif. En cas de suppression de compte, l'effacement intervient conformément au délai indiqué page « Ma mémoire »" +
          (config.aPaiement
            ? ', sous réserve des obligations légales de conservation qui priment temporairement (documents comptables : 10 ans ; données de facturation : 10 ans à compter de la clôture de l\'exercice).'
            : '.'),
      ],
    },
    {
      titre: 'Vos droits',
      paragraphes: [
        "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de vos données.",
      ],
      liste: [
        'Voir et exporter vos données : page « Ma mémoire » de votre compte.',
        'Supprimer votre compte : page « Ma mémoire » de votre compte.',
        `Toute autre demande : ${c.emailContact}`,
        'Réclamation : vous pouvez saisir la CNIL (www.cnil.fr) si vous estimez que vos droits ne sont pas respectés.',
      ],
    },
    {
      titre: 'Cookies',
      paragraphes: [
        "Nous utilisons des cookies strictement nécessaires (authentification, session) déposés sans consentement préalable, et des cookies de mesure d'audience/marketing déposés uniquement après votre consentement explicite, recueilli via le bandeau de consentement. Vous pouvez modifier vos préférences à tout moment.",
      ],
    },
    {
      titre: 'Sécurité',
      paragraphes: [
        "Les données sont protégées par chiffrement en transit (TLS) et au repos, un contrôle d'accès par ligne (Row Level Security) isolant les données de chaque utilisateur, et des sauvegardes régulières.",
      ],
    },
    {
      titre: 'Modification de la politique',
      paragraphes: [
        `Version actuelle : ${CURRENT_LEGAL_VERSIONS.confidentialite}. Toute modification substantielle vous est signalée avant son application.`,
      ],
    },
  ];
}
