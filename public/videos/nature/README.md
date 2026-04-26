# KAÏA — Vidéos nature 4K

Ce répertoire contient les 12 boucles nature 4K utilisées par `ParallaxNatureBackground`.

## État actuel (P2)

**Aucun fichier MP4 commité dans le repo.** Le système fonctionne sans : `ParallaxNatureBackground`
détecte l'absence de fichier et utilise automatiquement le gradient CSS associé au thème (cf.
`src/lib/multisensorial/motion-tokens.ts`). L'expérience reste fluide tant que les vraies vidéos
ne sont pas livrées.

## Comment livrer les vraies vidéos

Deux pistes, à arbitrer par Tissma :

### A. Génération IA (recommandé, après budget Replicate validé)
```bash
# Dry-run (aucun crédit consommé) — affiche la liste des prompts
npm run videos:nature:plan

# Génération réelle (consomme des crédits Replicate)
REPLICATE_API_TOKEN=r8_xxx npm run videos:nature:generate

# Compression CRF 28, conversion AV1 + WebM fallback, cible <2.5 MB / vidéo
npm run videos:nature:compress
```

### B. Stock Pexels (gratuit, attribution requise)
1. Crée un compte gratuit sur https://www.pexels.com
2. Pour chaque slug du manifest (`src/lib/multisensorial/motion-tokens.ts`), télécharge la vidéo
   référencée (champ `pexelsSearchUrl`) en HD (1920×1080, 24-30 fps, ≤ 30 s).
3. Renomme en `{slug}.mp4` (ex : `forest.mp4`, `ocean.mp4`).
4. Compresse :
   ```bash
   ffmpeg -i forest.mp4 -c:v libsvtav1 -crf 32 -preset 6 -an forest.webm
   ffmpeg -i forest.mp4 -c:v libx264 -crf 28 -preset slow -an forest.mp4
   ```
5. Place les fichiers dans `public/videos/nature/{slug}.{mp4,webm}`.
6. Le composant détecte automatiquement leur présence.

### Attribution Pexels (légalement requis)
Mettre dans `/legal/credits` (à créer P5) la ligne :
> Vidéos d'arrière-plan : Pexels (auteurs listés dans `motion-tokens.ts`).

## Spec technique cible
- **Durée** : 8-12 s, boucle parfaite (start = end seamless).
- **Résolution** : 1920×1080 (HD) en P2, 3840×2160 (4K) en P5+.
- **Codec** : H.264 (Safari) + AV1/WebM (Chrome/Firefox).
- **Bitrate** : ≤ 2,5 Mbps.
- **Audio** : aucun (`-an`).
- **Couleurs** : low contrast (la vidéo passe en arrière-plan, l'UI doit rester lisible).
