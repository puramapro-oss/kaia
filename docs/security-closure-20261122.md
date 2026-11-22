# KAIA — qualification du candidat sécurité du 22 novembre 2026

Statut : **PARTIEL — candidat local à qualifier par la CI du commit publié**.
Base : `234c79d8f2152b955db02618cb45bdf3150813cc`.
Branche proposée : `fix/kaia-dependency-security-20261122` ; son déploiement Vercel automatique est désactivé.

## Corrections

- Next et eslint-config-next 16.4.6 ; Capacitor 7.6.10 ; Zod 4.6.7 ; Vitest 4.1.12 ; MapLibre 6.19.0 ; LHCI 0.16.1. Les corrections transitives conservant les plages compatibles sont verrouillées, dont xmldom 0.9.12, brace-expansion 1.1.22/5.0.13, js-yaml 4.3.2, DOMPurify 3.4.18, fflate 0.4.9/0.6.11, moment 2.31.0 et qs 6.17.1.
- Les déclarations racine et les entrées verrouillées du SDK privé et du paquet ESLint partagé sont préservées exactement. La résolution publique a utilisé temporairement les seules métadonnées déjà présentes dans le verrou. Le verrou composé doit encore réussir le vrai `npm ci` de la CI, puis les lifecycle scripts sans authentification de dépôt.
- Suppression des dépendances applicatives inutilisées `@sentry/nextjs` et `@hookform/resolvers`, après recherche des imports et usages. Lighthouse conserve ses propres dépendances Sentry. Les descriptions légales des prestataires n'ont pas été réécrites.
- Zod 4 nécessite une clé explicite dans les deux `z.record` de métadonnées. Les routes de gains et dépenses conservent leurs règles métier ; 19 tests appellent leurs vrais handlers, avec seulement les frontières d'authentification et de stockage simulées.
- Vitest 4 est la branche corrigée choisie ; le paramètre `--minWorkers` retiré en v4 a été supprimé du workflow. Aucune assertion existante n'a été retirée.
- L'avis MapLibre concerne toutes les versions jusqu'à 6.4.0. Le passage à 6 utilise l'export ESM en espace de noms, un worker de version exacte copié depuis le paquet verrouillé et servi depuis la même origine. Les deux composants conservent leur interface et affichent un message si WebGL2 est indisponible. Les coordonnées hors plage des marqueurs sont rejetées.
- OpenTimestamps utilise les primitives officielles 0.4.9 et le transport borné déjà qualifié sur JURIS. Les reçus sont liés au véritable SHA-256 du document ; un reçu en attente ou absent ne certifie pas un ancrage Bitcoin. Les signatures de concours sont estampillées comme des condensats, sans deuxième hachage.

## Preuves disponibles

| Vérification | Résultat local | Limite |
| --- | --- | --- |
| Tests existants et nouveaux Vitest | **PASS : 51 fichiers, 403 tests** | Installation locale partielle ; Next 16.4.6 réutilisé en lecture, bcryptjs 3.0.3 vérifié contre l'intégrité du verrou |
| Admission privée et projection publique | **PASS : 42 tests** | Tests hors ligne, aucun secret réel |
| Reçus OTS et transport | **PASS : 38 tests** | Vrai module, vrais primitives et 5 reçus officiels ; HTTP simulé |
| Reproduction historique OTS | **PASS : 3 défauts reproduits** | Vrai wrapper historique, vérification externe simulée : reçu absent, en attente, ou d'un autre document accepté |
| Cartes et repli | **PASS : 4 tests des composants** | API MapLibre simulée dans ces unitaires |
| Bundle des deux cartes réelles et worker 6.19.0 | **PASS** | Fixture Vite compilée, n'est pas le build Next complet |
| Tests Chromium de la fixture | **NON TESTÉ localement** ; 2 tests listés | Exécution prévue en CI ; environnement local refuse les sockets Chromium, aucun contournement |
| Lint du lot sécurité avant complément concours | **PASS : 0 erreur**, 1 avertissement préexistant | Configuration partagée réelle ; ESLint local 9.39.5, verrou 9.39.4 ; CI exacte requise |
| TypeScript / build Next complets | **BLOQUÉ localement** | Vérification TypeScript interrompue avec code 137 ; pas de réussite extrapolée |
| Installation complète du verrou composé | **NON TESTÉ** | Installation locale interrompue 137 ; pas de répétition lourde ; CI exacte obligatoire |

## Audit : portée et confidentialité

L'envoi du graphe original a été refusé par la revue automatique, car il contenait des métadonnées de dépendances privées. Cet audit intégral reste **BLOQUÉ** ; il n'a pas été relancé par un autre outil ou la CI.

Une variante distincte, relue, ne conserve que des identités publiques de paquets : nom, version exacte et URL canonique de tarball `registry.npmjs.org`. Son manifeste est neutre ; les chemins originaux, arêtes du graphe, scripts, intégrités, métadonnées et noms privés sont supprimés. Onze tests vérifient cette purge. Les versions sont représentées par des alias neutres. Le témoin positif retrouve les neuf paquets critiques initiaux : les alias ne masquent donc pas ces avis.

| Portée comparable | Critiques | Hautes | Modérées | Basses |
| --- | ---: | ---: | ---: | ---: |
| Ensemble public plat initial, 1 310 versions | 9 | 16 | 18 | 2 |
| Ensemble public plat corrigé, 1 204 versions | 0 | 0 | 4 | 2 |
| Annexe de 5 versions publiques WASM, provenance confirmée sur le registre | 0 | 0 | 0 | 0 |

Le relevé historique du graphe complet comptait 9 critiques, 26 hautes, 47 modérées et 5 basses. Ses alertes propagées dans les dépendants ne sont pas directement comparables aux compteurs plats ci-dessus.

Neuf entrées du verrou sont exclues de la projection principale : les trois entrées du SDK privé/paquet partagé et six paquets embarqués sans URL propre. `tslib` 2.8.1 est déjà couvert ; les cinq autres identités ont été confirmées séparément sur le registre puis auditées dans un autre dossier neutre : `@emnapi/core` 1.8.1, `@emnapi/runtime` 1.8.1, `@emnapi/wasi-threads` 1.1.0, `@napi-rs/wasm-runtime` 1.1.1 et `@tybys/wasm-util` 0.10.1. Aucun avis n'y est retourné.

Les six avis publics restants concernent `glob` et `minimatch` dans l'outillage, `request`/son ancien `uuid` dans les dépendances déclarées d'OpenTimestamps, `elliptic`, et le serveur de développement Windows d'esbuild utilisé transitivement par tsx. Ils sont conservés explicitement : pas de remplacement majeur arbitraire des API de glob/minimatch/uuid pour améliorer le compteur. Le test OTS vérifie que son transport historique `request` n'est pas chargé ; cela ne constitue pas un audit complet de toutes les dépendances.

Le nouveau contrôle CI porte exclusivement sur cette projection publique et utilise des configurations npm vides et un environnement réduit avant toute authentification privée. Il ne remplace pas un audit du code privé et ne prétend pas couvrir les dépendances embarquées omises dans sa projection automatique.

## Gates de publication et limites

La publication et la revue appartiennent au responsable du portefeuille. Après publication, la CI du commit exact doit prouver : installation immuable du verrou, absence d'authentification avant lifecycle, 403 tests applicatifs, tests OTS, deux tests Chromium avec le vrai worker, types complets, lint complet sans hausse du seuil et build Next avec seules valeurs synthétiques.

Aucun déploiement, changement de base réelle, paiement, appel réel d'horodatage ou de prestataire n'a été effectué. Le code natif iOS/Android, les flux de paiement et le fonctionnement global du produit ne sont pas qualifiés par ces vérifications. La fermeture des erreurs de concours ci-dessous ne constitue pas une validation financière complète.

## Fermeture séparée des erreurs de concours

Les 32 nouveaux tests appellent le vrai `runContestDraw` et les quatre vrais handlers HTTP (tirage manuel et trois cadences), avec seulement les frontières de base, d'authentification et d'horodatage simulées. **Avant correction : 26 échecs / 6 réussites ; après : 32 réussites.** Deux régressions supplémentaires reproduisent ensuite un résultat de participations null et une écriture du seed sans ligne confirmée. Elles passent après correction ; le cas de mauvais identifiant est également rejeté. Le complément final comporte 34 tests, et la suite complète finale passe à 403 tests dans 51 fichiers. Le contrôle de données conserve le tableau vide valide, exige un tableau pour les participations et exige le RETURNING de l’identifiant exact avant tout crédit.

- Une lecture des participations en erreur ne produit plus un tirage vide ; les erreurs de lecture du concours et des listes planifiées restent des erreurs.
- Un RPC d'enregistrement ambigu n'est jamais remplacé par un UPDATE direct. Le résultat `applied=false` est respecté : une requête perdant la course ne crédite pas ses propres gagnants.
- La réussite nécessite l'accusé SQL attendu, sur une seule ligne. Les erreurs d'écriture du seed et les réponses en échec ou ambiguës du crédit ne produisent plus un succès. Le résultat explicite `idempotent_replay` reste accepté.
- Après un enregistrement potentiellement acquis, l'échec est marqué `reconciliationRequired: true` ; aucun rejeu automatique de paiement n'est ajouté. Les routes rendent 503 sur ces pannes ; le conflit confirmé `already_drawn` conserve son comportement normal.
- Les cadences s'arrêtent sur erreur et ne créent pas silencieusement la période suivante. Les périodes futures devront donc être réconciliées si un ancien tirage reste en échec.

**Dépendance métier restante, identifiée dans le schéma :** `kaia.record_contest_winners` (migration `0004_p7_gamification.sql`) termine le concours dans une transaction séparée des crédits. `kaia.apply_token_event` (migration `0001_init_kaia.sql`) applique par défaut un plafond quotidien de 200, alors que les lots définis dans `ensure-period-contest.ts` comprennent des montants de 250 à 30 000. Une réponse `daily_cap_reached` est maintenant visible comme un échec ; la règle n'est pas modifiée. Les gagnants déjà enregistrés et les événements de crédit doivent être rapprochés avant toute reprise d'un cas partiel. Aucun schéma, plafond, montant, sélection de gagnants ou mode de versement n'a été changé, et l'atomicité entre enregistrement et crédits n'est pas prétendue.

Le lint ciblé des 31 fichiers sécurité avait réussi. Pour ce delta concours, l'outil ESLint partagé local a disparu lors de la restauration concurrente de ses dépendances ; pas de réinstallation lourde. Son lint et ses types complets restent à qualifier par la CI exacte, sans diminution des contrôles.

## Sources primaires

- [Avis MapLibre GHSA-jrc7-96c5-q579](https://github.com/advisories/GHSA-jrc7-96c5-q579).
- [Migration officielle MapLibre 5 vers 6](https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/).
- [Migration officielle Vitest 4](https://v4.vitest.dev/guide/migration.html).
- [Migration officielle Zod 4](https://zod.dev/v4/changelog).
- Métadonnées et avis du registre npm obtenus uniquement pour les identités publiques décrites ci-dessus ; les preuves JSON, commandes et limites sont conservées dans le dossier de qualification du candidat.
