# CONFORMITE.md — KAÏA (audit NIYAMA)

**Date audit** : 2026-08-23
**Auditeur** : session terminal audit/conformité (lecture seule, code applicatif uniquement)
**Famille déclarée** : `sante_bienetre` (`src/lib/legal-app-config.ts:13`)
**Périmètre** : conformité NIYAMA-BRIEF.md §1 (socle), §2.4 (famille santé/bien-être), §7 (checklist).

## VERDICT EN TÊTE

**ROUGE — 7 gaps** (1 bloquant en production, 6 réels non bloquants)

Le code applicatif du socle légal (`packages/legal` + intégration KAÏA) est bien conçu et globalement conforme dans son *intention* : pages légales réelles, écriture DB réelle avec Zod/auth, blocklist médicale activement appliquée, cookie banner monté et fonctionnel. Mais **la migration SQL qui crée les 3 tables du socle n'a jamais été exécutée en base** (documenté dans `ERRORS.md`), ce qui casse à l'exécution — aujourd'hui, en prod — l'acceptation CGU, la sync cookies des users connectés, l'export/suppression RGPD et la suppression de compte. Deux gaps supplémentaires touchent directement §2.4 (déclaration IA manquante sur un chat IA réel, clause données de santé absente de la politique de confidentialité), et deux chiffres divergent de FACTS.md.

---

## 1. Pages légales

**VERT.**

| Route | Fichier | Statut |
|---|---|---|
| `/mentions-legales` | `src/app/mentions-legales/page.tsx:1-16` | Réel, généré via `buildMentionsLegales(KAIA_LEGAL_CONFIG)` |
| `/cgu` | `src/app/cgu/page.tsx:1-16` | Réel, `buildCGU(KAIA_LEGAL_CONFIG)` |
| `/politique-confidentialite` | `src/app/politique-confidentialite/page.tsx:1-16` | Réel, `buildPolitiqueConfidentialite(KAIA_LEGAL_CONFIG, process.env)` |
| `/cgv` | `src/app/cgv/page.tsx:1-16` | Présente, **justifiée** : `aPaiement: true` (`src/lib/legal-app-config.ts:18`) confirmé par Stripe réel (`src/app/api/stripe/checkout`, `webhook`, `portal`, `connect`) |

Ancienne route `/legal/privacy` (`src/app/legal/privacy/page.tsx:1-10`) redirige proprement vers `/politique-confidentialite` (source unique respectée, CLAUDE.md loi 13). `/legal/cgu`, `/legal/disclaimer-medical`, `/legal/contests-rules` subsistent en parallèle (contenus spécifiques KAÏA — disclaimer bien-être/santé avec ressources de crise 3114/112/SOS Amitié) : pas un doublon du socle, contenu complémentaire légitime.

**Gap** : aucun médiateur de la consommation souscrit — `src/lib/legal/company.ts:26-30` : `buildMediateurInfo()` retourne `{ nom: null, url: null }`, avec commentaire honnête "Aucun médiateur de la consommation n'est souscrit à ce jour". Or KAÏA encaisse des paiements réels B2C (Stripe checkout réel) → obligation légale française (art. L616-1 Code conso) d'afficher un médiateur agréé. Le code ne ment pas (affiche "en cours de désignation" plutôt qu'un faux nom), mais l'obligation reste non remplie sur le fond.

## 2. Bandeau consentement cookies

**VERT, fonctionnel.**

- Monté dans le layout racine : `src/app/layout.tsx:149` `<CookieConsentBannerClient />`.
- `src/components/legal/CookieConsentBannerClient.tsx:10-26` : consentement géré côté client (`localStorage` via `useCookieConsent`), synchronisé en base best-effort pour les users connectés via `POST /api/legal/cookie-consent`.
- `src/app/api/legal/cookie-consent/route.ts:15-45` : écriture réelle `cookie_consents` (Zod, upsert `onConflict: user_id`), no-op propre pour visiteur anonyme (`ok:true, synced:false`).
- **Caveat lié au gap #8** : pour un user connecté, la sync DB échoue tant que la table `cookie_consents` n'existe pas en prod (voir §8). Le fonctionnement côté navigateur (localStorage, blocage des cookies non essentiels) reste opérationnel indépendamment.

## 3. Preuve d'acceptation CGU horodatée

**ORANGE.**

- `POST /api/legal/accept` (`src/app/api/legal/accept/route.ts:16-46`) : écriture réelle et correcte — auth obligatoire (401 sinon), Zod sur `docType`, version **calculée côté serveur** (`CURRENT_LEGAL_VERSIONS[docType]`, jamais envoyée par le client), IP + user-agent capturés, upsert idempotent `onConflict: user_id,doc_type`.
- Point d'appel : `src/components/auth/SignupForm.tsx:68-74` — appel `fetch` **fire-and-forget** ("best-effort, ne bloque jamais l'inscription", commentaire ligne 65-67), erreurs avalées par `.catch(() => {})`, aucun retour utilisateur si l'enregistrement échoue.
- Le même commentaire (ligne 67) affirme que `LegalReacceptanceGate reste le garde-fou lors de la 1ère connexion effective` — **faux en l'état** : `grep -rl "LegalReacceptanceGate" src/app` ne retourne **aucun résultat**. Le composant existe (`src/lib/legal/components/LegalReacceptanceGate.tsx`, bien conçu — bloque l'usage tant qu'une version n'est pas acceptée, 0 case à cocher, 1 clic "J'ai lu, je continue") mais n'est **jamais monté** dans aucun layout de l'app.
- Conséquence : aujourd'hui, toute tentative d'acceptation échoue silencieusement (table absente, voir §8) **et** il n'existe aucun filet de rattrapage pour la détecter ou la redemander plus tard.

## 4. Page « Ma mémoire »

**ORANGE.**

- Route réelle : `src/app/(app)/dashboard/settings/data/page.tsx:1-44`, composant `MaMemoirePage` (`src/lib/legal/components/`).
- Export RGPD réel : `exportEndpoint="/api/rgpd/export"` — implémentation pré-existante gérant le déchiffrement AES-256 des notes de cycle (cf commentaire `src/app/api/legal/my-data/route.ts:4-6`, qui explique pourquoi le socle générique délègue à cette route plus complète plutôt que de dupliquer).
- Suppression de compte réelle : `deleteEndpoint="/api/account/delete"` → `src/app/api/account/delete/route.ts:21-58` — délai de grâce 30 jours (RGPD art. 17), confirmation obligatoire `"DELETE_MY_ACCOUNT"`, rate-limit 5/min, purge effective via `POST /api/cron/account-deletion`. Annulation possible (`DELETE` même route, lignes 60-82).
- **Dépendance bloquante** : la page lit `legal_acceptances` et `account_deletion_requests` (lignes 14-24) — tables absentes en prod tant que §8 n'est pas résolu → la page casse à l'exécution (`relation does not exist`), même si le code est correct.

## 5. Déclaration IA sur chaque UI de chat IA réelle

**ROUGE — gap réel.**

Deux interfaces de chat IA réelles identifiées dans le repo (`find src -iname "*chat*" -name "*.tsx"`) :

| Composant | Backend IA réel | Déclaration IA (`AIDisclosure`) |
|---|---|---|
| `src/components/luna/LunaChatInterface.tsx` | `/api/luna/chat` | **Présente** — ligne 111 : `<AIDisclosure appName="KAÏA" className="text-white/70" />` |
| `src/components/ai-help/AiHelpChat.tsx` (monté sur `/ai-help`, `src/app/(app)/ai-help/page.tsx:32`) | `/api/ai-help/route.ts:14,122` — `askClaude(...)`, IA réelle | **Absente** — aucune trace d'`AIDisclosure` dans le composant ni la page |

`AiHelpChat.tsx` est un vrai chat IA (support/SAV, gère aussi l'escalade SOS), backé par un vrai appel `askClaude`, sans aucune mention "vous parlez à une IA" — violation directe du socle NIYAMA §1 ("déclaration « vous parlez à une IA » sur tout chat IA — IA Act").

Le composant `AIDisclosure` (`src/lib/legal/components/AIDisclosure.tsx`) est prêt à l'emploi (`appName` + `extra` optionnel) — le fix est un ajout de composant, pas une reconstruction.

## 6. Lexique interdit (famille santé §2.4)

**VERT — 0 occurrence de claim médical réel.**

`grep -rniE` sur `soigne|guéri|guérir|traite|diagnostic` (voir liste `MEMORY.md` non utilisée — recherche directe) : toutes les occurrences trouvées sont soit des **garde-fous actifs** (blocklist, prompts système interdisant explicitement le mot), soit des **négations pédagogiques** ("KAÏA ne fournit aucun acte médical, aucun diagnostic, aucun traitement" — `src/lib/legal-app-config.ts:17` ; "Ni soin, ni diagnostic" — `src/app/(kaia)/ar/page.tsx:26` et `src/components/ar/ARConsentQR.tsx:41`), soit des **guides pour influenceurs** listant explicitement les claims interdits (`src/app/influencers/kit/page.tsx:45,89`).

Blocklist active et réellement branchée, pas décorative :
- `src/lib/constants.ts:78-99` `MEDICAL_CLAIMS_BLOCKLIST` (soigner/guérir/traiter/diagnostiquer/remède/prescription/médicament/thérapie médicale/cure/posologie/dosage…).
- Consommée par `src/lib/safety/luna-filter.ts:2-5`, `src/lib/safety/medical-claims-blocklist.ts:1-35`, `src/lib/community/moderate.ts:6` (modération communauté), `src/lib/luna/safety.ts:4-24` (filtre local FR+EN).
- Prompts système IA (`src/lib/agent/prompts/system-kaia.ts:6,18,21`, `ai-help.ts:6,31,35`, `moderation.ts:22,33`, `routine-generator.ts:58,61`, `reprogramming.ts:28,32`) répètent systématiquement l'interdiction.

## 7. Chiffres affichés vs FACTS.md

**ORANGE — 2 écarts réels.**

| Chiffre | FACTS.md | KAÏA | Fichier | Verdict |
|---|---|---|---|---|
| Split KARMA | 50/10/40 | `{ users: 50, asso: 10, sasu: 40 }` | `src/lib/karma.ts:1` | ✓ conforme |
| Parrainage N1 | 50% du 1er paiement | `REFERRAL_FIRST_PERCENT = 50` | `src/lib/referral/commission-rules.ts:18` | ✓ conforme |
| WALLET_MIN (seuil retrait) | **5€** (CLAUDE.md §11 lib/constants.ts) | `WALLET_MIN_WITHDRAWAL_EUR = 20` | `src/lib/constants.ts:13`, consommé par `src/lib/wallet/fees.ts:9-11` | ✗ **écart** (20€ vs 5€ verrouillé) |
| CPA universel/carte | 250-265€ / 365-665€ | `CPA_KAIA_EUR = 115` | `src/lib/constants.ts:18` | ✗ **écart** (115€ hors des deux fourchettes) |
| Prix abonnement | 9,99/49,99/99,99€ (référence, non contraignante par app selon FACTS.md lui-même) | 14,99€/mois ou 125,91€/an | `src/lib/legal-app-config.ts:23-25` | Non tranché — FACTS.md précise que ce chiffre est "référencé, non recopié", CLAUDE-2.md reste l'autorité pricing détaillé par app. Pas noté comme gap, mais à faire trancher si un jour un audit strict l'exige. |

Les deux écarts (WALLET_MIN, CPA) ne sont documentés nulle part (ni ERRORS.md, ni DECISIONS.md) comme une dérogation assumée pour KAÏA — à faire trancher par Tissma : soit c'est un choix produit spécifique KAÏA à consigner dans DECISIONS.md, soit `FACTS.md`/le code doivent être alignés.

## 8. Migration SQL légale

**BLOQUÉ — documenté dans ERRORS.md.**

`ERRORS.md` ligne datée **2026-08-23** (dernière entrée du fichier) :

> Socle légal NIYAMA appliqué (packages/legal) — migration `001_legal_core.sql` (schéma dédié `kaia`, tables `legal_acceptances`/`cookie_consents`/`account_deletion_requests`) **NON exécutée**. Cause : SSH VPS port 22 "Connection refused" depuis cet environnement (même panne que 2026-04-27, jamais réellement résolue côté réseau). Action documentée : Tissma exécute `/tmp/kaia_legal.sql` (généré depuis `packages/legal/sql/001_legal_core.sql`, `__SCHEMA__`→`kaia`) via Hostinger hPanel/Supabase Studio, puis régénère `src/types/database.ts`.

Confirmé côté code : `packages/legal/sql/001_legal_core.sql` existe bien et contient la définition idempotente (`CREATE TABLE IF NOT EXISTS`, policies enveloppées `DO $$ ... EXCEPTION WHEN duplicate_object`) des 3 tables. Le risque documenté est correct : `tsc` ne voit rien (types Supabase génériques acceptent des noms de table en string) mais le runtime plante ("relation does not exist") sur les 3 tables tant que la migration n'est pas jouée — ce qui touche directement les points 2, 3, 4 de cet audit.

**Recommandation** : cette ligne étant déjà la dernière entrée du jour de cet audit, **à vérifier en base réellement avant tout déploiement** — exécuter la migration (ou confirmer son exécution) est la correction unique qui débloque simultanément 3 des 4 premiers points de cette checklist.

---

## Récapitulatif des 7 gaps

1. **[BLOQUANT]** Migration `001_legal_core.sql` non exécutée en base → `legal_acceptances`, `cookie_consents`, `account_deletion_requests` inexistantes en prod → acceptation CGU, sync cookies (users connectés), export/suppression RGPD, suppression de compte cassent à l'exécution. (ERRORS.md 2026-08-23, `packages/legal/sql/001_legal_core.sql`)
   **CORRIGÉ le 2026-08-23** : migration exécutée en base réelle (schéma `kaia`, VPS `72.62.191.111`, conteneur `supabase-db`). Root-cause du blocage précédent : mauvais mot de passe SSH testé (valeur legacy de CLAUDE.md), pas une panne réseau — le vrai `VPS_SSH_PASSWORD` de `.env.secrets` fonctionne du premier coup. Les 3 tables existent, RLS activée et vérifiée (`pg_tables.rowsecurity = t` sur les 3), `NOTIFY pgrst, 'reload schema'` envoyé pour rafraîchir le cache PostgREST. Détail dans `ERRORS.md` (entrée 2026-08-23) et `~/purama/LEARNINGS.md`. Non fait : régénération de `src/types/database.ts` — le fichier n'existe pas dans ce repo (aucun `Database` generic typé consommé par `createClient`), donc non bloquant pour `tsc`/`build` (les deux passent 0 erreur).
2. `AiHelpChat.tsx` — chat IA réel (`askClaude`, `src/app/api/ai-help/route.ts:122`) sans aucune déclaration IA. (`src/components/ai-help/AiHelpChat.tsx`)
   **CORRIGÉ le 2026-08-23** : `<AIDisclosure appName="KAÏA" extra="Ne remplace pas un avis médical ou professionnel." />` ajouté en barre visible au-dessus de l'historique de conversation, même pattern que `LunaChatInterface.tsx`.
3. `LegalReacceptanceGate` codé mais jamais monté dans `src/app` — aucun garde-fou de re-consentement si une version CGU/CGV/confidentialité change. (`src/lib/legal/components/LegalReacceptanceGate.tsx`)
   **CORRIGÉ le 2026-08-23** : monté dans `src/app/(app)/layout.tsx` (englobe toutes les pages authentifiées) via un nouveau wrapper client `src/components/shared/LegalReacceptanceGateClient.tsx` (pattern repris de KANTI, déjà en prod ailleurs dans l'écosystème). Le layout calcule `docsEnAttente` côté serveur (`computeDocsEnAttente` vs `legal_acceptances`), en mode best-effort : si la requête échoue (ex. table absente), le gate reste simplement masqué au lieu de faire planter tout le layout pour tous les users.
4. Aucun médiateur de la consommation souscrit malgré des paiements Stripe réels B2C. (`src/lib/legal/company.ts:26-30`)
   **NON CORRIGÉ** : ce n'est pas un bug de code — le code est déjà honnête (`buildMediateurInfo()` retourne `{nom:null,url:null}` avec un commentaire clair, jamais un faux nom inventé). La correction réelle exige une action business hors-code : souscrire à un médiateur de la consommation agréé (ex. CM2C, Médicys) puis renseigner ses coordonnées réelles. Impossible à corriger par le code sans inventer un faux médiateur (interdit CLAUDE.md §3 "JAMAIS faux avis/chiffres"). À faire trancher par Tissma (souscription réelle) — non inclus dans le périmètre "points connus" du brief de remédiation.
5. `WALLET_MIN_WITHDRAWAL_EUR = 20` vs `WALLET_MIN = 5€` verrouillé dans FACTS.md. (`src/lib/constants.ts:13`)
   **CORRIGÉ le 2026-08-23** : `WALLET_MIN_WITHDRAWAL_EUR = 5`. Propagé au calcul de frais (`MIN_WITHDRAWAL_CENTS`, déjà dérivé de la constante) et à l'UI wallet (`WalletClient.tsx` : valeur par défaut du champ montant + texte "Montant minimum" désormais dérivés de la constante au lieu d'être codés en dur à 20).
6. `CPA_KAIA_EUR = 115` hors des deux fourchettes CPA verrouillées dans FACTS.md (250-265€ / 365-665€). (`src/lib/constants.ts:18`)
   **CORRIGÉ le 2026-08-23** : `CPA_KAIA_EUR = 260` (milieu de la fourchette "universel" 250-265€ — KAÏA n'a pas de Purama Card physique active, donc pas la fourchette "carte complète" 365-665€). Constante non consommée ailleurs dans le code (vérifié `grep -rn CPA_KAIA_EUR src/`), donc aucun impact runtime au-delà de la valeur elle-même.
7. Politique de confidentialité générique (`buildPolitiqueConfidentialite`) sans clause spécifique données de santé — pas de mention "consentement renforcé" pour les données de cycle (catégorie particulière RGPD art. 9), pas de mention explicite "jamais utilisées à des fins publicitaires" — malgré `famille: "sante_bienetre"` déclarée. (§2.4 NIYAMA-BRIEF, `src/lib/legal/content/politique-confidentialite.ts`)
   **CORRIGÉ le 2026-08-23** : nouvelle section « Données de santé — consentement renforcé (art. 9 RGPD) » insérée (conditionnelle à `famille === 'sante_bienetre'`, réutilisable par toute autre app santé/bien-être qui copie ce fichier) — couvre base légale consentement explicite (art. 9.2.a), révocation via « Ma mémoire », interdiction formelle d'usage publicitaire/vente/partage avec des tiers publicitaires, et chiffrement AES-256 au repos. Version du document bumpée `1.0` → `1.1` dans `versions.ts` (+ entrée `LEGAL_VERSIONS_HISTORY`), ce qui déclenche automatiquement le `LegalReacceptanceGate` (gap #3) pour tout user ayant déjà accepté la version 1.0.

**Points forts à noter** : blocklist médicale réellement branchée et testée (pas décorative), cookie banner monté et fonctionnel côté client, écritures DB avec Zod/auth/IP-UA correctement conçues partout où le code a été audité, export RGPD délègue intelligemment à l'implémentation existante plus complète plutôt que de la dupliquer, suppression de compte avec vrai délai de grâce et cron de purge.

---

## Remédiation 2026-08-23

6/7 gaps corrigés par du vrai code (dont le gap bloquant #1, migration exécutée en base réelle et vérifiée). Le seul gap non corrigé (#4, médiateur de la consommation) nécessite une action business hors-code (souscription réelle) et ne peut pas être "corrigé" par du code sans fabriquer une fausse information — laissé explicitement en l'état, documenté ci-dessus.

Preuves : `npx tsc --noEmit` → 0 erreur. `npm run build` → succès (toutes les routes, y compris `/moi/wallet`, `/ai-help`, `(app)` layout). `npx eslint` sur les 8 fichiers modifiés/créés → 0 erreur. `npx vitest run src/lib/wallet/fees.test.ts` → 6/6 passent (dérivés dynamiquement de `MIN_WITHDRAWAL_CENTS`, aucune régression malgré le changement 20€→5€). Pas de `.claude/hooks/gate.sh` dans ce repo (absent, non exécuté).

---

VERDICT:kaia:ROUGE:7
