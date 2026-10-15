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

## L'énoncé est un mode d'emploi déguisé

Cet énoncé est un mode d'emploi complet, à condition de le lire comme tel. Chaque phrase décrit une étape de
décodage, et elles sont données dans l'ordre :

| Fragment de l'énoncé | Ce que ça veut dire techniquement |
| --- | --- |
| « a dead machinery that once watched the whole planet, one of the largest ghosts in orbit » | Le satellite est **Envisat** : un satellite d'observation de la Terre de l'ESA, 8 tonnes, qui a brusquement cessé de répondre en 2012 et dérive depuis sans contrôle — l'un des plus gros débris spatiaux en orbite basse. Un « fantôme » littéral. Son numéro NORAD est 27386. |
| « Three fractured calls make one » | Trois copies du même message, chacune trouée à un endroit différent. Il faut les recombiner, pas les concaténer. |
| « It has forgotten letters, now it speaks in lines » | Le message n'est pas du texte ASCII : c'est une image tracée ligne par ligne. C'est la phrase qui a résisté le plus longtemps. |
| « Burn away the repeating veil forged from its number, high byte first » | Chiffrement XOR avec une clé répétée construite à partir de 27386 = `0x6AFA` en hexadécimal, octet de poids fort d'abord : `6A FA 6A FA ...` |

Deux détails sont décoratifs et ne servent à rien : le « Mojave » (allusion à la station de Goldstone de la
NASA) et le « just below one meter » (une longueur d'onde, donc une bande de fréquences autour de 300 MHz).
Ils plantent le décor, ils ne portent aucune information exploitable. Savoir ignorer une partie de l'énoncé
fait partie du travail — et fait écho au leurre TLE d'OST1.

## Le plan de vol, en une page

Voici le chemin du fichier audio jusqu'au drapeau. Chaque étape est détaillée ensuite, avec les notions
nécessaires.

```text
Glittercity-OST2.mp3   (stéréo, 48 kHz, 2 min 21 s)
   |
   +--  1. canal L-R          -> révèle 4 salves FSK cachées
   +--  2. mesure des durées  -> 160 éch/symbole = 300 bauds
   +--  3. déchirpage Doppler -> retire la dérive de -53 à -66 Hz/s
   +--  4. démodulation FSK   -> bits (inversés, NRZ, LSB first)
   +--  5. salve 1 = témoin   -> 'CHANDELIER-7 / STATUS=GROUND CALIBRATION'
   +--  6. alignement sur ASM -> 1A CF FC 1D dans les appels 2, 3, 4
   +--  7. vote majoritaire   -> 1 paquet CCSDS, 159 octets de payload
   +--  8. XOR 6A FA          -> un clair très creux (2,6 bits par octet)
   +--  9. période = 179 bits -> raster de 179 x 7 pixels
   +-- 10. lecture            -> le drapeau, dessiné en pixels
```

## Le vieux truc du karaoké, encore (étape 1 : L−R)

Même réflexe que dans OST1 (post précédent, qui détaille le principe) : le signal caché est en opposition de
phase entre les deux canaux stéréo — il s'annule à l'écoute mono et ressort en pleine puissance dans la
différence. Une ligne : `d = L - R`, et le signal saute aux yeux.

Le spectrogramme (l'image temps × fréquence × puissance, la « partition » du signal) du canal L−R montre
quatre salves nettement au-dessus de la musique. La première est parfaitement horizontale ; les trois autres
glissent vers le bas.

![Spectrogramme de L−R : quatre salves au-dessus de la musique. La première est horizontale (émission sol) ; les trois autres glissent (Doppler satellite).](/images/writeups/glittercity-ost2/fig1.jpg)

Cette image répond déjà à deux questions. D'abord, il y a quatre salves et non trois : l'énoncé parlait de
« three fractured calls », la première est donc à part. Ensuite, cette première salve ne dérive pas en
fréquence alors que les trois autres si — or la dérive en fréquence, c'est la signature Doppler d'un émetteur
en mouvement. Une salve sans Doppler, c'est un émetteur immobile : la salve 1 est émise depuis le sol. Elle
servira de référence.

## Trois mesures, zéro décodage (étape 2 : mesurer avant de décoder)

La règle d'or des challenges RF : on ne devine pas une modulation, on la mesure. Trois mesures triviales
suffisent ici.

**La modulation.** Deux raies présentes en permanence, dont une seule est active à la fois, et qui ne
s'éteignent jamais toutes les deux : c'est du FSK — un ton pour le 0, un ton pour le 1. Ce n'est pas du morse,
qui, lui, éteindrait complètement la porteuse entre les symboles.

**L'écart entre les tons.** Environ 2030 Hz, constant sur les quatre salves.

**Le débit.** C'est la mesure décisive, et elle ne coûte rien. On démodule grossièrement en fréquence
instantanée (pour chaque échantillon : « le ton est-il plutôt haut ou plutôt bas ? »), on découpe le résultat
en plages consécutives de même valeur, et on regarde les longueurs obtenues :

```text
longueurs de plage les plus fréquentes (en échantillons) :
   160 -> 396 fois     320 -> 191 fois     480 -> 45 fois     960 -> 67 fois
toutes multiples de 160  =>  1 symbole = 160 échantillons
48000 / 160 = 300 bauds
```

Toutes les longueurs sont des multiples de 160 échantillons : c'est la durée d'un symbole. À 48 000
échantillons par seconde, ça fait 300 symboles par seconde, donc 300 bauds (300 bits/s ici, puisqu'un symbole
= un bit en FSK binaire). Le débit tombe tout seul, sans rien avoir décodé — et sans le balayage à l'aveugle
sur des centaines de débits candidats qui aurait pu manger une heure.

## L'ambulance spatiale (étape 3 : retirer le Doppler)

**L'effet Doppler et le déchirpage.** Quand un satellite passe au-dessus d'une station, il s'approche puis
s'éloigne. Comme la sirène d'une ambulance, la fréquence reçue est d'abord plus haute que la fréquence émise,
puis plus basse : elle glisse pendant tout le passage. Sur un spectrogramme, les raies descendent en pente
douce.

Un démodulateur FSK, lui, attend ses deux tons à des fréquences fixes : si la paire de raies glisse de
plusieurs kilohertz, il ne sait plus où chercher. Il faut donc d'abord déchirper : mesurer la dérive, puis
multiplier le signal par une exponentielle complexe qui l'annule — en clair, appliquer un contre-glissement
qui ramène les raies à l'horizontale. Ici la dérive est quasi linéaire sur les cinq secondes de chaque appel,
et un simple ajustement de droite suffit.

Le suivi de la fréquence centrale des deux raies donne des ajustements très propres, avec un résidu d'environ
6 Hz — largement sous l'écart de 2030 Hz entre les tons, donc sans conséquence pour la décision binaire :

| Salve | Fenêtre temporelle | Fréquence centrale au début | Dérive Doppler |
| --- | --- | --- | --- |
| 1 (témoin) | 15,0 – 27,9 s | 11 196 Hz | +0,4 Hz/s (nulle) |
| Appel 2 | 41,7 – 46,5 s | 14 151 Hz | −55,8 Hz/s |
| Appel 3 | 88,3 – 93,0 s | 11 215 Hz | −66,2 Hz/s |
| Appel 4 | 134,9 – 139,8 s | 8 252 Hz | −53,1 Hz/s |

La dérive nulle de la salve 1 n'est pas un détail : elle confirme par la mesure ce que l'énoncé suggérait —
elle vient du sol et sert de référence. Les trois autres dérives, elles, ont la bonne tête pour un passage LEO
(quelques dizaines de Hz/s à ces fréquences).

## La salve qui répond à toutes les questions (étape 4 : le témoin)

Un flux de bits démodulé peut être lu de huit façons différentes selon trois choix indépendants : les bits
sont-ils inversés ? le codage en ligne est-il NRZ (le niveau code directement le bit) ou NRZI (c'est la
transition qui code le bit, convention courante en radio) ? les octets s'assemblent-ils bit de poids faible
d'abord (LSB) ou bit de poids fort d'abord (MSB) ? Se tromper sur un seul de ces trois choix donne du bruit.
2×2×2 = 8 combinaisons possibles.

Plutôt que de deviner, la salve 1 sert de témoin : on essaie les huit combinaisons et on garde celle qui
produit du texte lisible.

```text
convention retenue : bits inversés, NRZ, LSB first
  ... 7E 7E 7E 7E 7E 7E 7E 7E 7E 7E 7E 7E 7E 7E 7E 7E 7E 7E 7E
  CHANDELIER-7\nSTATUS=GROUND CALIBRATION\n
  7E 7E 7E 7E 7E ...
```

Le message apparaît en clair — « CHANDELIER-7 / STATUS=GROUND CALIBRATION », un message d'étalonnage — encadré
de fanions HDLC `0x7E` (même protocole de trames que dans OST1 : fanions `01111110`, bit stuffing), et répété
huit fois sur les treize secondes de la salve. À partir de là, toute la chaîne de démodulation est validée :
les mêmes réglages sont appliqués aux trois appels, sans plus jamais avoir à douter de la convention. (Dans
OST1, sans témoin, cette même question avait coûté 20 minutes de tâtonnement.)

**Pourquoi c'est important.** Un témoin, c'est un morceau du problème dont on connaît la réponse. Il permet de
séparer les erreurs de réglage des erreurs de compréhension. Sans lui, quand le décodage des appels 2 à 4 ne
donne rien, impossible de savoir si la démodulation est mauvaise ou si c'est le format qui n'est pas compris.
Avec lui, cette question est définitivement réglée — et toute erreur ultérieure est forcément une erreur de
compréhension, ce qui divise l'espace de recherche par deux.

## Trois appels troués font un message entier (étape 5)

Les trois appels contiennent, après démodulation, le marqueur de synchronisation CCSDS `1A CF FC 1D` (le motif
de 32 bits présenté dans le write-up Silent Beacon : la « ligne de déchirure » qui marque le début d'un paquet
dans un flux continu) — aux bits 68, 66 et 76 de chaque flux. On aligne les trois flux sur ce marqueur : il
donne un repère commun et exact, indépendant des petites dérives d'horloge entre émissions.

Une fois alignés, les trois appels concordent à 89–90 % par paire. Le point important n'est pas ce pourcentage
mais où se situent les désaccords : deux des trois appels comportent une zone muette — 139 symboles effacés
pour l'appel 2, 141 pour l'appel 4 — et ces zones ne sont pas au même endroit. Sur les 1410 positions, aucune
n'est muette sur deux appels à la fois : 1130 positions sont couvertes par les trois appels, les 280 restantes
par deux. Là où l'un se tait, les deux autres parlent.

Le profil de désaccord est sans ambiguïté : les différences se concentrent dans deux plages étroites, et dans
chacune, un seul appel diverge des deux autres. C'est exactement la définition d'effacements complémentaires —
« three fractured calls make one ».

![Les trois appels alignés sur l'ASM, symbole par symbole : en rouge, les zones muettes (139 symboles pour l'appel 2, 141 pour l'appel 4). Aucune position n'est muette sur deux appels à la fois — des effacements strictement complémentaires.](/images/writeups/glittercity-ost2/fig2.jpg)

**Erreurs vs effacements, et pourquoi le vote majoritaire est exact ici.** En théorie des communications, une
erreur est un bit faux (on ne sait pas où elle est), un effacement est un bit manquant ou illisible (on sait
où il est). Ici, les zones muettes sont des effacements localisés. Avec trois copies et au plus un effacement
à chaque position, deux copies au moins sont toujours correctes : leur vote l'emporte systématiquement sur la
copie fautive. Le vote majoritaire n'est donc pas une approximation — c'est une reconstruction exacte, garantie
par la structure des données.

Contrôle indépendant : une combinaison « souple », qui pondère chaque appel par sa puissance reçue au lieu de
voter à main levée, donne le même résultat à un octet près sur 159. Deux méthodes différentes qui convergent,
c'est une preuve, pas une impression.

Le paquet reconstruit se lit alors sans effort :

```text
1A CF FC 1D | 00 9F  D9 FD  11 1D | 56 08 42 76 90 D5 ... (159 octets)
    ASM     |     en-tête CCSDS    |   payload
  APID              = 0x09F = 159
  compteur de séq.  = 6653
  longueur annoncée = 4382 octets  (le message est tronqué : on n'en a que 159)
```

L'en-tête annonce 4382 octets de données, mais le paquet reçu n'en contient que 159 — le satellite mort a été
tronqué en pleine émission. Ce détail comptera à l'étape 8.

## Brûler le voile (étape 6 : le XOR)

**Le chiffrement XOR.** Le XOR (« ou exclusif », noté `^`) est l'opération binaire qui vaut 1 quand les deux
bits d'entrée diffèrent. Sa propriété magique : `message ^ clé ^ clé = message` — appliquer deux fois la même
clé revient au point de départ. C'est le cadenas le plus simple du monde : on XOR le message avec une clé pour
le verrouiller, on re-XOR avec la même clé pour le déverrouiller. Ici la clé est répétée en boucle :
`6A FA 6A FA ...`.

L'énoncé donne la clé : 27386 (le numéro NORAD d'Envisat) en hexadécimal vaut `0x6AFA`, « high byte first ».
Mais une clé devinée à partir d'un jeu de mots reste une hypothèse. On peut faire mieux que d'y croire : on
peut la prouver.

**Le piège à éviter : l'entropie ne sert à rien ici.** Le réflexe crypto standard face à une clé inconnue de
16 bits : tester les 65536 clés possibles et garder celle qui minimise l'entropie du résultat — l'entropie
mesure le « désordre » d'un texte, et un message clair est en général moins désordonné qu'un chiffré. Sauf que
ça ne marche pas ici, et pour une raison structurelle : un XOR par une constante est une simple permutation
des valeurs d'octets (chaque valeur `v` devient `v ^ clé`). L'histogramme des valeurs est donc identique à
l'ordre près, et l'entropie — qui ne regarde que l'histogramme — est exactement la même pour les 65536 clés.
Le critère ne peut pas discriminer. Une heure perdue à le vérifier de toutes les manières possibles (entropie
de Shannon, par blocs, taux de compression en témoin) avant d'admettre que le critère est structurellement
aveugle.

Il faut un critère sensible à la structure interne des octets, pas à leur distribution. Le popcount — le
nombre total de bits à 1 — en est un : si le clair est une image creuse (quelques traits sur fond noir), il
aura beaucoup moins de bits à 1 qu'un résultat aléatoire. Sur les 65536 clés de 16 bits, `0x6AFA` est le
minimum global : 417 bits à 1, contre environ 636 attendus au hasard.

![Nombre de bits à 1 après XOR, pour chacune des 65536 clés de 16 bits : 0x6AFA est le minimum global (417 bits à 1, contre ~636 attendus au hasard).](/images/writeups/glittercity-ost2/fig3.jpg)

La clé déduite de l'énoncé est donc confirmée indépendamment par les données. Et au passage, ce test apprend
quelque chose de décisif sur le clair : avec 417 bits à 1 sur 1272, soit 2,6 bits par octet, ce n'est ni du
texte (~5 à 6 bits/octet) ni des données compressées (proche de 8). C'est quelque chose de creux — une image,
par exemple.

## Le satellite dessine (étape 7 : « it speaks in lines »)

C'est ici que le challenge se joue vraiment. Le clair est une pluie d'impulsions isolées : les plages de bits
à 1 font presque toutes un seul bit de long. Plusieurs pistes tentantes se présentent, et toutes sont fausses :

- **Du morse ?** Les silences de 1, 3 et 7 unités y font penser (voir le write-up Beaconing). Mais le morse
  exige des durées d'émission de 1 et 3 unités dans des proportions comparables — points et traits. Ici : 229
  impulsions d'un bit contre 11 de trois bits. Ce n'est pas du morse. Rejeté.
- **Du vectoriel ?** Interpréter les octets comme des coordonnées (x, y) et relier les points. Le rendu est un
  griffonnage sans structure. Rejeté.
- **Un bitmap colonne par colonne ?** 159 octets de 8 bits empilés font une bande de 8 pixels de haut — le
  format classique des polices d'afficheurs LCD. Le rendu est du bruit. Rejeté.

La bonne piste vient d'une mesure, pas d'une intuition. Raisonnement : si « it speaks in lines » veut dire que
le message est une image tracée ligne par ligne (comme un fax ou un écran cathodique : on parcourt chaque
ligne de gauche à droite, puis on descend), alors deux lignes successives se ressemblent souvent — des
caractères identiques aux mêmes colonnes, des zones vides communes. Le flux de bits doit donc contenir des
répétitions dont la période est la largeur de l'image. On cherche la plus longue sous-chaîne répétée :

```text
plus longue répétition trouvée : 34 impulsions consécutives identiques
   première occurrence : bit 724
   seconde  occurrence : bit 903
   écart               : 179 bits   <-- la largeur de l'image
1272 bits disponibles / 179 = 7,1  ->  raster de 179 x 7 pixels
```

Un `reshape(7, 179)` — on replie le flux de 1272 bits en une grille de 7 lignes de 179 — et l'image apparaît.
C'est ça, « it speaks in lines » : le satellite n'envoie plus des lettres codées en ASCII, il les dessine,
ligne de balayage après ligne de balayage, dans une police 5×7 (chaque caractère fait 5 pixels de large, 7 de
haut — la police standard des vieux afficheurs).

![Le raster reçu : 179 x 7 pixels, police 5x7, un pixel de blanc entre les caractères. Les 16 premiers pixels n'ont jamais été émis : le début apparaît décapité.](/images/writeups/glittercity-ost2/fig4.jpg)

On comprend aussi pourquoi les balayages de largeurs « de 8 à 250 » tentés précédemment n'avaient rien donné :
ils testaient bien 179, mais sans critère automatique pour reconnaître le bon résultat — et une image de 7
pixels de haut noyée au milieu de 240 rendus ratés passe inaperçue. Une heure et demie de balayage visuel pour
rien. La période de répétition, elle, désigne la bonne largeur du premier coup.

## Lire, puis prouver (étape 8)

Le raster reconstruit fait 179 pixels de large, 7 de haut, un pixel de blanc entre les caractères. Le drapeau
se lit directement... sauf trois caractères. La transmission commence en effet en cours de première ligne —
souvenez-vous, le paquet était tronqué : les 16 premiers pixels de l'image, le haut du S, du T et du A, n'ont
jamais été émis. Le début du drapeau apparaît décapité, ce qui est déroutant tant que l'origine du phénomène
n'est pas comprise.

Plutôt que de conclure à vue, le test inverse a le mérite de pouvoir échouer : on extrait la police des 26
caractères parfaitement lisibles, on redessine avec elle la chaîne supposée complète, on la remet en forme de
flux de bits, et on la compare au clair réel :

```text
raster resynthétisé pour la chaîne lue à l'œil : 7 x 179 = 1253 pixels
partie réellement transmise (l'image démarre au pixel 16) : 1237 pixels
comparaison bit à bit avec le clair : 1237 / 1237  =  100,0000 %
bits restants dans le payload       : 35 bits de bourrage
```

Correspondance parfaite sur la totalité des pixels transmis. Ce n'est plus une lecture, c'est une
vérification : si un seul caractère avait été mal identifié, le taux de correspondance se serait effondré. À
100,0000 %, il n'y a plus de place pour le doute.

Un piège de saisie à retenir pour la fin : le préfixe s'écrit en capitales, et le corps contient une double
lettre facile à confondre avec un chiffre.

## Les impasses — et leur facture

| Impasse | Pourquoi on y tombe | Ce qui la tue | Temps perdu |
| --- | --- | --- | --- |
| Combiner les trois appels au niveau symbole | C'est le niveau où l'on raisonne naturellement. | Les trois horloges dérivent légèrement les unes par rapport aux autres. Il faut aligner sur l'ASM, qui donne un repère commun et exact. | ~45 min |
| Chercher la station sol par le Doppler | Le Doppler est mesurable, donc on a envie de l'exploiter. | Le Doppler sert ici uniquement à être retiré. La trajectoire ne porte aucune information. | ~30 min |
| Minimiser l'entropie pour trouver la clé XOR | C'est le réflexe crypto standard. | L'entropie est invariante par XOR constant : le critère ne peut pas discriminer, donc il ne teste rien. | ~1 h |
| Balayer 240 largeurs de bitmap à l'œil | « speaks in lines » suggère bien une image. | Sans critère automatique, le bon rendu passe inaperçu. La période de répétition donne la largeur directement. | ~1 h 30 |
| Croire le champ « longueur = 4382 » | C'est écrit dans l'en-tête CCSDS. | Le paquet est tronqué à l'émission. Les 159 octets reçus contiennent déjà tout le message ; il ne manque que 16 pixels. | inclus ci-dessus |

Total : environ 3 h 45 perdues sur 6 h de solve. C'est le prix normal d'un challenge de ce calibre — et c'est
précisément le temps dont aucun solve « propre » ne parle jamais.

## La morale de l'histoire

- **Un critère de validation doit pouvoir échouer :** l'entropie ne pouvait pas discriminer les clés XOR ; le
  popcount, si. Un test incapable d'échouer ne produit que de la fausse confiance.
- **Un témoin vaut mieux que huit hypothèses :** la salve de calibration sol a fixé définitivement la
  convention de bits, ce qui a permis de ne plus jamais y revenir.
- **Mesurer plutôt que balayer :** le débit (300 bauds) et la largeur de l'image (179 pixels) ont été obtenus
  par une mesure directe, là où un balayage exhaustif avait échoué.
- **La géométrie d'un signal se lit dans ses répétitions :** une image tracée ligne par ligne se répète à la
  période de sa largeur. C'est vrai pour un raster, un fax, une trame vidéo.
- **L'énoncé est un mode d'emploi, mais pas intégralement :** trois phrases décrivaient trois étapes réelles ;
  deux autres n'étaient que du décor. Savoir trier fait partie de l'exercice.

Et le fantôme d'Envisat avait une dernière chose à dire avant de retourner au silence :
`STARPWN{THIS_WAS_OFF_TOO_MUCH}`, validé sur la plateforme. Vérification bit à bit : 1237/1237 pixels (100 %) ;
clé XOR confirmée par balayage exhaustif.
