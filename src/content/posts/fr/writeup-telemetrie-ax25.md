---
title: "Writeup : la télémétrie cachée d'un CubeSat"
description: "Démoduler un enregistrement AFSK 1200 bauds, extraire les trames AX.25 et trouver le flag."
date: 2026-10-10
category: CTF
kind: writeup
tags: [ctf, ax25, afsk, sdr]
---

> Writeup d'exemple : il montre comment publier une solution de CTF (champ `kind: writeup`).

## l'énoncé

On reçoit `pass.wav`, l'enregistrement audio d'un passage de CubeSat. Le flag est caché dans la télémétrie.

## 1. identifier la modulation

Le spectrogramme montre deux tons à **1200 Hz** et **2200 Hz** : c'est de l'**AFSK 1200 bauds**,
la modulation classique du packet radio amateur.

## 2. démoduler

```bash
sox pass.wav -t raw -r 22050 -e signed -b 16 -c 1 - | multimon-ng -t raw -a AFSK1200 -
```

## 3. lire les trames AX.25

`multimon-ng` affiche les trames décodées. L'une d'elles contient une charge utile en base64 :

```text
AFSK1200: fm CUBE-1 to CQ UI^ pid=F0
Q1RGe2V4ZW1wbGVfZmxhZ30=
```

```bash
echo 'Q1RGe2V4ZW1wbGVfZmxhZ30=' | base64 -d   # CTF{exemple_flag}
```
