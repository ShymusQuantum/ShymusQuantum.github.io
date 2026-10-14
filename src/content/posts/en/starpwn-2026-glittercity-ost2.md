---
title: "Glittercity OST2: three fractured calls, a 179 x 7 pixel image"
description: "The 500-point RF challenge: calibration witness, ASM, majority vote, XOR proven by popcount, and a flag drawn line by line."
date: 2026-08-24
event: Starpwn CTF 2026
category: Space Comms & RF
kind: writeup
featured: true
tags: [starpwn-2026, rf, fsk, doppler, ccsds, xor, envisat]
image: /images/writeups/glittercity-ost2/fig1.en.jpg
imageAlt: "L-R channel spectrogram: one horizontal calibration burst then three sliding calls"
---

**CTF:** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Challenge author:** Visionspace
**Category:** Space Communications & RF · **500 points** · **File:** `Glittercity-OST2.mp3` · **Status:** solved

This is the challenge that resisted me the most, and the one I am most pleased with. Everything is in the brief,
as long as you read it as a procedure:

> The grid goes dark. Before shutdown, you swept the final useful arc over the Mojave just below one meter.
> The dish was tracking a dead machinery that once watched the whole planet, now drifting as one of the
> largest ghosts in orbit. The receiver came back. Dead-Eye calling. Trying to reach back home.
> **Three fractured calls make one. It has forgotten letters, now it speaks in lines. Burn away the
> repeating veil forged from its number, high byte first.** Find the ghost. Recover the message.

## Decoding the brief

| Fragment | What I read from it |
| --- | --- |
| "dead machinery that once watched the whole planet… largest ghosts in orbit" | **Envisat**: 8 tonnes, ESA Earth-observation satellite, contact lost in April 2012, one of the largest debris objects in low orbit. NORAD **27386**. |
| "Three fractured calls make one" | Three copies of the same message, each punched out in a different place: to recombine, not concatenate. |
| "It has forgotten letters, now it speaks in lines" | The message is not ASCII: it is an image drawn line by line. |
| "repeating veil forged from its number, high byte first" | XOR with a repeated key: 27386 = `0x6AFA`, so `6A FA 6A FA…` |

"Mojave" (Goldstone) and "just below one meter" (a wavelength, so a band above 300 MHz) are decoration. Knowing
what to ignore is part of the job.

## The full chain

```text
Glittercity-OST2.mp3 (stereo, 48 kHz, 2 min 21 s)
 ├─ 1. L-R channel           -> 4 hidden FSK bursts
 ├─ 2. run lengths           -> 160 samples/symbol = 300 baud
 ├─ 3. Doppler dechirp       -> removes -53 to -66 Hz/s
 ├─ 4. FSK demodulation      -> bits (inverted, NRZ, LSB first)
 ├─ 5. burst 1 = witness     -> "CHANDELIER-7 / STATUS=GROUND CALIBRATION"
 ├─ 6. align on the ASM      -> 1A CF FC 1D in calls 2, 3, 4
 ├─ 7. majority vote         -> 1 CCSDS packet, 159-byte payload
 ├─ 8. XOR 6A FA             -> a very sparse plaintext (2.6 one-bits per byte)
 ├─ 9. period = 179 bits     -> raster 179 x 7
 └─ 10. read + prove         -> STARPWN{THIS_WAS_OFF_TOO_MUCH}
```

## 1. Surfacing the signal

Same trick as OST1: `d = L - R`. The spectrogram already answers two questions.

![L-R channel: four bursts, the first horizontal, the three others sloping](/images/writeups/glittercity-ost2/fig1.en.jpg)

There are **four bursts**, not three. And the first is perfectly horizontal while the other three slide. A
transmitter without Doppler is a stationary transmitter: burst 1 comes **from the ground**.

## 2. Measure before decoding

The golden rule in RF: you do not guess a modulation, you measure it.

- **Modulation:** two lines, one active at a time, never both off. FSK, not morse.
- **Spacing:** ~2,030 Hz, constant across the four bursts.
- **Baud rate:** I demodulate roughly, split into same-value runs and look at their lengths.

```text
most frequent run lengths (samples):
  160 -> 396x   320 -> 191x   480 -> 45x   960 -> 67x
all multiples of 160  =>  48000 / 160 = 300 baud
```

No need to sweep hundreds of candidate baud rates.

## 3. Removing the Doppler

An FSK demodulator expects its tones at fixed frequencies. I track the center frequency of the two lines on each
burst, fit a line, and multiply the signal by the complex exponential that cancels the drift.

| Burst | Window | Center frequency at start | Drift |
| --- | --- | --- | --- |
| 1 (witness) | 15.0 – 27.9 s | 11,196 Hz | +0.4 Hz/s (null) |
| Call 2 | 41.7 – 46.5 s | 14,151 Hz | −55.8 Hz/s |
| Call 3 | 88.3 – 93.0 s | 11,215 Hz | −66.2 Hz/s |
| Call 4 | 134.9 – 139.8 s | 8,252 Hz | −53.1 Hz/s |

Residual of about 6 Hz after the fit, against 2,030 Hz between the tones: harmless. Burst 1's null drift confirms
by measurement what I suspected.

## 4. The witness burst

A demodulated stream can be read **eight ways**: bits inverted or not, NRZ or NRZI, bytes LSB or MSB first. One
mistake and you get noise. Rather than guess, I use the ground burst as a witness and try all eight combinations:

```text
chosen convention: inverted bits, NRZ, LSB first
  ... 7E 7E 7E 7E 7E 7E 7E 7E ...
  CHANDELIER-7\nSTATUS=GROUND CALIBRATION\n
  7E 7E 7E 7E ...
```

Plaintext, HDLC flags, repeated eight times. The whole chain is validated, and I never had to doubt the
convention again. It is the same logic as a calibration sequence before a measurement campaign: a piece of the
problem whose answer you know separates setup errors from understanding errors.

## 5. "Three fractured calls make one"

The three calls contain the CCSDS ASM `1A CF FC 1D`, at bits 68, 66 and 76. I align the three streams on it. They
agree to 90–94 %, but what matters is **where** they disagree.

![The three calls zoomed in: each has a silent zone, never in the same place](/images/writeups/glittercity-ost2/fig2.en.jpg)

Complementary erasures: where one call goes silent, the other two speak. With three copies and at most one
erasure per position, two copies are always correct. **The majority vote is not an approximation, it is the exact
reconstruction.** Cross-check: a combination weighted by the received power of each call gives the same result to
within one byte out of 159.

```text
1A CF FC 1D | 00 9F D9 FD 11 1D | 56 08 42 76 90 D5 ... (159 bytes)
    ASM     |  CCSDS header     |  payload
APID = 0x09F (159)   counter = 6653   announced length = 4382 (truncated)
```

## 6. Burning the veil, and proving it

The brief gives `0x6AFA`. But a key taken from a pun stays a hypothesis. The crypto reflex would be to try all
65,536 keys and minimize entropy: **useless**. A XOR by a constant permutes the byte values, the histogram is the
same up to order, entropy is identical for every key. The criterion cannot discriminate.

You need a criterion sensitive to the internal structure of the bytes. The **popcount** (number of one-bits) is
one: if the plaintext is a sparse image, it will be much lower with the right key.

```python
import numpy as np
c = np.frombuffer(payload, np.uint8)
def ones(key):
    k = np.resize(np.array([key >> 8, key & 0xFF], np.uint8), c.size)
    return np.unpackbits(c ^ k).sum()
best = min(range(1 << 16), key=ones)    # 0x6AFA, 417 one-bits
```

![Popcount for all 65,536 keys: 0x6AFA is the global minimum, 417 against ~636 at random](/images/writeups/glittercity-ost2/fig3.en.jpg)

The brief's key is confirmed by the data. And 417 one-bits out of 1,272, i.e. 2.6 per byte: this is neither text
nor compressed data. It is **sparse**.

## 7. "It speaks in lines"

This is where the challenge is won. The plaintext is a shower of isolated pulses. I lost time on tempting leads,
all wrong:

- **Morse?** The 1-, 3- and 7-unit silences suggest it, but 229 one-bit pulses against 11 three-bit ones: no dashes. Rejected.
- **Vector drawing?** Linking the bytes as coordinates only gives a scribble. Rejected.
- **A column-by-column 8-pixel bitmap?** Noise. Rejected.
- **Sweep widths from 8 to 250 by eye?** 179 was in the lot, but buried among 240 failed renders.

The right lead came from a measurement. An image drawn line by line has successive lines that resemble each
other: the stream must **repeat with a period equal to the width**. I look for the longest repeated substring:

```text
longest repeat: 34 identical pulses
  1st occurrence : bit 724
  2nd occurrence : bit 903
  gap            : 179 bits   <- image width
1272 / 179 = 7.1  ->  raster 179 x 7
```

A `reshape(7, 179)` and the image appears, in a 5 x 7 font:

![The reconstructed raster: STARPWN{THIS_WAS_OFF_TOO_MUCH}](/images/writeups/glittercity-ost2/fig4.en.jpg)

It is the same principle as a fax or a weather-satellite APT image: geometry reads in the repetitions.

## 8. Read, then prove

Three characters are a problem: the transmission starts mid-first-line, so the first 16 pixels (the top of the
S, T and A) were never sent. Rather than conclude by eye, I run the test that can fail: I extract the font from
the 26 readable characters, redraw the assumed string, turn it back into a bit stream and compare it to the
plaintext.

```text
raster resynthesized for STARPWN{THIS_WAS_OFF_TOO_MUCH} : 7 x 179 = 1253 pixels
part actually transmitted (starts at pixel 16)          : 1237 pixels
bit-for-bit match                                       : 1237 / 1237 = 100 %
remaining bits                                          : 35 padding bits
```

One wrong character and the rate would have collapsed.

```text
STARPWN{THIS_WAS_OFF_TOO_MUCH}
```

`OFF` is written with two capital F's, not a zero.

## The dead ends

| Dead end | Why you fall for it | What kills it |
| --- | --- | --- |
| Combine the calls at symbol level | It is the level where you naturally reason | The clocks drift; the ASM gives an exact common reference |
| Locate the station via Doppler | The Doppler is measurable | It only serves to be removed |
| Minimize entropy for the key | Standard crypto reflex | Entropy is invariant under a constant XOR |
| Sweep 240 widths by eye | "speaks in lines" suggests an image | The repeat period gives the width |
| Trust the 4,382-byte length | It is in the header | The packet is truncated; 159 bytes are enough |

## What I take away

- **A validation criterion must be able to fail.** Entropy could not, popcount could.
- **A witness beats eight hypotheses.** The ground burst fixed the convention once and for all.
- **Measure rather than sweep.** The baud rate and the width came from direct measurements.
- **The geometry of a signal reads in its repetitions.** Raster, fax, video frame: same principle.
- **The brief is a manual, but not entirely.** Three useful sentences, two of decoration.
