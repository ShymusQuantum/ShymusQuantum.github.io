---
title: "Recevoir les images de Meteor-M2 avec un RTL-SDR"
description: "Antenne, réglages et décodage d'un passage LRPT à 137 MHz, depuis son jardin."
date: 2026-10-12
category: Satellites
tags: [sdr, meteor-m2, lrpt, rtl-sdr]
image: /images/posts/meteor-waterfall.jpg
imageAlt: "Spectrogramme d'un passage de Meteor-M2 : la bande du signal LRPT dérive avec l'effet Doppler"
featured: true
---

> Article d'exemple : il montre comment mettre une image en tête d'article (champ `image`).

Les satellites météo russes **Meteor-M2** diffusent en continu des images de la Terre en
**LRPT**, un signal numérique QPSK autour de **137 MHz**. Avec une clé RTL-SDR et une antenne
faite maison, on peut les recevoir sans licence.

## le matériel

| élément | choix |
| --- | --- |
| récepteur | RTL-SDR v4 |
| antenne | V-dipôle, brins de 53 cm à 120° |
| logiciel | SatDump |

## ce que montre le spectrogramme

L'image ci-dessus est un *waterfall* : le temps descend, la fréquence va de gauche à droite.
La bande du signal dessine une courbe en S. C'est l'**effet Doppler** : le satellite se rapproche
(fréquence plus haute) puis s'éloigne (fréquence plus basse), avec un décalage de quelques kHz à 137 MHz.

```bash
# exemple : enregistrer un passage en bande de base
satdump record baseband --source rtlsdr --samplerate 1.024e6 \
  --frequency 137.9e6 --gain 38 --baseband_format cs16
```

## la suite

Dans un prochain article : décoder l'enregistrement et assembler l'image couleur.
