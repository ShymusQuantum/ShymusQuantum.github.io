# ShymusQuantum · blog

Blog de cybersécurité, radio et satellites, construit avec [Astro](https://astro.build)
et publié automatiquement sur GitHub Pages à chaque push sur `main`.

## Écrire un article

Crée un fichier dans `src/content/posts/fr/` (et sa traduction, avec le **même nom de fichier**,
dans `src/content/posts/en/`), par exemple `mon-article.md` :

```markdown
---
title: "Mon titre"
description: "Une phrase qui résume l'article."
date: 2026-10-20
category: Satellites
tags: [sdr, noaa]
image: /images/posts/mon-image.jpg     # facultatif : l'image de l'article
imageAlt: "Ce que montre l'image"
kind: article                           # article ou writeup (solution de CTF)
featured: true                          # facultatif : mis en avant sur l'accueil
draft: false                            # true = pas encore publié
---

Le texte en Markdown…
```

Les images vont dans `public/images/posts/`. L'adresse de l'article sera
`https://shymusquantum.github.io/posts/mon-article/` (et `/en/posts/mon-article/` en anglais).
Si la traduction n'existe pas, le bouton FR/EN renvoie vers la liste des articles de l'autre langue.

## Personnaliser

- `src/site.ts` : nom, photo de fond et son crédit, moyens de contact
- `src/i18n.ts` : tous les textes de l'interface en français et en anglais
- `src/views/About.astro` : page « à propos » (FR et EN)
- `src/styles/global.css` : couleurs et polices
- `src/scripts/sky.js` : les satellites et étoiles filantes animés

## Photo de fond

Par défaut, le déploiement télécharge la photo « ALMA beneath the stars » (A. Duro/ESO, CC BY 4.0).
Pour utiliser ta propre photo, mets-la dans `public/images/hero.jpg` et mets à jour le crédit dans `src/site.ts`.
Sans photo (par exemple en local), le ciel entier est généré automatiquement.

## Tester sur ton ordinateur

```bash
npm install
npm run dev      # puis ouvre http://localhost:4321
```

## Mise en ligne

Dans les réglages du dépôt : **Settings → Pages → Source : GitHub Actions**.
Ensuite chaque push sur `main` reconstruit et publie le site.
