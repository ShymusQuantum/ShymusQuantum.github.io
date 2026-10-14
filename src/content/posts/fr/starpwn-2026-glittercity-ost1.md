---
title: "Glittercity OST1 : du FSK sous Doppler caché dans une piste synthwave"
description: "Un TLE de l'ISS en leurre, un signal en opposition de phase, du HDLC à 300 bauds et un vote majoritaire."
date: 2026-08-09
event: Starpwn CTF 2026
category: Space Comms & RF
kind: writeup
tags: [starpwn-2026, rf, fsk, doppler, hdlc, steganography]
image: /images/writeups/glittercity-ost1/fig2.jpg
imageAlt: "Spectrogramme du canal L-R : deux raies FSK qui glissent sous l'effet Doppler"
---

**CTF :** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Auteur du challenge :** Visionspace
**Catégorie :** Space Communications & RF · **Fichier :** `Glittercity-OST1.mp3` (stéréo, 48 kHz, 3 min) · **Statut :** résolu

Une bande-son synthwave, rien d'anormal à l'écoute. Mais les tags ID3 sont bavards : titre « Capture-7 »,
artiste « PRISMANTIR », et un commentaire qui contient un **TLE** pour un satellite baptisé CHANDELIER-7.

```text
CHANDELIER-7
1 25544U 98067A   26207.41084145  .00010751  00000+0  20166-3 0  9995
2 25544  51.6317 105.9876 0006941 339.4731  20.5977 15.49181604577830
```

## Désamorcer le leurre

Quand on a passé du temps sur des TLE, `25544` saute aux yeux : c'est le numéro NORAD de la **Station spatiale
internationale**. Inclinaison 51,6°, 15,49 révolutions par jour, tout colle. « CHANDELIER-7 » n'est qu'un
déguisement.

Ce TLE ouvre une impasse séduisante : propager l'orbite, géolocaliser la station sol par le Doppler, vérifier
que l'altitude ressort vers 415 km… Sauf que l'ISS est **toujours** vers 415 km. Ce critère ne peut pas échouer,
donc il ne prouve rien. Je mets le TLE de côté et j'écoute le fichier.

## Le canal L-R

Devant un fichier stéréo, mon premier réflexe est la différence des canaux. Un signal injecté en opposition de
phase (identique à gauche, inversé à droite) s'annule dans L+R, donc en mono et à l'oreille, mais ressort en
pleine puissance dans L−R, où la musique commune aux deux pistes s'efface.

```python
import numpy as np, soundfile as sf
x, fs = sf.read("Glittercity-OST1.mp3")
d = x[:, 0] - x[:, 1]
```

![Puissance 7,5–15 kHz : rien dans L+R, un signal 25 dB plus fort dans L−R entre 15 et 105 s](/images/writeups/glittercity-ost1/fig1.jpg)

## Lire le spectrogramme

![Canal L−R : deux raies parallèles à ~2 kHz d'écart, qui glissent de 14,2/12,2 kHz vers 10/8 kHz](/images/writeups/glittercity-ost1/fig2.jpg)

Trois faits se lisent directement :

1. **Deux tons en alternance**, écart constant d'environ 2 kHz : du FSK.
2. **Une descente régulière** des deux raies : la signature Doppler d'un émetteur qui s'éloigne pendant son passage.
3. **Une seule salve** continue de 90 secondes.

## Retirer le Doppler, puis décider

Comme un seul ton est actif à la fois, la fréquence instantanée suit une ligne de base qui dérive lentement (le
Doppler), avec un petit saut haut/bas par-dessus (le bit). Une médiane glissante sur plusieurs symboles capture
la dérive ; ce qui reste après soustraction est le saut FSK, dont le signe donne le bit. C'est du
**déchirpage** : ramener une porteuse qui glisse à une référence fixe.

```python
from scipy.signal import hilbert, medfilt
phase = np.unwrap(np.angle(hilbert(d)))
f_inst = np.diff(phase) * fs / (2 * np.pi)
baseline = medfilt(f_inst, 5 * 160 + 1)     # ~5 symboles à 300 bauds
bits = (f_inst - baseline) > 0
```

Le débit se mesure sur les durées de symboles : **300 bauds** (160 échantillons à 48 kHz). Il reste les
conventions de lecture ; je teste les combinaisons et je garde celle qui donne du texte : **bits inversés,
octets LSB d'abord**.

## Déframer le HDLC

Le flux est découpé en trames HDLC encadrées par le fanion `0x7E` (`01111110`). Pour qu'un fanion n'apparaisse
jamais dans les données, l'émetteur insère un 0 après cinq 1 consécutifs (*bit stuffing*), que le récepteur
retire. C'est le même tramage que l'AX.25 utilisé par une bonne partie des CubeSats amateurs.

```text
CHANDELIER-7
FLAG=STARPWN{Syn7h_v1be$_fr0m_0rb1t}
```

## La redondance comme preuve

Le message est répété trame après trame. Sur une liaison Doppler bruitée, chaque copie a ses erreurs, mais
jamais aux mêmes positions. Un vote majoritaire caractère par caractère les efface.

![Quatre copies brutes du flag, erreurs en rouge à des positions différentes, et le vote majoritaire](/images/writeups/glittercity-ost1/fig3.jpg)

```text
STARPWN{Syn7h_v1be$_fr0m_0rb1t}
```

Saisie : `Syn7h` avec un 7, `v1be$` avec un 1 et un dollar, des zéros dans `fr0m_0rb1t`.

## Ce que j'en retiens

- **Un critère qui ne peut pas échouer ne prouve rien.** L'altitude « cohérente » de l'ISS était de la fausse confiance.
- **Fichier stéréo : regarder L−R d'abord.**
- **Mesurer la modulation plutôt que la deviner.** Deux tons, une pente, une durée de symbole : le spectrogramme donne tout.
- **La redondance est une preuve.** Un flag issu d'un vote sur des dizaines de trames ne doit rien à la chance.
