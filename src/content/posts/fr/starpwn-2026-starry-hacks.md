---
title: "Starry hacks : la chaîne d'approvisionnement d'un logiciel de vol"
description: "Pourquoi une contrainte de version trop permissive dans requirements.txt est une surface d'attaque, et comment la fenêtre de liaison LEO change tout."
date: 2026-09-10
event: Starpwn CTF 2026
category: Supply chain
kind: writeup
tags: [starpwn-2026, supply-chain, dependances, flight-software]
image: /images/writeups/starry-hacks/fig1.jpg
imageAlt: "Schéma de la chaîne d'attaque, du requirements.txt à l'exécution à bord"
---

**CTF :** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Catégorie :** Supply chain
**Fichiers :** une archive du dépôt du logiciel de vol + une instance web (Mission Control) · **Statut :** résolu

Ce challenge ne demande ni débordement de tampon ni cassage de chiffrement. Il demande de comprendre comment
le logiciel de vol récupère ses dépendances, et pourquoi cette confiance implicite est une **surface d'attaque**
à part entière. C'est le même mécanisme qui a frappé SolarWinds et des dizaines de paquets npm et PyPI bien
réels : on ne casse pas l'application, on empoisonne une brique en amont.

## Le point faible : une contrainte de version

Le logiciel de vol délègue le traitement des commandes à une bibliothèque externe
(`from cubesat_upstream_driver import handle_command`), et son `requirements.txt` demande :

```text
cubesat-upstream-driver >= 1.0.0
```

Ce `>=` est le cœur du problème. Il accepte **n'importe quelle version supérieure**. Dans un écosystème où
l'artefact installé vient d'un dépôt alimentable, une version artificiellement plus haute l'emporte sur la
version légitime à l'installation. La bonne pratique défensive aurait été d'épingler une version exacte et de
vérifier l'intégrité de l'artefact (hash, signature), exactement ce que recommande SLSA pour une chaîne de build.

## Le canal de retour

En lisant `main.py`, on voit que tout ce que renvoie la dépendance est réémis dans la télémétrie :

```python
driver_reply = handle_command(cmd)
if driver_reply:
    return f"TM|EVENT|COMMAND_ACK|{driver_reply}"
```

Autrement dit, la sortie de la bibliothèque ressort du satellite dans un message `COMMAND_ACK`. C'est ce couplage
— une dépendance non vérifiée dont la sortie est renvoyée au sol — qui transforme une simple contrainte de
version en chemin d'exécution complet.

## La chaîne complète

![Schéma : du requirements.txt permissif à l'exécution à bord pendant une fenêtre de liaison](/images/writeups/starry-hacks/fig1.jpg)

La partie la plus intéressante n'est pas l'attaque elle-même mais ses **contraintes spatiales**, et c'est là que
j'ai buté plusieurs fois :

| Obstacle rencontré | La leçon |
| --- | --- |
| Le build refuse un module isolé | Les messages d'erreur sont des indices : le HTTP 500 décrit exactement la structure de paquet attendue (un dossier avec `__init__.py`). Lire l'erreur, c'est se faire dicter la correction. |
| Cliquer RESET après coup | RESET restaure l'environnement d'origine et annule tout. En ops, un rollback propre est une défense ; ici il fallait comprendre ce qu'il restaurait. |
| Rien ne s'exécute | Un satellite LEO n'est joignable que pendant ses passages au-dessus de la station (`link: true` dans la vue orbitale). Tant que la liaison est coupée, aucune commande ne part. |
| Chercher à l'aveugle | Mieux vaut d'abord faire remonter la liste des répertoires dans la télémétrie, pour localiser la cible avant de la viser. |

## Ce que j'en retiens

- **La confiance implicite dans les dépendances est une surface d'attaque.** Une contrainte `>=`, un dépôt
  alimentable et un build automatique forment ensemble un chemin d'exécution, sans le moindre exploit mémoire.
  Côté défense : épingler les versions, vérifier les signatures, isoler le build.
- **Les messages d'erreur sont des indices.** La structure attendue était écrite dans l'erreur du build.
- **Le réalisme spatial fait partie du puzzle.** La fenêtre de liaison n'est pas un décor : un satellite LEO
  n'écoute que quelques minutes par passage. Le *quand* compte autant que le *quoi*.
