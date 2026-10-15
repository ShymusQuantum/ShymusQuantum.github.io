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

<div style="margin:30px 0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel)">
  <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--line)">
    <div>
      <strong style="color:var(--head);font-family:var(--f-display);letter-spacing:.02em">Writeup complet — PDF</strong>
      <div style="color:var(--muted);font-size:.82rem;margin-top:2px">4 pages · français</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a href="/writeups-pdf/starry-hacks.pdf" target="_blank" rel="noopener" style="padding:9px 15px;border-radius:8px;background:var(--accent);color:#06101f;text-decoration:none;font:600 .82rem var(--f-display)">Plein écran ↗</a>
      <a href="/writeups-pdf/starry-hacks.pdf" download style="padding:9px 15px;border-radius:8px;border:1px solid var(--line);color:var(--fg);text-decoration:none;font:600 .82rem var(--f-display)">Télécharger</a>
    </div>
  </div>
  <object data="/writeups-pdf/starry-hacks.pdf#view=FitH" type="application/pdf" style="width:100%;height:600px;display:block;background:#06101f;border:0">
    <p style="padding:22px;margin:0;color:var(--muted)">Ton navigateur n'affiche pas le PDF ici — <a href="/writeups-pdf/starry-hacks.pdf" style="color:var(--accent)">ouvre-le dans un onglet</a>.</p>
  </object>
</div>
