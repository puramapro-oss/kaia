# KAÏA — autorisation des tâches et intégrité des résultats

Base vérifiée : `d8aca51b38e47695d495bf88ad8ae033b8828307`.

## Corrections

Le secret des tâches planifiées est désormais obligatoire, y compris en développement. L'en-tête `Host` ne prouve pas qu'une requête vient du poste local. Le helper existant `cron-auth` porte cette politique ; le point d'entrée historique des concours et les routes d'agrégation/rituel le réutilisent. Les appels avec secret Bearer exact ou secret manuel existant restent acceptés. Pour les appels locaux, configurer également `CRON_SECRET` et le présenter.

L'agrégation conserve le résultat précédent si l'une de ses trois lectures échoue ou ne fournit pas de résultat. Des listes réellement vides et un compteur explicitement nul restent des résultats valides. La route ne présente plus une erreur des routines/sessions comme zéro utilisateur ou zéro routine.

Le rituel hebdomadaire refuse la génération quand sa lecture préalable ne permet pas de savoir si le rituel existe. Une erreur accompagnée de données n'est pas transformée en succès. Une absence confirmée sans erreur conserve le parcours de création.

## Vérification exécutée

- Tests initiaux sur code original : 48 cas, 22 réussis, 26 échecs reproduisant les défauts.
- Après les corrections d'autorisation/agrégation : 48/48 réussis.
- Trois cas ajoutés au rituel : 51 cas, 49 réussis et deux échecs avant son garde de lecture.
- Première révision corrigée : **51/51 réussis**, aucun échec ni test ignoré.
- TypeScript strict ciblé sur le helper, l'alias concours, l'agrégation et ses tests : PASS.
- `git diff --check` : PASS. Le seul changement de `vercel.json` est la désactivation du déploiement automatique de la branche de correction.

Les vrais handlers et les vraies classes NextRequest/NextResponse s'exécutent. Les frontières Supabase et génération IA sont remplacées par des réponses déterministes. Aucun appel à une base réelle, génération payante, envoi de message ou paiement n'a lieu. Les rapports JSON et les empreintes figurent dans `verification.json`.

Commande depuis le dépôt :

```sh
npm test -- src/lib/cron-auth.test.ts src/app/api/cron/daily-impact-aggregate/route.test.ts src/app/api/cron/weekly-ritual/route.auth.test.ts src/app/api/cron/weekly-newsletter/route.test.ts --maxWorkers=1 --minWorkers=1
```

Le banc local utilise un sous-ensemble isolé des dépendances, avec Next 16.2.11, Vitest 2.1.9 et TypeScript 5.9.3 tels que verrouillés. Ce n'est pas une installation complète du projet. L'avertissement de dépréciation de l'API CJS de Vite a été conservé dans les logs ; il n'a pas empêché les tests.

## Complément — sources de la newsletter

Le schéma SQL versionné ne contient pas `global_impact.total_practices_completed`. La newsletter sélectionnait ce champ inutilisé et ignorait ensuite l'erreur, ce qui pouvait présenter les utilisateurs actifs et les arbres comme zéro. Le banc vérifie les colonnes sélectionnées contre la définition SQL présente dans le dépôt ; il ne prétend pas interroger une base réelle.

La sélection ne demande désormais que les deux champs consommés. Les statistiques, l'historique de campagne, les abonnements et les profils sont vérifiés avant la création du client de courrier et avant le premier envoi. Une erreur, un résultat absent ou un compteur invalide produit une réponse 503 sans tentative d'envoi. La lecture des profils est groupée avant la boucle afin de ne pas découvrir une panne après un premier destinataire. Des listes réellement vides, des compteurs zéro et des profils absents confirmés conservent leurs cas normaux.

- Avant ce complément : **8/22 PASS et 14 FAIL** sur les nouveaux cas.
- Après : **73/73 PASS** sur les quatre suites, zéro échec ni cas ignoré.
- TypeScript strict ciblé étendu à la newsletter, à son modèle réel et aux nouveaux tests : PASS.
- Revue indépendante : les 22 nouveaux cas ont été rejoués avec succès, et les empreintes des sept fichiers associés aux 51 cas précédents restent identiques. Reçu : `newsletter-independent-review.json`.
- Le constructeur Resend et les envois sont simulés, les adresses sont synthétiques. **Aucun courrier n'a été envoyé.**

## Qualification restante

La cause de l'ancien HTTP 500 en production n'est pas démontrée par ces tests. Les données réelles, le secret réellement installé, la pagination des gros volumes, les instantanés transactionnels et la concurrence entre deux générations hebdomadaires restent à vérifier séparément. Les lectures PostgREST sans pagination et la course historique lecture→génération→insertion restent présentes ; ce patch ne les qualifie pas.

L'installation complète, le build global, le lint global et la CI ne sont pas revendiqués. Le seul workflow présent avant ce lot concerne les paquets mobiles sur `main` ; il ne qualifie pas cette branche. Aucun merge, déploiement, migration ou raccordement fournisseur n'est réalisé par cette livraison.

Pour la newsletter, la concurrence entre exécutions, la pagination complète des abonnés, la réponse du fournisseur et l'enregistrement après envoi restent hors du correctif de lecture. Le lot ne constitue pas une qualification de la livraison effective de messages.
