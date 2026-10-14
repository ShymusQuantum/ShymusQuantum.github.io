---
title: "Receiving Meteor-M2 images with an RTL-SDR"
description: "Antenna, settings and decoding of an LRPT pass at 137 MHz, from your backyard."
date: 2026-10-12
category: Satellites
tags: [sdr, meteor-m2, lrpt, rtl-sdr]
image: /images/posts/meteor-waterfall.jpg
imageAlt: "Spectrogram of a Meteor-M2 pass: the LRPT signal band drifts with the Doppler effect"
featured: true
---

> Example post: it shows how to put an image at the top of a post (the `image` field).

The Russian **Meteor-M2** weather satellites continuously broadcast images of the Earth using
**LRPT**, a digital QPSK signal around **137 MHz**. With an RTL-SDR dongle and a home-made antenna,
you can receive them without any licence.

## the gear

| item | choice |
| --- | --- |
| receiver | RTL-SDR v4 |
| antenna | V-dipole, 53 cm elements at 120° |
| software | SatDump |

## reading the spectrogram

The image above is a *waterfall*: time goes down, frequency goes from left to right.
The signal band draws an S-shaped curve. That is the **Doppler effect**: the satellite comes closer
(higher frequency) then moves away (lower frequency), shifting by a few kHz at 137 MHz.

```bash
# example: record a pass as baseband
satdump record baseband --source rtlsdr --samplerate 1.024e6 \
  --frequency 137.9e6 --gain 38 --baseband_format cs16
```

## next

In a future post: decoding the recording and building the colour image.
