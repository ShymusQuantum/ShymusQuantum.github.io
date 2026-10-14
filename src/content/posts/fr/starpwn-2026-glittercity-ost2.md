---
title: "Glittercity OST2 : trois appels fracturés, une image en 179 × 7 pixels"
description: "Le 500 points de la catégorie RF : salve témoin, ASM, vote majoritaire, XOR prouvé par popcount et un flag dessiné ligne par ligne."
date: 2026-08-24
event: Starpwn CTF 2026
category: Space Comms & RF
kind: writeup
featured: true
tags: [starpwn-2026, rf, fsk, doppler, ccsds, xor, envisat]
image: /images/writeups/glittercity-ost2/fig1.jpg
imageAlt: "Spectrogramme du canal L-R : une salve de calibration horizontale puis trois appels qui glissent"
---

**CTF :** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Auteur du challenge :** Visionspace
**Catégorie :** Space Communications & RF · **500 points** · **Fichier :** `Glittercity-OST2.mp3` · **Statut :** résolu

C'est le challenge qui m'a le plus résisté, et celui dont je suis le plus content. Tout est dans l'énoncé, à
condition de le lire comme une procédure :

> The grid goes dark. Before shutdown, you swept the final useful arc over the Mojave just below one meter.
> The dish was tracking a dead machinery that once watched the whole planet, now drifting as one of the
> largest ghosts in orbit. The receiver came back. Dead-Eye calling. Trying to reach back home.
> **Three fractured calls make one. It has forgotten letters, now it speaks in lines. Burn away the
> repeating veil forged from its number, high byte first.** Find the ghost. Recover the message.

## Décoder l'énoncé

| Fragment | Ce que j'en tire |
| --- | --- |
| « dead machinery that once watched the whole planet… largest ghosts in orbit » | **Envisat** : 8 tonnes, satellite d'observation de l'ESA, contact perdu en avril 2012, l'un des plus gros débris en orbite basse. NORAD **27386**. |
| « Three fractured calls make one » | Trois copies du même message, trouées à des endroits différents : à recombiner, pas à concaténer. |
| « It has forgotten letters, now it speaks in lines » | Le message n'est pas de l'ASCII : c'est une image tracée ligne par ligne. |
| « repeating veil forged from its number, high byte first » | XOR avec une clé répétée : 27386 = `0x6AFA`, donc `6A FA 6A FA…` |

« Mojave » (Goldstone) et « just below one meter » (une longueur d'onde, donc une bande au-dessus de 300 MHz)
sont du décor. Savoir ignorer une partie de l'énoncé fait partie du travail.

## La chaîne complète

```text
Glittercity-OST2.mp3 (stéréo, 48 kHz, 2 min 21 s)
 ├─ 1. canal L-R             -> 4 salves FSK cachées
 ├─ 2. durées de plages      -> 160 éch/symbole = 300 bauds
 ├─ 3. déchirpage Doppler    -> retire -53 à -66 Hz/s
 ├─ 4. démodulation FSK      -> bits (inversés, NRZ, LSB first)
 ├─ 5. salve 1 = témoin      -> "CHANDELIER-7 / STATUS=GROUND CALIBRATION"
 ├─ 6. alignement sur l'ASM  -> 1A CF FC 1D dans les appels 2, 3, 4
 ├─ 7. vote majoritaire      -> 1 paquet CCSDS, 159 octets de payload
 ├─ 8. XOR 6A FA             -> un clair très creux (2,6 bits à 1 par octet)
 ├─ 9. période = 179 bits    -> raster 179 × 7
 └─ 10. lecture + preuve     -> STARPWN{THIS_WAS_OFF_TOO_MUCH}
```

## 1. Faire apparaître le signal

Même astuce qu'OST1 : `d = L - R`. Le spectrogramme répond déjà à deux questions.

![Canal L−R : quatre salves, la première horizontale, les trois autres en pente](/images/writeups/glittercity-ost2/fig1.jpg)

Il y a **quatre salves**, pas trois. Et la première est parfaitement horizontale alors que les trois autres
glissent. Un émetteur sans Doppler, c'est un émetteur immobile : la salve 1 vient **du sol**.

## 2. Mesurer avant de décoder

La règle d'or en RF : on ne devine pas une modulation, on la mesure.

- **Modulation :** deux raies, une seule active à la fois, jamais éteintes ensemble. FSK, pas morse.
- **Écart :** ~2 030 Hz, constant sur les quatre salves.
- **Débit :** je démodule grossièrement, je découpe en plages de même valeur et je regarde leurs longueurs.

```text
longueurs de plage les plus fréquentes (échantillons) :
  160 -> 396 fois   320 -> 191 fois   480 -> 45 fois   960 -> 67 fois
toutes multiples de 160  =>  48000 / 160 = 300 bauds
```

Pas besoin de balayer des centaines de débits candidats.

## 3. Retirer le Doppler

Un démodulateur FSK attend ses tons à des fréquences fixes. Je suis la fréquence centrale des deux raies sur
chaque salve, j'ajuste une droite, et je multiplie le signal par l'exponentielle complexe qui annule la dérive.

| Salve | Fenêtre | Fréquence centrale au début | Dérive |
| --- | --- | --- | --- |
| 1 (témoin) | 15,0 – 27,9 s | 11 196 Hz | +0,4 Hz/s (nulle) |
| Appel 2 | 41,7 – 46,5 s | 14 151 Hz | −55,8 Hz/s |
| Appel 3 | 88,3 – 93,0 s | 11 215 Hz | −66,2 Hz/s |
| Appel 4 | 134,9 – 139,8 s | 8 252 Hz | −53,1 Hz/s |

Résidu d'environ 6 Hz après ajustement, à comparer aux 2 030 Hz entre les tons : sans conséquence. La dérive
nulle de la salve 1 confirme par la mesure ce que je soupçonnais.

## 4. La salve témoin

Un flux démodulé peut se lire de **huit façons** : bits inversés ou non, NRZ ou NRZI, octets LSB ou MSB d'abord.
Une seule erreur et on n'a que du bruit. Plutôt que de deviner, j'utilise la salve sol comme témoin et je teste
les huit combinaisons :

```text
convention retenue : bits inversés, NRZ, LSB first
  ... 7E 7E 7E 7E 7E 7E 7E 7E ...
  CHANDELIER-7\nSTATUS=GROUND CALIBRATION\n
  7E 7E 7E 7E ...
```

Message en clair, fanions HDLC, répété huit fois. Toute la chaîne est validée, et je n'ai plus jamais eu à
douter de la convention. C'est la même logique qu'une séquence de calibration avant une campagne de mesure :
un morceau du problème dont on connaît la réponse sépare les erreurs de réglage des erreurs de compréhension.

## 5. « Three fractured calls make one »

Les trois appels contiennent l'ASM CCSDS `1A CF FC 1D`, aux bits 68, 66 et 76. J'aligne les trois flux dessus.
Ils concordent à 90–94 %, mais ce qui compte, c'est **où** ils divergent.

![Les trois appels zoomés : chacun a une zone muette, jamais au même endroit](/images/writeups/glittercity-ost2/fig2.jpg)

Effacements complémentaires : là où un appel se tait, les deux autres parlent. Avec trois copies et au plus un
effacement par position, deux copies sont toujours justes. **Le vote majoritaire n'est pas une approximation,
c'est la reconstruction exacte.** Contrôle croisé : une combinaison pondérée par la puissance reçue donne le
même résultat à un octet près sur 159.

```text
1A CF FC 1D | 00 9F D9 FD 11 1D | 56 08 42 76 90 D5 ... (159 octets)
    ASM     |  en-tête CCSDS    |  payload
APID = 0x09F (159)   compteur = 6653   longueur annoncée = 4382 (tronqué)
```

## 6. Brûler le voile, et le prouver

L'énoncé donne `0x6AFA`. Mais une clé tirée d'un jeu de mots reste une hypothèse. Le réflexe crypto serait de
tester les 65 536 clés et de minimiser l'entropie : **inutile**. Un XOR par une constante permute les valeurs
d'octets, l'histogramme est le même à l'ordre près, l'entropie est identique pour toutes les clés. Le critère
ne peut pas discriminer.

Il faut un critère sensible à la structure interne des octets. Le **popcount** (nombre de bits à 1) en est un :
si le clair est une image creuse, il sera nettement plus bas avec la bonne clé.

```python
import numpy as np
c = np.frombuffer(payload, np.uint8)
def ones(key):
    k = np.resize(np.array([key >> 8, key & 0xFF], np.uint8), c.size)
    return np.unpackbits(c ^ k).sum()
best = min(range(1 << 16), key=ones)    # 0x6AFA, 417 bits à 1
```

![Popcount pour les 65 536 clés : 0x6AFA est le minimum global, 417 contre ~636 au hasard](/images/writeups/glittercity-ost2/fig3.jpg)

La clé de l'énoncé est confirmée par les données. Et 417 bits à 1 sur 1 272, soit 2,6 par octet : ce n'est ni
du texte ni des données compressées. C'est **creux**.

## 7. « It speaks in lines »

C'est là que le challenge se joue. Le clair est une pluie d'impulsions isolées. J'ai perdu du temps sur des pistes
tentantes, toutes fausses :

- **Du morse ?** Les silences de 1, 3 et 7 unités y font penser, mais 229 impulsions d'un bit contre 11 de trois : pas de traits. Rejeté.
- **Du vectoriel ?** Relier les octets comme des coordonnées ne donne qu'un gribouillis. Rejeté.
- **Un bitmap colonne par colonne de 8 pixels ?** Du bruit. Rejeté.
- **Balayer les largeurs de 8 à 250 à l'œil ?** 179 était dans le lot, mais noyé dans 240 rendus ratés.

La bonne piste est venue d'une mesure. Une image tracée ligne par ligne a des lignes successives qui se
ressemblent : le flux doit **se répéter avec une période égale à la largeur**. Je cherche la plus longue
sous-chaîne répétée :

```text
plus longue répétition : 34 impulsions identiques
  1re occurrence : bit 724
  2e occurrence  : bit 903
  écart          : 179 bits   <- largeur de l'image
1272 / 179 = 7,1  ->  raster 179 × 7
```

Un `reshape(7, 179)` et l'image apparaît, dans une police 5 × 7 :

![Le raster reconstruit : STARPWN{THIS_WAS_OFF_TOO_MUCH}](/images/writeups/glittercity-ost2/fig4.jpg)

C'est le même principe qu'un fax ou qu'une image APT de satellite météo : la géométrie se lit dans les répétitions.

## 8. Lire, puis prouver

Trois caractères posent problème : la transmission commence en cours de première ligne, donc les 16 premiers
pixels (le haut du S, du T et du A) n'ont jamais été émis. Plutôt que de conclure à vue, je fais le test qui peut
échouer : j'extrais la police des 26 caractères lisibles, je redessine la chaîne supposée, je la remets en flux
de bits et je la compare au clair.

```text
raster resynthétisé pour STARPWN{THIS_WAS_OFF_TOO_MUCH} : 7 × 179 = 1253 pixels
partie réellement transmise (démarre au pixel 16)       : 1237 pixels
correspondance bit à bit                                : 1237 / 1237 = 100 %
bits restants                                           : 35 bits de bourrage
```

Un seul caractère faux et le taux s'effondrait.

```text
STARPWN{THIS_WAS_OFF_TOO_MUCH}
```

`OFF` s'écrit avec deux F majuscules, pas un zéro.

## Les impasses

| Impasse | Pourquoi on y tombe | Ce qui la tue |
| --- | --- | --- |
| Combiner les appels au niveau symbole | C'est le niveau où l'on raisonne naturellement | Les horloges dérivent ; l'ASM donne un repère commun exact |
| Localiser la station par le Doppler | Le Doppler est mesurable | Il sert uniquement à être retiré |
| Minimiser l'entropie pour la clé | Réflexe crypto standard | L'entropie est invariante par XOR constant |
| Balayer 240 largeurs à l'œil | « speaks in lines » suggère une image | La période de répétition donne la largeur |
| Croire la longueur de 4 382 octets | C'est écrit dans l'en-tête | Le paquet est tronqué ; 159 octets suffisent |

## Ce que j'en retiens

- **Un critère de validation doit pouvoir échouer.** L'entropie ne pouvait pas, le popcount si.
- **Un témoin vaut mieux que huit hypothèses.** La salve sol a figé la convention une fois pour toutes.
- **Mesurer plutôt que balayer.** Le débit et la largeur sont sortis de mesures directes.
- **La géométrie d'un signal se lit dans ses répétitions.** Raster, fax, trame vidéo : même principe.
- **L'énoncé est un mode d'emploi, mais pas intégralement.** Trois phrases utiles, deux de décor.
