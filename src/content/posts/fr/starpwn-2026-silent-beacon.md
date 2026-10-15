---
title: "Silent Beacon : le flag caché dans le housekeeping"
description: "124 paquets CCSDS, un dictionnaire de télémétrie, et un champ « mode » qui sort de sa plage autorisée."
date: 2026-08-29
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

<div style="margin:30px 0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel)">
  <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--line)">
    <div>
      <strong style="color:var(--head);font-family:var(--f-display);letter-spacing:.02em">Writeup complet — PDF</strong>
      <div style="color:var(--muted);font-size:.82rem;margin-top:2px">4 pages · français</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a href="/writeups-pdf/silent-beacon.pdf" target="_blank" rel="noopener" style="padding:9px 15px;border-radius:8px;background:var(--accent);color:#06101f;text-decoration:none;font:600 .82rem var(--f-display)">Plein écran ↗</a>
      <a href="/writeups-pdf/silent-beacon.pdf" download style="padding:9px 15px;border-radius:8px;border:1px solid var(--line);color:var(--fg);text-decoration:none;font:600 .82rem var(--f-display)">Télécharger</a>
    </div>
  </div>
  <object data="/writeups-pdf/silent-beacon.pdf#view=FitH" type="application/pdf" style="width:100%;height:600px;display:block;background:#06101f;border:0">
    <p style="padding:22px;margin:0;color:var(--muted)">Ton navigateur n'affiche pas le PDF ici — <a href="/writeups-pdf/silent-beacon.pdf" style="color:var(--accent)">ouvre-le dans un onglet</a>.</p>
  </object>
</div>
