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

<div style="margin:30px 0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel)">
  <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--line)">
    <div>
      <strong style="color:var(--head);font-family:var(--f-display);letter-spacing:.02em">Writeup complet — PDF</strong>
      <div style="color:var(--muted);font-size:.82rem;margin-top:2px">4 pages · français</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a href="/writeups-pdf/beaconing-from-above.pdf" target="_blank" rel="noopener" style="padding:9px 15px;border-radius:8px;background:var(--accent);color:#06101f;text-decoration:none;font:600 .82rem var(--f-display)">Plein écran ↗</a>
      <a href="/writeups-pdf/beaconing-from-above.pdf" download style="padding:9px 15px;border-radius:8px;border:1px solid var(--line);color:var(--fg);text-decoration:none;font:600 .82rem var(--f-display)">Télécharger</a>
    </div>
  </div>
  <object data="/writeups-pdf/beaconing-from-above.pdf#view=FitH" type="application/pdf" style="width:100%;height:600px;display:block;background:#06101f;border:0">
    <p style="padding:22px;margin:0;color:var(--muted)">Ton navigateur n'affiche pas le PDF ici — <a href="/writeups-pdf/beaconing-from-above.pdf" style="color:var(--accent)">ouvre-le dans un onglet</a>.</p>
  </object>
</div>
