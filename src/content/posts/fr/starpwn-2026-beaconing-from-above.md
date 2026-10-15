---
title: "Beaconing from above : lire une balise morse au chronomètre"
description: "Un fichier audio, un ton à 600 Hz et une seule mesure à faire : la durée de l'unité morse."
date: 2026-08-13
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

## Le phare qui bipe

Un satellite émet une balise : un signal répétitif qu'il envoie en permanence pour signaler sa présence et
son identité — l'équivalent du feu clignotant d'un phare maritime, mais en radio. La station sol l'a
enregistrée dans un simple fichier audio. Le message est là, audible ; il suffit de savoir l'écouter. À
l'oreille, on entend une série de bips courts et longs séparés de silences : du code morse.

## 1,8 million de nombres qui bavardent (c'est quoi, un .wav ?)

Un fichier WAV, c'est juste une longue liste de nombres. Le micro (ou le récepteur radio) mesure l'amplitude
du signal 22 050 fois par seconde — c'est la fréquence d'échantillonnage, 22 050 Hz — et note chaque mesure.
Nos 82,4 secondes représentent donc environ 1,8 million de nombres. Tout le travail va consister à faire
parler cette liste de nombres, sans jamais avoir besoin de l'écouter.

## Le décodeur à oreilles (~20 min perdues)

Premier réflexe, le mauvais : décoder à l'oreille. Dix minutes à réécouter la boucle en notant les points et
les traits sur papier, avant de se rendre à l'évidence — à 12 mots par minute, l'oreille suit, mais la
transcription manuelle de 82 secondes est un festival d'erreurs, et une seule erreur dans un flag le rend
invalide.

Deuxième mauvaise idée : coller l'audio dans un décodeur morse en ligne. La plupart attendent du vrai texte
et s'effondrent sur du leet speak (`B34C0N`), et leurs seuils automatiques se dérèglent sur les silences.
Encore dix minutes parties.

La bonne approche est la mesure, pas l'écoute — et elle prend cinq minutes une fois qu'on s'y résout. La
suite déroule cette approche étape par étape.

## Bip, biiip : tout est une question de durées

**Le morse est un code temporel à une seule fréquence.** Il ne module ni une fréquence ni une phase : il
allume et éteint un sifflement unique (la « porteuse »). Toute l'information est dans les durées. Prenons
l'exemple le plus connu : `SOS` se note `... --- ...` — trois bips courts, trois bips longs, trois bips
courts. Il y a donc deux durées d'émission — le point (1 unité de temps) et le trait (3 unités) — et trois
durées de silence : 1 unité entre deux symboles d'une même lettre, 3 unités entre deux lettres, 7 unités
entre deux mots.

Conséquence pratique : décoder du morse, ce n'est pas du traitement du signal compliqué. C'est mesurer une
seule durée de référence (l'unité), puis classer chaque bip et chaque silence comme multiple de cette unité.
Tout le challenge tient dans cette phrase.

## Le prisme du son (étape 1 : trouver LE sifflement — la FFT)

Première question : le signal contient-il un seul sifflement (compatible morse) ou plusieurs (autre
modulation) ? Pour y répondre, on utilise une FFT (Fast Fourier Transform). L'idée : n'importe quel son peut
être vu comme une superposition de notes pures, comme un accord de piano est une superposition de touches.
La FFT est le prisme qui décompose le signal en ses notes : en entrée, les 1,8 million de nombres ; en
sortie, la puissance présente à chaque fréquence.

Sur quelques secondes de signal actif, la FFT montre une seule bosse nette à 600 Hz — un ton unique, ce qui
confirme le morse. Une modulation comme le FSK (qu'on rencontrera dans les write-ups OST1 et OST2) montrerait
deux bosses. Il n'y a donc rien à « démoduler » au sens radio du terme : il suffit de suivre l'enveloppe du
signal, c'est-à-dire son amplitude au cours du temps, pour savoir à chaque instant si le sifflement est
allumé ou éteint.

Concrètement : on prend la valeur absolue du signal (le « redressement »), on la lisse sur quelques
millisecondes, et on obtient une courbe douce qui monte quand le ton sonne et redescend pendant les silences.
Un seuil à mi-hauteur tranche : au-dessus, « ton actif » ; en dessous, « silence ». Sur les six premières
secondes, la structure de bips longs et courts est déjà lisible à l'œil sur cette enveloppe.

![Les six premières secondes : signal brut, enveloppe lissée et seuil. Les zones jaunes sont les tons actifs ; la structure point/trait se lit déjà à l'œil.](/images/writeups/beaconing-from-above/fig1.jpg)

## 100 millisecondes qui changent tout (étape 2 : mesurer l'unité)

On découpe maintenant l'enveloppe en plages ON (ton actif) et OFF (silence) consécutives, et on mesure la
durée de chacune. Puis on regarde la distribution de ces durées — en clair, on compte combien de fois chaque
durée apparaît. C'est LA mesure qui débloque tout : si le signal est bien du morse, les durées ne prennent
qu'un petit nombre de valeurs, dans les rapports 1 : 3 : 7 vus plus haut.

Résultat : les durées des tons se rangent sur trois valeurs nettes, 100 ms (le point), 300 ms (le trait —
exactement 3×100, le rapport canonique) et 700 ms (7×100) pour une quinzaine de tons étirés qui reviennent à
intervalles réguliers. Les silences, eux, ne prennent que deux valeurs : 100 ms (entre deux symboles d'une
même lettre) et 300 ms (entre deux lettres).

![Distribution des durées : trois pics pour les tons (100, 300 et 700 ms — point, trait, et le ton étiré qui marque la fin des mots), deux pour les silences (100 et 300 ms) — les rapports 1:3:7 du morse.](/images/writeups/beaconing-from-above/fig2.jpg)

Petite bizarrerie qui a son importance pour la suite : il n'y a pas de silence inter-mot. Cette balise marque
la fin de ses mots par un ton étiré de 7 unités au lieu d'un silence de 7 unités — le séparateur est émis
plutôt que tu. C'est une convention qu'on rencontre sur les keyers automatiques de certaines balises
radioamateur, et il faut le savoir pour ne pas lire ce ton long comme un trait aberrant.

La distribution est donc parfaitement nette — des pics bien séparés, sans rien entre eux. C'est la signature
du morse, et elle donne gratuitement l'unité : 100 ms. Au passage, ça correspond à environ 12 mots par
minute, la cadence typique d'un opérateur radioamateur tranquille. La formule dite « PARIS » le calcule : le
mot PARIS fait exactement 50 unités, donc vitesse = 1,2 / durée du point en secondes = 1,2 / 0,100 = 12.

Aucune ambiguïté pour la suite : les seuils de décision se placent d'eux-mêmes — 2 unités pour séparer point
et trait, 2 unités pour séparer les deux types de silences, et tout ton au-delà de 5 unités est un séparateur
de mot.

## Et le dictionnaire fit le reste (étape 3 : décoder)

Il ne reste que de la comptabilité. Chaque bip devient un point ou un trait selon sa durée ; les symboles
sont regroupés en lettres aux silences de 3 unités, et les lettres en mots aux tons étirés de 7 unités. La
table morse (`A = .-`, `B = -...`, etc.) fait le reste :

```text
VVV VVV VVV DE STARPWN STARPWN STARPWN
B34C0N D3C0D3D V14 R4D10
73 DE STARPWN K
```

**La grammaire radioamateur.** Le message n'est pas qu'un flag : c'est un vrai appel construit selon les
conventions du trafic radioamateur, héritées du télégraphe du XIXᵉ siècle. `VVV` est la séquence d'accord
classique : une série de « V » (`...-`) que l'opérateur envoie pour permettre au correspondant de régler sa
réception — l'équivalent du « un, deux, un, deux » au micro. `DE` signifie « de la part de » et introduit
l'indicatif de l'émetteur : « VVV DE STARPWN » se lit « appel de réglage, ici STARPWN ». `73` est un code
chiffré qui veut dire « meilleures salutations » (non, ce n'est pas une année). `K` signifie « à vous » : fin
de transmission, en attente d'une réponse. Quiconque a écouté une vraie balise de satellite (NOAA, AO-91...)
a entendu ces conventions. Leur présence confirme qu'on décode bien du morse radioamateur, et rassure sur la
segmentation avant même de lire le flag.

Le corps du message énonce le flag en clair, les espaces entre mots devenant les tirets bas : il suffit
d'enrouler le contenu dans le préfixe du CTF.

Piège de saisie habituel de ce CTF : le préfixe s'écrit en capitales, et le corps mélange lettres et chiffres
façon leet speak — le « 0 » de `C0N` et `R4D10` est un zéro, pas la lettre O. Un caractère confondu et la
plateforme refuse le flag.

```text
STARPWN{B34C0N_D3C0D3D_V14_R4D10}
```

## La morale de l'histoire

- **Caractériser avant de décoder :** une FFT (un seul ton → morse) et un histogramme de durées (deux valeurs
  en rapport 1:3 → point/trait) identifient la modulation et sa métrique sans écrire une ligne de décodeur.
- **Le morse est un code de durées, pas de fréquences :** toute la difficulté se réduit à mesurer une unité
  de temps ; le reste est une table de correspondance.
- **Le contexte fait partie du signal :** reconnaître `VVV`, `DE`, `73`, `K` confirme la bonne segmentation
  avant même de lire le flag.

Et la balise finit par décliner son identité, mot après mot, comme un phare qui donne son nom :
`STARPWN{B34C0N_D3C0D3D_V14_R4D10}`, validé sur la plateforme. Décodage obtenu par mesure directe de l'unité
morse (100 ms, ~12 mots/min) sur les 217 tons du fichier.
