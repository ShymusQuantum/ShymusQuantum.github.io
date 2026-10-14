# ShymusQuantum · blog

Blog de cybersécurité, radio et satellites, construit avec [Astro](https://astro.build)
et publié automatiquement sur GitHub Pages à chaque push sur `main`.

## Écrire un article

Crée un fichier dans `src/content/posts/`, par exemple `mon-article.md` :

```markdown
---
title: "Mon titre"
description: "Une phrase qui résume l'article."
date: 2026-10-20
category: Satellites
tags: [sdr, noaa]
image: /images/posts/mon-image.jpg     # facultatif : l'image de l'article
imageAlt: "Ce que montre l'image"
featured: true                          # facultatif : mis en avant sur l'accueil
draft: false                            # true = pas encore publié
---

Le texte en Markdown…
```

Les images vont dans `public/images/posts/`. L'adresse de l'article sera
`https://shymusquantum.github.io/posts/mon-article/`.

## Personnaliser

- `src/site.ts` : nom, sous-titre, liens du menu
- `src/pages/index.astro` : texte d'accueil
- `src/pages/about.astro` : page « à propos »
- `src/styles/global.css` : couleurs et polices
- `src/scripts/sky.js` : le ciel animé, les satellites et l'antenne

## Tester sur ton ordinateur

```bash
npm install
npm run dev      # puis ouvre http://localhost:4321
```

## Mise en ligne

Dans les réglages du dépôt : **Settings → Pages → Source : GitHub Actions**.
Ensuite chaque push sur `main` reconstruit et publie le site.
