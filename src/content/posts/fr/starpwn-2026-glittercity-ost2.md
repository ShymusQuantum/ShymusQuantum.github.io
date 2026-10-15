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

<div style="margin:30px 0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel)">
  <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--line)">
    <div>
      <strong style="color:var(--head);font-family:var(--f-display);letter-spacing:.02em">Writeup complet — PDF</strong>
      <div style="color:var(--muted);font-size:.82rem;margin-top:2px">8 pages · français</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a href="/writeups-pdf/glittercity-ost2.pdf" target="_blank" rel="noopener" style="padding:9px 15px;border-radius:8px;background:var(--accent);color:#06101f;text-decoration:none;font:600 .82rem var(--f-display)">Plein écran ↗</a>
      <a href="/writeups-pdf/glittercity-ost2.pdf" download style="padding:9px 15px;border-radius:8px;border:1px solid var(--line);color:var(--fg);text-decoration:none;font:600 .82rem var(--f-display)">Télécharger</a>
    </div>
  </div>
  <object data="/writeups-pdf/glittercity-ost2.pdf#view=FitH" type="application/pdf" style="width:100%;height:600px;display:block;background:#06101f;border:0">
    <p style="padding:22px;margin:0;color:var(--muted)">Ton navigateur n'affiche pas le PDF ici — <a href="/writeups-pdf/glittercity-ost2.pdf" style="color:var(--accent)">ouvre-le dans un onglet</a>.</p>
  </object>
</div>
