---
title: "Beaconing from above: reading a morse beacon with a stopwatch"
description: "An audio file, a 600 Hz tone and a single measurement to make: the duration of the morse unit."
date: 2026-08-09
event: Starpwn CTF 2026
category: Space Comms & RF
kind: writeup
tags: [starpwn-2026, rf, morse, cw, beacon]
image: /images/writeups/beaconing-from-above/fig2.en.jpg
imageAlt: "Histograms of tone and silence durations: two and three sharp peaks"
---

**CTF:** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Category:** Space Communications & RF
**File:** `beacon.wav` (mono, 22,050 Hz, 82.4 s) · **Status:** solved

A beacon is the first thing you listen for after a launch. Before telemetry, before the first contact, a
freshly deployed satellite often just repeats its callsign in morse: it is robust, it cuts through noise, and
any radio amateur can confirm the bird is alive. This challenge starts right there: the ground station recorded
the beacon, and it is on us to read it.

## What we hear

By ear there is no doubt: short beeps, long beeps, silences. CW. Before writing anything, I still check with an
FFT over a few seconds of active signal: **a single line, at 600 Hz**. No second tone, so no FSK. The signal is
a carrier switched on and off, nothing more.

That changes the nature of the problem. Morse encodes nothing in frequency or phase: **all the information is in
the durations**. Two emission durations (dot = 1 unit, dash = 3 units) and three silence durations (1 unit
between symbols, 3 between letters, 7 between words). Decoding means measuring one thing: the unit.

## Following the envelope

No need to demodulate. I rectify the signal, smooth it, and a threshold separates "tone on" from "silence".

![Envelope of the first six seconds: yellow zones are the active tones](/images/writeups/beaconing-from-above/fig1.en.jpg)

```python
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, filtfilt

fs, x = wavfile.read("beacon.wav")
x = x.astype(float) / np.abs(x).max()
b, a = butter(4, 50 / (fs / 2))           # low-pass on the rectified signal
env = filtfilt(b, a, np.abs(x))
on = env > 0.25 * env.max()
```

## Measuring the unit

I then split `on` into consecutive ON/OFF runs and look at the histogram of their durations. This is the
measurement that unlocks everything: if it is really morse, the durations take only a handful of values, in the
ratios 1 : 3 : 7.

![Tone durations (98 ms and 294 ms) and silences (98, 294 and ~686 ms)](/images/writeups/beaconing-from-above/fig2.en.jpg)

Bimodal for the tones, trimodal for the silences, exactly in the canonical ratios. **The unit is 98 ms**, about
**12 words per minute** with the PARIS convention (speed ≈ 1200 / dot duration in ms). The decision thresholds
set themselves: 2 units between dot and dash, 2 and 5 units for the silences.

## Decoding

With the unit in hand, the rest is a lookup table:

```text
VVV VVV VVV DE STARPWN STARPWN STARPWN
B34C0N D3C0D3D V14 R4D10
73 DE STARPWN K
```

What reassures me before I even read the flag is the **ham radio grammar**: `VVV` to tune the receiver, `DE`
before the callsign, `73` for best regards, `K` for "over". If my segmentation were wrong, those codes would
not come out this clean. The spaces in the body become underscores:

```text
STARPWN{B34C0N_D3C0D3D_V14_R4D10}
```

Watch the typing: the `0` in `C0N` and `R4D10` are zeros, not O's.

## What I take away

- **Characterize before decoding.** An FFT (one tone, so CW) and a histogram (1:3 ratio) are enough to identify
  the modulation and its metric, without a line of decoder.
- **Morse is a code of durations.** The whole difficulty boils down to measuring one time unit.
- **Context is part of the signal.** Recognizing `VVV`, `DE`, `73` and `K` is a free validation.
