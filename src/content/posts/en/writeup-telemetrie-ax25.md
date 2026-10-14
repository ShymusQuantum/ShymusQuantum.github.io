---
title: "Writeup: a CubeSat's hidden telemetry"
description: "Demodulating a 1200 baud AFSK recording, extracting AX.25 frames and finding the flag."
date: 2026-10-10
category: CTF
kind: writeup
tags: [ctf, ax25, afsk, sdr]
---

> Example writeup: it shows how to publish a CTF solution (the `kind: writeup` field).

## the challenge

We get `pass.wav`, an audio recording of a CubeSat pass. The flag is hidden in the telemetry.

## 1. identify the modulation

The spectrogram shows two tones at **1200 Hz** and **2200 Hz**: this is **1200 baud AFSK**,
the classic modulation of amateur packet radio.

## 2. demodulate

```bash
sox pass.wav -t raw -r 22050 -e signed -b 16 -c 1 - | multimon-ng -t raw -a AFSK1200 -
```

## 3. read the AX.25 frames

`multimon-ng` prints the decoded frames. One of them carries a base64 payload:

```text
AFSK1200: fm CUBE-1 to CQ UI^ pid=F0
Q1RGe2V4ZW1wbGVfZmxhZ30=
```

```bash
echo 'Q1RGe2V4ZW1wbGVfZmxhZ30=' | base64 -d   # CTF{exemple_flag}
```
