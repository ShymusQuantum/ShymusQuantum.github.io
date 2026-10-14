---
title: "Reverse engineering et décodage des communications satellitaires"
description: "De l'écoute d'un satellite à la rétro-ingénierie des liaisons : antennes, SDR, APT météo, DVB-S2, protocoles spatiaux et sécurité des communications, bout à bout."
date: 2026-05-19
category: Satellites & Cybersécurité
kind: article
featured: true
tags: [satellites, sdr, dvb-s2, apt, reverse-engineering, protocoles, cybersécurité]
image: /images/posts/reverse-engineering-satellites.jpg
imageAlt: "Vaisseau Soyouz en orbite, la Terre en arrière-plan"
---

Ce rapport est la suite logique du précédent : après avoir posé l'architecture des réseaux
satellites, je passe à la pratique. Comment on écoute réellement un satellite, comment on récupère
son signal, et comment on le décode jusqu'à en extraire des données exploitables.

Je déroule toute la chaîne : le matériel minimal pour débuter l'écoute, le choix et le pointage des
antennes, les SDR, la poursuite des passages, puis le décodage concret — les images météo APT des
NOAA, les flux DVB-S2 extraits avec GNU Radio et dissectés sous Wireshark, les protocoles spatiaux
(CCSDS, CSP, AX.25) et, en fil rouge, la sécurité de ces liaisons : où elles se laissent intercepter,
analyser et rétro-concevoir.

Les schémas sont ceux de mes supports d'origine ; le texte, lui, est entièrement en français ici.

<div style="margin:30px 0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel)">
  <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--line)">
    <div>
      <strong style="color:var(--head);font-family:var(--f-display);letter-spacing:.02em">Rapport complet — PDF</strong>
      <div style="color:var(--muted);font-size:.82rem;margin-top:2px">56 pages · français</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a href="/reports/reverse-engineering-communications-satellitaires-fr.pdf" target="_blank" rel="noopener" style="padding:9px 15px;border-radius:8px;background:var(--accent);color:#06101f;text-decoration:none;font:600 .82rem var(--f-display)">Plein écran ↗</a>
      <a href="/reports/reverse-engineering-communications-satellitaires-fr.pdf" download style="padding:9px 15px;border-radius:8px;border:1px solid var(--line);color:var(--fg);text-decoration:none;font:600 .82rem var(--f-display)">Télécharger</a>
    </div>
  </div>
  <object data="/reports/reverse-engineering-communications-satellitaires-fr.pdf#view=FitH" type="application/pdf" style="width:100%;height:600px;display:block;background:#06101f;border:0">
    <p style="padding:22px;margin:0;color:var(--muted)">Ton navigateur n'affiche pas le PDF ici — <a href="/reports/reverse-engineering-communications-satellitaires-fr.pdf" style="color:var(--accent)">ouvre-le dans un onglet</a>.</p>
  </object>
</div>
