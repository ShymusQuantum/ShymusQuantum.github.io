---
title: "The attack surface of a ground station"
description: "Between the antenna and mission control, where can an attacker strike?"
date: 2026-10-05
category: Space security
tags: [space-security, ground-station, threat-model]
image: /images/posts/pose-longue.jpg
imageAlt: "Long exposure of the night sky with the bright trail of a satellite"
---

> Example post: replace it with your own research.

A satellite never works alone: it depends on a **ground segment** (antennas, modems, control
software) and on a radio **link** between the two. Each of these is a target.

## three segments, three surfaces

1. **The space segment**: the satellite itself, its flight software and its commands.
2. **The link**: jamming, replaying telecommands, listening to unencrypted telemetry.
3. **The ground segment**: often the most exposed, because it is connected to ordinary networks.

## going further

The Aerospace Corporation's [SPARTA](https://sparta.aerospace.org/) framework lists attack techniques
specific to space systems, in the style of MITRE ATT&CK.
