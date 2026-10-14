---
title: "Beaconing from above : lire une balise morse au chronomètre"
description: "Un fichier audio, un ton à 600 Hz et une seule mesure à faire : la durée de l'unité morse."
date: 2026-08-09
event: Starpwn CTF 2026
category: Space Comms & RF
kind: writeup
tags: [starpwn-2026, rf, morse, cw, beacon]
image: /images/writeups/beaconing-from-above/fig2.jpg
imageAlt: "Histogrammes des durées des tons et des silences : deux et trois pics nets"
---

**CTF :** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Catégorie :** Space Communications & RF
**Fichier :** `beacon.wav` (mono, 22 050 Hz, 82,4 s) · **Statut :** résolu

Une balise, c'est la première chose qu'on cherche à entendre après un lancement. Avant la télémétrie, avant
le premier contact, un satellite fraîchement éjecté se contente souvent de répéter son indicatif en morse :
c'est robuste, ça passe sous le bruit, et n'importe quel radioamateur peut confirmer que l'oiseau est vivant.
Ce challenge part exactement de là : la station sol a enregistré la balise, à nous de la lire.

## Ce qu'on entend

À l'oreille, aucun doute : des bips courts, des bips longs, des silences. Du CW. Avant d'écrire quoi que ce
soit, je vérifie quand même avec une FFT sur quelques secondes de signal actif : **une seule raie, à 600 Hz**.
Pas de deuxième ton, donc pas de FSK. Le signal est une porteuse qu'on allume et qu'on éteint, rien de plus.

Ça change la nature du problème. Le morse ne code rien en fréquence ni en phase : **toute l'information est
dans les durées**. Deux durées d'émission (point = 1 unité, trait = 3 unités) et trois durées de silence
(1 unité entre symboles, 3 entre lettres, 7 entre mots). Décoder, c'est mesurer une seule chose : l'unité.

## Suivre l'enveloppe

Pas besoin de démoduler. Je redresse le signal, je le lisse, et un seuil sépare « ton actif » de « silence ».

![Enveloppe des six premières secondes : les zones jaunes sont les tons actifs](/images/writeups/beaconing-from-above/fig1.jpg)

```python
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, filtfilt

fs, x = wavfile.read("beacon.wav")
x = x.astype(float) / np.abs(x).max()
b, a = butter(4, 50 / (fs / 2))           # passe-bas sur le signal redressé
env = filtfilt(b, a, np.abs(x))
on = env > 0.25 * env.max()
```

## Mesurer l'unité

Je découpe ensuite `on` en plages ON/OFF consécutives et je regarde l'histogramme de leurs durées. C'est la
mesure qui débloque tout : si c'est bien du morse, les durées ne prennent qu'une poignée de valeurs, dans les
rapports 1 : 3 : 7.

![Durées des tons (98 ms et 294 ms) et des silences (98, 294 et ~686 ms)](/images/writeups/beaconing-from-above/fig2.jpg)

Bimodal pour les tons, trimodal pour les silences, exactement dans les rapports canoniques. **L'unité vaut
98 ms**, soit environ **12 mots par minute** avec la convention PARIS (vitesse ≈ 1200 / durée du point en ms).
Les seuils de décision se placent tout seuls : 2 unités entre point et trait, 2 et 5 unités pour les silences.

## Décoder

Avec l'unité en main, la suite est une table de correspondance :

```text
VVV VVV VVV DE STARPWN STARPWN STARPWN
B34C0N D3C0D3D V14 R4D10
73 DE STARPWN K
```

Ce qui me rassure avant même de lire le flag, c'est la **grammaire radioamateur** : `VVV` pour régler le
récepteur, `DE` avant l'indicatif, `73` pour les salutations, `K` pour « à vous ». Si ma segmentation était
fausse, ces codes ne sortiraient pas aussi propres. Les espaces du corps deviennent des tirets bas :

```text
STARPWN{B34C0N_D3C0D3D_V14_R4D10}
```

Attention à la saisie : les `0` de `C0N` et `R4D10` sont des zéros, pas des O.

## Ce que j'en retiens

- **Caractériser avant de décoder.** Une FFT (un seul ton, donc CW) et un histogramme (rapport 1:3) suffisent à
  identifier la modulation et sa métrique, sans une ligne de décodeur.
- **Le morse est un code de durées.** Toute la difficulté se résume à mesurer une unité de temps.
- **Le contexte fait partie du signal.** Reconnaître `VVV`, `DE`, `73` et `K`, c'est une validation gratuite.
