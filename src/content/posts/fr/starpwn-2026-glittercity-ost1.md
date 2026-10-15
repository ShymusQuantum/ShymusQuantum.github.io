---
title: "Glittercity OST1 : du FSK sous Doppler caché dans une piste synthwave"
description: "Un TLE de l'ISS en leurre, un signal en opposition de phase, du HDLC à 300 bauds et un vote majoritaire."
date: 2026-08-19
event: Starpwn CTF 2026
category: Space Comms & RF
kind: writeup
tags: [starpwn-2026, rf, fsk, doppler, hdlc, steganography]
image: /images/writeups/glittercity-ost1/fig2.jpg
imageAlt: "Spectrogramme du canal L-R : deux raies FSK qui glissent sous l'effet Doppler"
---

**CTF :** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Auteur du challenge :** Visionspace
**Catégorie :** Space Communications & RF · **Fichier :** `Glittercity-OST1.mp3` (stéréo, 48 kHz, 3 min) · **Statut :** résolu

Une bande-son synthwave, rien d'anormal à l'écoute. Mais les tags ID3 sont bavards : titre « Capture-7 »,
artiste « PRISMANTIR », et un commentaire qui contient un **TLE** pour un satellite baptisé CHANDELIER-7.

```text
CHANDELIER-7
1 25544U 98067A   26207.41084145  .00010751  00000+0  20166-3 0  9995
2 25544  51.6317 105.9876 0006941 339.4731  20.5977 15.49181604577830
```

<div style="margin:30px 0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel)">
  <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--line)">
    <div>
      <strong style="color:var(--head);font-family:var(--f-display);letter-spacing:.02em">Writeup complet — PDF</strong>
      <div style="color:var(--muted);font-size:.82rem;margin-top:2px">4 pages · français</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a href="/writeups-pdf/glittercity-ost1.pdf" target="_blank" rel="noopener" style="padding:9px 15px;border-radius:8px;background:var(--accent);color:#06101f;text-decoration:none;font:600 .82rem var(--f-display)">Plein écran ↗</a>
      <a href="/writeups-pdf/glittercity-ost1.pdf" download style="padding:9px 15px;border-radius:8px;border:1px solid var(--line);color:var(--fg);text-decoration:none;font:600 .82rem var(--f-display)">Télécharger</a>
    </div>
  </div>
  <object data="/writeups-pdf/glittercity-ost1.pdf#view=FitH" type="application/pdf" style="width:100%;height:600px;display:block;background:#06101f;border:0">
    <p style="padding:22px;margin:0;color:var(--muted)">Ton navigateur n'affiche pas le PDF ici — <a href="/writeups-pdf/glittercity-ost1.pdf" style="color:var(--accent)">ouvre-le dans un onglet</a>.</p>
  </object>
</div>
