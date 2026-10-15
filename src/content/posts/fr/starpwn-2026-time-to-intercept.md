---
title: "Time to Intercept : transfert de Hohmann et phasage orbital"
description: "Un service TCP, deux nombres à renvoyer : le delta-v de la manœuvre et surtout l'instant précis du tir."
date: 2026-09-04
event: Starpwn CTF 2026
category: Space Operations
kind: writeup
tags: [starpwn-2026, orbital-mechanics, hohmann, phasing]
image: /images/writeups/time-to-intercept/fig1.jpg
imageAlt: "Transfert de Hohmann : l'ellipse de transfert entre l'orbite basse et l'orbite de la cible"
---

**CTF :** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Catégorie :** Space Operations
**Interface :** un service TCP (netcat, pas un site web) · **Statut :** méthode complète

Un satellite doit en rejoindre un autre : manœuvrer depuis une orbite circulaire basse jusqu'à l'orbite de la
cible et **arriver au bon endroit au bon moment**. Le challenge n'est pas un fichier, c'est un service réseau
qui pose un scénario chiffré (ton altitude, celle de la cible, l'angle de phase actuel) et attend deux nombres.

Petit rappel qui m'a servi la première fois : un `host:port` n'est pas forcément un site web. Beaucoup de
services CTF sont des sockets TCP bruts ; on s'y connecte avec `nc host port` ou un script, le serveur dialogue
en texte.

<div style="margin:30px 0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel)">
  <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--line)">
    <div>
      <strong style="color:var(--head);font-family:var(--f-display);letter-spacing:.02em">Writeup complet — PDF</strong>
      <div style="color:var(--muted);font-size:.82rem;margin-top:2px">4 pages · français</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a href="/writeups-pdf/time-to-intercept.pdf" target="_blank" rel="noopener" style="padding:9px 15px;border-radius:8px;background:var(--accent);color:#06101f;text-decoration:none;font:600 .82rem var(--f-display)">Plein écran ↗</a>
      <a href="/writeups-pdf/time-to-intercept.pdf" download style="padding:9px 15px;border-radius:8px;border:1px solid var(--line);color:var(--fg);text-decoration:none;font:600 .82rem var(--f-display)">Télécharger</a>
    </div>
  </div>
  <object data="/writeups-pdf/time-to-intercept.pdf#view=FitH" type="application/pdf" style="width:100%;height:600px;display:block;background:#06101f;border:0">
    <p style="padding:22px;margin:0;color:var(--muted)">Ton navigateur n'affiche pas le PDF ici — <a href="/writeups-pdf/time-to-intercept.pdf" style="color:var(--accent)">ouvre-le dans un onglet</a>.</p>
  </object>
</div>
