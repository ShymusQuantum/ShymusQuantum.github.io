---
title: "Glittercity OST1: FSK under Doppler hidden in a synthwave track"
description: "An ISS TLE as a decoy, a signal in phase opposition, HDLC at 300 baud and a majority vote."
date: 2026-08-09
event: Starpwn CTF 2026
category: Space Comms & RF
kind: writeup
tags: [starpwn-2026, rf, fsk, doppler, hdlc, steganography]
image: /images/writeups/glittercity-ost1/fig2.jpg
imageAlt: "L-R channel spectrogram: two FSK tones sliding down under the Doppler effect"
---

**CTF:** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Challenge author:** Visionspace
**Category:** Space Communications & RF · **File:** `Glittercity-OST1.mp3` (stereo, 48 kHz, 3 min) · **Status:** solved

A synthwave soundtrack, nothing odd to the ear. But the ID3 tags are chatty: title "Capture-7", artist
"PRISMANTIR", and a comment holding a **TLE** for a satellite called CHANDELIER-7.

```text
CHANDELIER-7
1 25544U 98067A   26207.41084145  .00010751  00000+0  20166-3 0  9995
2 25544  51.6317 105.9876 0006941 339.4731  20.5977 15.49181604577830
```

## Defusing the decoy

Once you have spent time around TLEs, `25544` jumps out: it is the NORAD number of the **International Space
Station**. Inclination 51.6°, 15.49 revolutions per day, it all fits. "CHANDELIER-7" is just a disguise.

That TLE opens a tempting dead end: propagate the orbit, geolocate the ground station via Doppler, check that the
altitude comes out around 415 km… except the ISS is **always** around 415 km. That criterion cannot fail, so it
proves nothing. I set the TLE aside and listen to the file.

## The L-R channel

Faced with a stereo file, my first reflex is the channel difference. A signal injected in phase opposition
(identical on the left, inverted on the right) cancels in L+R, so in mono and by ear, but comes out at full
strength in L−R, where the music shared by both tracks fades away.

```python
import numpy as np, soundfile as sf
x, fs = sf.read("Glittercity-OST1.mp3")
d = x[:, 0] - x[:, 1]
```

![Power 7.5-15 kHz: nothing in L+R, a signal 25 dB stronger in L-R between 15 and 105 s](/images/writeups/glittercity-ost1/fig1.jpg)

## Reading the spectrogram

![L-R channel: two parallel lines ~2 kHz apart, sliding from 14.2/12.2 kHz down to 10/8 kHz](/images/writeups/glittercity-ost1/fig2.jpg)

Three facts read directly:

1. **Two alternating tones**, constant ~2 kHz spacing: FSK.
2. **A steady downward slide** of both lines: the Doppler signature of a transmitter moving away during its pass.
3. **A single** continuous 90-second burst.

## Removing the Doppler, then deciding

Since only one tone is active at a time, the instantaneous frequency follows a slowly drifting baseline (the
Doppler) with a small up/down jump on top (the bit). A running median over several symbols captures the drift;
what remains after subtraction is the FSK jump, whose sign gives the bit. That is **dechirping**: bringing a
sliding carrier back to a fixed reference.

```python
from scipy.signal import hilbert, medfilt
phase = np.unwrap(np.angle(hilbert(d)))
f_inst = np.diff(phase) * fs / (2 * np.pi)
baseline = medfilt(f_inst, 5 * 160 + 1)     # ~5 symbols at 300 baud
bits = (f_inst - baseline) > 0
```

The baud rate is measured from the symbol durations: **300 baud** (160 samples at 48 kHz). The reading
conventions remain; I try the combinations and keep the one that yields text: **inverted bits, LSB-first bytes**.

## Deframing the HDLC

The stream is split into HDLC frames bounded by the flag `0x7E` (`01111110`). So a flag never appears inside the
data, the transmitter inserts a 0 after five consecutive 1s (*bit stuffing*), which the receiver removes. This is
the same framing as the AX.25 used by a large share of amateur CubeSats.

```text
CHANDELIER-7
FLAG=STARPWN{Syn7h_v1be$_fr0m_0rb1t}
```

## Redundancy as proof

The message repeats frame after frame. On a noisy Doppler link, each copy has its errors, but never at the same
positions. A majority vote character by character wipes them out.

![Four raw copies of the flag, errors in red at different positions, and the majority vote](/images/writeups/glittercity-ost1/fig3.jpg)

```text
STARPWN{Syn7h_v1be$_fr0m_0rb1t}
```

Typing: `Syn7h` with a 7, `v1be$` with a 1 and a dollar, zeros in `fr0m_0rb1t`.

## What I take away

- **A criterion that cannot fail proves nothing.** The "consistent" ISS altitude was false confidence.
- **Stereo file: look at L-R first.**
- **Measure the modulation rather than guess it.** Two tones, a slope, a symbol duration: the spectrogram gives everything.
- **Redundancy is proof.** A flag from a vote over dozens of frames owes nothing to luck.
