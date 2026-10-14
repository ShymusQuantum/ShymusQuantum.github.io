---
title: "Silent Beacon: the flag hidden in the housekeeping"
description: "124 CCSDS packets, a telemetry dictionary, and a mode field that steps outside its allowed range."
date: 2026-08-29
event: Starpwn CTF 2026
category: Space Operations
kind: writeup
tags: [starpwn-2026, ccsds, telemetry, forensics]
image: /images/writeups/silent-beacon/fig1.en.jpg
imageAlt: "Mode field across 89 packets: 29 clearly step outside the 0 to 7 range"
---

**CTF:** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Category:** Space Operations
**Files:** `capture.bin`, `packet_ids.txt`, `telemetry_dictionary.json` · **Status:** solved

A CubeSat goes quiet after an intrusion. The ground station caught its last burst of telemetry: 5,835 bytes of
CCSDS packets buried in "line noise". It was hiding something in its onboard data.

The first reflex I learned in ops: **read the documentation before the dump**. Two of the three files provided
are documentation. `packet_ids.txt` gives the sync marker and the subsystems, `telemetry_dictionary.json`
describes the housekeeping field by field, with the allowed value ranges. In a real mission, that is the
telemetry database: without it, a packet is just a run of bytes.

## Recap: a CCSDS packet

Satellites do not transmit neatly aligned bytes. The receiver sees a continuous stream and must find the start
of each frame via the **ASM** (Attached Sync Marker), a fixed 32-bit pattern that is always `1A CF FC 1D`
(defined in CCSDS 131.0-B). Behind it, the Space Packet primary header (CCSDS 133.0-B) is 6 bytes: the **APID**
on 11 bits (which subsystem is talking), a sequence counter and the data length.

The docs announce three APIDs: 50 (SYSLOG, free text), 100 (HK_NOMINAL, 14-byte payload) and 200 (ADCS_STATUS,
undocumented). Only APID 100 is described in the dictionary, so that is where I look.

## Resynchronizing on the ASM

The "line noise" in the brief is a vocabulary trap: it is not noise to filter, it is padding between packets.
Rather than read the file sequentially, I search for every occurrence of the ASM and parse the header that
follows.

```python
import struct

data = open("capture.bin", "rb").read()
ASM = bytes.fromhex("1ACFFC1D")
packets, i = [], data.find(ASM)
while i != -1:
    h = data[i + 4:i + 10]
    w0, seq, length = struct.unpack(">HHH", h)
    apid, count = w0 & 0x7FF, seq & 0x3FFF
    payload = data[i + 10:i + 10 + length + 1]
    packets.append((apid, count, payload))
    i = data.find(ASM, i + 4)
```

```text
ASM markers found: 124   packets parsed: 124
  APID 100 (HK_NOMINAL)  -> 89 packets   <- documented
  APID 200 (ADCS_STATUS) -> 21 packets   (decoy)
  APID 50  (SYSLOG)      -> 14 packets   (decoy)
```

The 89 housekeeping packets carry counters from 0 to 88, no gaps. Sorted by counter, they are in emission order.

## Looking for the rule violation

The dictionary says the `mode` field (offset 12) is between **0 and 7**: the eight flight modes (SAFE, NOMINAL,
SCIENCE…). In ops, that is exactly the kind of limit that raises an alarm on the ground. So I look for the
packets that violate it.

![The mode field across 89 packets: 60 in the green band, 29 out of range](/images/writeups/silent-beacon/fig1.en.jpg)

29 packets leave the range, and all their values land between 48 and 125: **printable ASCII**. The satellite
hijacked a numeric field to slip one character per packet.

```python
hk = sorted((p for p in packets if p[0] == 100), key=lambda p: p[1])
flag = "".join(chr(p[2][12]) for p in hk if p[2][12] > 7)
print(flag)   # STARPWN{h0us3k33p1ng_4n0m4ly}
```

## Prove rather than guess

A flag that falls out of a single criterion always leaves a doubt. The format offers a second, independent
witness: `error_flags` (offset 13), whose bit 7 is named `ANOMALY`. If both criteria point to the same packets,
it is no coincidence.

![Mode out of range (red) and ANOMALY bit (blue): the two curves overlap exactly](/images/writeups/silent-beacon/fig2.en.jpg)

```text
packets with mode > 7                         : 29
of which ANOMALY bit set                      : 29 / 29
healthy packets (mode <= 7) with ANOMALY set  : 0
```

Perfect overlap both ways. Two fields, two rules, the same designation.

```text
STARPWN{h0us3k33p1ng_4n0m4ly}
```

## What I take away

- **Side files are half the solution.** The ASM and the 0–7 range were written in plain sight.
- **A secret in telemetry betrays itself by violating declared rules.** That is also how you spot a real anomaly
  from the control room.
- **A validation criterion must be able to fail.** The ANOMALY bit could have failed to coincide; that it does
  turns a plausible reading into proof.
