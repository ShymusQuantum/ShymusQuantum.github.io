---
title: "Silent Beacon : le flag caché dans le housekeeping"
description: "124 paquets CCSDS, un dictionnaire de télémétrie, et un champ « mode » qui sort de sa plage autorisée."
date: 2026-08-09
event: Starpwn CTF 2026
category: Space Operations
kind: writeup
tags: [starpwn-2026, ccsds, telemetry, forensics]
image: /images/writeups/silent-beacon/fig1.jpg
imageAlt: "Valeur du champ mode pour 89 paquets : 29 sortent nettement de la plage 0 à 7"
---

**CTF :** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Catégorie :** Space Operations
**Fichiers :** `capture.bin`, `packet_ids.txt`, `telemetry_dictionary.json` · **Statut :** résolu

Un CubeSat se tait après une intrusion. La station sol a capté sa dernière rafale de télémétrie : 5 835 octets
de paquets CCSDS noyés dans du « bruit de ligne ». Il cachait quelque chose dans ses données de bord.

Le premier réflexe que j'ai appris en ops : **lire la documentation avant le dump**. Deux des trois fichiers
fournis sont de la doc. `packet_ids.txt` donne le marqueur de synchro et les sous-systèmes,
`telemetry_dictionary.json` décrit champ par champ le housekeeping, avec les plages de valeurs autorisées.
Dans une vraie mission, c'est l'équivalent de la base de données télémétrie : sans elle, un paquet n'est
qu'une suite d'octets.

## Rappel : un paquet CCSDS

Les satellites ne transmettent pas des octets bien rangés. Le récepteur voit un flux continu et doit
retrouver le début de chaque trame grâce à l'**ASM** (Attached Sync Marker), un motif fixe de 32 bits qui
vaut toujours `1A CF FC 1D` (défini dans CCSDS 131.0-B). Derrière, l'en-tête primaire du Space Packet
(CCSDS 133.0-B) fait 6 octets : l'**APID** sur 11 bits (quel sous-système parle), un compteur de séquence et
la longueur des données.

La doc annonce trois APID : 50 (SYSLOG, texte libre), 100 (HK_NOMINAL, 14 octets de charge) et 200
(ADCS_STATUS, non documenté). Seul l'APID 100 est décrit dans le dictionnaire, donc c'est là que je vais.

## Resynchroniser sur l'ASM

Le « bruit de ligne » de l'énoncé est un piège de vocabulaire : ce n'est pas du bruit à filtrer, c'est du
remplissage entre les paquets. Plutôt que de lire le fichier à la suite, je cherche toutes les occurrences
de l'ASM et je parse l'en-tête qui suit.

```python
import struct

data = open("capture.bin", "rb").read()
ASM = bytes.fromhex("1ACFFC1D")
packets, i = [], data.find(ASM)
while i != -1:
    h = data[i + 4:i + 10]
    w0, seq, length = struct.unpack(">HHH", h)
    apid, count = w0 & 0x7FF, seq & 0x3FFF
    payload = data[i + 10:i + 10 + length + 1]
    packets.append((apid, count, payload))
    i = data.find(ASM, i + 4)
```

```text
marqueurs ASM trouvés : 124   paquets parsés : 124
  APID 100 (HK_NOMINAL)  -> 89 paquets   <- documenté
  APID 200 (ADCS_STATUS) -> 21 paquets   (leurre)
  APID 50  (SYSLOG)      -> 14 paquets   (leurre)
```

Les 89 paquets de housekeeping ont des compteurs de 0 à 88, sans trou. Triés par compteur, ils sont dans
l'ordre d'émission.

## Chercher la violation de règle

Le dictionnaire dit que le champ `mode` (offset 12) vaut entre **0 et 7** : les huit modes de vol (SAFE,
NOMINAL, SCIENCE…). En ops, c'est exactement le genre de limite qui déclenche une alarme au sol. Donc je
cherche les paquets qui la violent.

![Le champ mode des 89 paquets : 60 dans la bande verte, 29 hors plage](/images/writeups/silent-beacon/fig1.jpg)

29 paquets sortent de la plage, et toutes leurs valeurs tombent entre 48 et 125 : **de l'ASCII imprimable**.
Le satellite a détourné un champ numérique pour glisser un caractère par paquet.

```python
hk = sorted((p for p in packets if p[0] == 100), key=lambda p: p[1])
flag = "".join(chr(p[2][12]) for p in hk if p[2][12] > 7)
print(flag)   # STARPWN{h0us3k33p1ng_4n0m4ly}
```

## Prouver plutôt que deviner

Un flag qui sort d'un seul critère laisse toujours un doute. Le format offre un second témoin indépendant :
`error_flags` (offset 13), dont le bit 7 s'appelle `ANOMALY`. Si les deux critères désignent les mêmes
paquets, ce n'est pas un hasard.

![Mode hors plage (rouge) et bit ANOMALY (bleu) : les deux courbes se superposent](/images/writeups/silent-beacon/fig2.jpg)

```text
paquets avec mode > 7                        : 29
dont bit ANOMALY armé                        : 29 / 29
paquets sains (mode <= 7) avec ANOMALY armé  : 0
```

Recouvrement parfait dans les deux sens. Deux champs, deux règles, la même désignation.

```text
STARPWN{h0us3k33p1ng_4n0m4ly}
```

## Ce que j'en retiens

- **Les fichiers annexes sont la moitié de la solution.** L'ASM et la plage 0–7 étaient écrits noir sur blanc.
- **Un secret dans la télémétrie se trahit par une violation des règles déclarées.** C'est aussi comme ça qu'on
  détecte une anomalie réelle en salle de contrôle.
- **Un critère de validation doit pouvoir échouer.** Le bit ANOMALY aurait pu ne pas coïncider ; qu'il coïncide
  transforme une lecture plausible en preuve.
