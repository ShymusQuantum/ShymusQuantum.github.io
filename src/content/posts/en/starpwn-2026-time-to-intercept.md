---
title: "Time to Intercept: Hohmann transfer and orbital phasing"
description: "A TCP service, two numbers to return: the manoeuvre's delta-v and, above all, the exact burn time."
date: 2026-08-09
event: Starpwn CTF 2026
category: Space Operations
kind: writeup
tags: [starpwn-2026, orbital-mechanics, hohmann, phasing]
image: /images/writeups/time-to-intercept/fig1.en.jpg
imageAlt: "Hohmann transfer: the transfer ellipse between the low orbit and the target orbit"
---

**CTF:** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Category:** Space Operations
**Interface:** a TCP service (netcat, not a website) · **Status:** full method

One satellite must reach another: manoeuvre from a low circular orbit up to the target's orbit and **arrive at
the right place at the right time**. The challenge is not a file, it is a network service that poses an encoded
scenario (your altitude, the target's, the current phase angle) and expects two numbers.

A small reminder that served me the first time: a `host:port` is not necessarily a website. Many CTF services are
raw TCP sockets; you connect with `nc host port` or a script, and the server talks in text.

## The Hohmann transfer

To move from a low circular orbit to a higher circular orbit, the cheapest manoeuvre in fuel is the Hohmann
transfer. One burn places the craft on an ellipse whose perigee touches the departure orbit and whose apogee
touches the arrival orbit. You travel half the ellipse — exactly 180° — which takes half the period of that
ellipse.

![Hohmann transfer: the burn injects onto the ellipse, the apogee touches the target orbit](/images/writeups/time-to-intercept/fig1.en.jpg)

## The real core: phasing

Computing the delta-v is not enough. Arriving on the right orbit while the target is on the other side of the
Earth is useless. You have to burn at the instant when the target has, ahead of you, the **angular lead** that
will bring it to the rendezvous exactly when you get there.

![At burn the target must have the lead theta; half a period later the two meet](/images/writeups/time-to-intercept/fig2.en.jpg)

The rendezvous is at apogee, 180° from the burn point. During the transfer time, the target (angular velocity ω₂)
covers ω₂·t_t. So it must sit, at burn, at θ = π − ω₂·t_t ahead of us. Our low orbit turns faster (ω₁ > ω₂), so
the gap evolves at the rate ω₁ − ω₂: we wait until it reaches θ.

## The formulas, and a verifiable solver

With μ = 398,600.44 km³/s², R = 6,371 km, r₁ = R + h₁, r₂ = R + h₂:

```python
from math import pi, sqrt, tau

MU, R_E = 398_600.44, 6_371.0

def intercept(h1, h2, phi0):
    r1, r2 = R_E + h1, R_E + h2
    a = (r1 + r2) / 2                                  # semi-major axis of the ellipse
    dv = sqrt(MU * (2 / r1 - 1 / a)) - sqrt(MU / r1)   # first burn (km/s)
    t_t = pi * sqrt(a**3 / MU)                         # transfer time
    w1, w2 = sqrt(MU / r1**3), sqrt(MU / r2**3)        # angular velocities
    theta = (pi - w2 * t_t) % tau                      # required lead of the target
    wait = ((phi0 - theta) % tau) / (w1 - w2)          # wait time before the burn
    return dv * 1000, wait                             # m/s, s
```

## Validate on a known case

Before trusting the script, I test it on the transfer tabulated everywhere: low orbit at 300 km up to
geostationary (35,786 km), whose reference first burn is ~2,440 m/s.

```text
LEO 300 km -> GEO 35786 km :
  first burn computed : 2427.7 m/s   (reference ~2440 m/s)  OK
  transfer time       : 18982 s = 5.27 h                    OK
```

The ~12 m/s gap comes from the choice of Earth radius (6,371 vs 6,378 km) and stays within tolerance. The method
is validated before even connecting. One practical subtlety remains: the sign convention of the phase angle the
server returns. Depending on whether it counts the target ahead or behind, you sometimes have to try θ then −θ;
my script tries both ways, within the attempts allowed per connection. You return the pair `delta_v wait_time`
(typical tolerances ±10 m/s and ±60 s).

## What I take away

- **A `host:port` address is not necessarily a website.** Many CTF services are TCP sockets.
- **Orbital computation is two problems.** Hohmann gives the *how much* (delta-v), phasing the *when*. Forgetting
  the second misses the target even with the right delta-v.
- **Validate on a known case before the real one.** Checking LEO→GEO (~2,428 m/s) guarantees a refusal comes from
  a sign convention, not a wrong formula.
