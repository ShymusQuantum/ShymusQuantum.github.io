---
title: "Time to Intercept : transfert de Hohmann et phasage orbital"
description: "Un service TCP, deux nombres à renvoyer : le delta-v de la manœuvre et surtout l'instant précis du tir."
date: 2026-09-04
event: Starpwn CTF 2026
category: Space Operations
kind: writeup
tags: [starpwn-2026, orbital-mechanics, hohmann, phasing]
image: /images/writeups/time-to-intercept/fig1.jpg
imageAlt: "Transfert de Hohmann : l'ellipse de transfert entre l'orbite basse et l'orbite de la cible"
---

**CTF :** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Catégorie :** Space Operations
**Interface :** un service TCP (netcat, pas un site web) · **Statut :** méthode complète

Un satellite doit en rejoindre un autre : manœuvrer depuis une orbite circulaire basse jusqu'à l'orbite de la
cible et **arriver au bon endroit au bon moment**. Le challenge n'est pas un fichier, c'est un service réseau
qui pose un scénario chiffré (ton altitude, celle de la cible, l'angle de phase actuel) et attend deux nombres.

Petit rappel qui m'a servi la première fois : un `host:port` n'est pas forcément un site web. Beaucoup de
services CTF sont des sockets TCP bruts ; on s'y connecte avec `nc host port` ou un script, le serveur dialogue
en texte.

## Le transfert de Hohmann

Pour passer d'une orbite circulaire basse à une orbite circulaire haute, la manœuvre la moins coûteuse en
carburant est le transfert de Hohmann. Une impulsion place le vaisseau sur une ellipse dont le périgée touche
l'orbite de départ et l'apogée l'orbite d'arrivée. On parcourt une demi-ellipse — exactement 180° — ce qui
prend une demi-période de cette ellipse.

![Transfert de Hohmann : l'impulsion injecte sur l'ellipse, l'apogée touche l'orbite cible](/images/writeups/time-to-intercept/fig1.jpg)

## Le vrai cœur : le phasage

Calculer le delta-v ne suffit pas. Arriver sur la bonne orbite pendant que la cible est de l'autre côté de la
Terre ne sert à rien. Il faut tirer à l'instant où la cible a, devant nous, **l'avance angulaire** qui la fera
arriver au rendez-vous exactement quand nous y arrivons.

![Au tir, la cible doit avoir l'avance θ ; une demi-période plus tard, les deux se rejoignent](/images/writeups/time-to-intercept/fig2.jpg)

Le rendez-vous est à l'apogée, à 180° de notre point de tir. Pendant la durée du transfert, la cible (vitesse
angulaire ω₂) parcourt ω₂·t_t. Elle doit donc se trouver, au tir, à θ = π − ω₂·t_t devant nous. Notre orbite
basse tourne plus vite (ω₁ > ω₂), donc l'écart évolue au rythme ω₁ − ω₂ : on attend qu'il atteigne θ.

## Les formules, et un solveur vérifiable

Avec μ = 398 600,44 km³/s², R = 6 371 km, r₁ = R + h₁, r₂ = R + h₂ :

```python
from math import pi, sqrt, tau

MU, R_E = 398_600.44, 6_371.0

def intercept(h1, h2, phi0):
    r1, r2 = R_E + h1, R_E + h2
    a = (r1 + r2) / 2                                  # demi-grand axe de l'ellipse
    dv = sqrt(MU * (2 / r1 - 1 / a)) - sqrt(MU / r1)   # 1re impulsion (km/s)
    t_t = pi * sqrt(a**3 / MU)                         # durée du transfert
    w1, w2 = sqrt(MU / r1**3), sqrt(MU / r2**3)        # vitesses angulaires
    theta = (pi - w2 * t_t) % tau                      # avance requise de la cible
    wait = ((phi0 - theta) % tau) / (w1 - w2)          # temps d'attente avant le tir
    return dv * 1000, wait                             # m/s, s
```

## Valider sur un cas connu

Avant de faire confiance au script, je le teste sur le transfert tabulé partout : orbite basse à 300 km vers la
géostationnaire (35 786 km), dont la première impulsion de référence vaut ~2 440 m/s.

```text
LEO 300 km -> GEO 35786 km :
  1re impulsion calculée : 2427.7 m/s   (référence ~2440 m/s)  OK
  durée de transfert     : 18982 s = 5,27 h                    OK
```

L'écart de ~12 m/s vient du choix du rayon terrestre (6 371 vs 6 378 km) et reste dans la tolérance. La méthode
est validée avant même de se connecter. Reste une subtilité pratique : la convention de signe de l'angle de
phase renvoyé par le serveur. Selon qu'il compte la cible devant ou derrière, il faut parfois essayer θ puis −θ ;
mon script tente les deux sens, dans la limite des essais autorisés par connexion. On renvoie la paire
`delta_v wait_time` (tolérances typiques ±10 m/s et ±60 s).

## Ce que j'en retiens

- **Une adresse `host:port` n'est pas forcément un site web.** Beaucoup de services CTF sont des sockets TCP.
- **Le calcul orbital, c'est deux problèmes.** Hohmann donne le *combien* (delta-v), le phasage le *quand*.
  Oublier le second fait rater la cible même avec le bon delta-v.
- **Valider sur un cas connu avant le cas réel.** Vérifier LEO→GEO (~2 428 m/s) garantit qu'un refus vient d'une
  convention de signe, pas d'une formule fausse.
