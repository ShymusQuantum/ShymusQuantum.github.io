---
title: "Reverse Engineering and Decoding of Satellite Communications"
description: "From listening to a satellite to reverse-engineering its links: antennas, SDR, NOAA APT weather imagery, DVB-S2, space protocols and communication security, end to end."
date: 2026-05-19
category: Satellites & Cybersecurity
kind: article
featured: true
tags: [satellites, sdr, dvb-s2, apt, reverse-engineering, protocols, cybersecurity]
image: /images/posts/reverse-engineering-satellites.jpg
imageAlt: "A Soyuz spacecraft in orbit, Earth in the background"
---

This report is the natural sequel to the previous one: having laid out the architecture of satellite
networks, I move on to practice — how you actually listen to a satellite, capture its signal, and
decode it all the way down to usable data.

I walk through the whole chain: the minimal gear to start listening, choosing and aiming antennas,
SDRs, tracking passes, then the hands-on decoding — NOAA APT weather images, DVB-S2 streams extracted
with GNU Radio and dissected in Wireshark, space protocols (CCSDS, CSP, AX.25) and, as a running
thread, the security of these links: where they can be intercepted, analysed and reverse-engineered.

The diagrams are from my original French slides; the text itself is fully in English here.

<div style="margin:30px 0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel)">
  <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--line)">
    <div>
      <strong style="color:var(--head);font-family:var(--f-display);letter-spacing:.02em">Full report — PDF</strong>
      <div style="color:var(--muted);font-size:.82rem;margin-top:2px">56 pages · English</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a href="/reports/reverse-engineering-satellite-communications-en.pdf" target="_blank" rel="noopener" style="padding:9px 15px;border-radius:8px;background:var(--accent);color:#06101f;text-decoration:none;font:600 .82rem var(--f-display)">Fullscreen ↗</a>
      <a href="/reports/reverse-engineering-satellite-communications-en.pdf" download style="padding:9px 15px;border-radius:8px;border:1px solid var(--line);color:var(--fg);text-decoration:none;font:600 .82rem var(--f-display)">Download</a>
    </div>
  </div>
  <object data="/reports/reverse-engineering-satellite-communications-en.pdf#view=FitH" type="application/pdf" style="width:100%;height:600px;display:block;background:#06101f;border:0">
    <p style="padding:22px;margin:0;color:var(--muted)">Your browser won't display the PDF here — <a href="/reports/reverse-engineering-satellite-communications-en.pdf" style="color:var(--accent)">open it in a new tab</a>.</p>
  </object>
</div>
