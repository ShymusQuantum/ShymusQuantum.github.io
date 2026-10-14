---
title: "Starry hacks: the supply chain of a flight software stack"
description: "Why a too-permissive version constraint in requirements.txt is an attack surface, and how the LEO contact window changes everything."
date: 2026-09-10
event: Starpwn CTF 2026
category: Supply chain
kind: writeup
tags: [starpwn-2026, supply-chain, dependencies, flight-software]
image: /images/writeups/starry-hacks/fig1.en.jpg
imageAlt: "Diagram of the attack chain, from requirements.txt to onboard execution"
---

**CTF:** Starpwn CTF 2026 (DEF CON 34, Aerospace Village) · **Category:** Supply chain
**Files:** an archive of the flight-software repo + a web instance (Mission Control) · **Status:** solved

This challenge asks for no buffer overflow and no broken cipher. It asks you to understand how the flight
software fetches its dependencies, and why that implicit trust is an **attack surface** in its own right. It is
the same mechanism that hit SolarWinds and dozens of very real npm and PyPI packages: you do not break the
application, you poison an upstream brick.

## The weak point: a version constraint

The flight software delegates command handling to an external library
(`from cubesat_upstream_driver import handle_command`), and its `requirements.txt` asks for:

```text
cubesat-upstream-driver >= 1.0.0
```

That `>=` is the heart of the problem. It accepts **any higher version**. In an ecosystem where the installed
artifact comes from a feedable repository, an artificially higher version wins over the legitimate one at install
time. The defensive best practice would have been to pin an exact version and verify the artifact's integrity
(hash, signature), exactly what SLSA recommends for a build chain.

## The return channel

Reading `main.py`, you see that everything the dependency returns is re-emitted into telemetry:

```python
driver_reply = handle_command(cmd)
if driver_reply:
    return f"TM|EVENT|COMMAND_ACK|{driver_reply}"
```

In other words, the library's output leaves the satellite in a `COMMAND_ACK` message. It is this coupling — an
unverified dependency whose output is echoed to the ground — that turns a simple version constraint into a full
execution path.

## The full chain

![Diagram: from the permissive requirements.txt to onboard execution during a contact window](/images/writeups/starry-hacks/fig1.en.jpg)

The most interesting part is not the attack itself but its **space constraints**, and that is where I stumbled
several times:

| Obstacle hit | The lesson |
| --- | --- |
| The build rejects a lone module | Error messages are hints: the HTTP 500 describes exactly the expected package structure (a folder with `__init__.py`). Reading the error means being handed the fix. |
| Clicking RESET afterwards | RESET restores the original environment and undoes everything. In ops, a clean rollback is a defense; here you had to understand what it restored. |
| Nothing runs | A LEO satellite is only reachable during its passes over the station (`link: true` in the orbital view). While the link is down, no command goes out. |
| Searching blind | Better to first have the directory list surface in telemetry, to locate the target before aiming at it. |

## What I take away

- **Implicit trust in dependencies is an attack surface.** A `>=` constraint, a feedable repository and an
  automatic build together form an execution path, without any memory exploit. Defense side: pin versions, verify
  signatures, isolate the build.
- **Error messages are hints.** The expected structure was spelled out in the build error.
- **Space realism is part of the puzzle.** The contact window is not decoration: a LEO satellite only listens for
  a few minutes per pass. The *when* matters as much as the *what*.
