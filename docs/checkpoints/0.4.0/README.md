# `0.4.0` — Threat Containment

Shipped on 2026-07-14 as the fourth bounded director checkpoint.

## Player-visible result

Every existing threat now belongs to the visible octagonal combat floor. Pulse,
lance, compression, and `DASH CATCH` forecast and active effects render through
a dedicated hazard mask and stop at the arena wall instead of crossing into the
audience or event UI. A foreground containment rail keeps that edge crisp under
bloom.

The visual boundary remains honest: the same octagonal polygon defines the
floor, mask, and rail, and every position reachable by the challenger's full
collider remains inside it. Attack order, timing, damage, collision, safe
answers, camera, controls, HUD, and actor rendering are unchanged.

## Evidence

- `pulse-telegraph-contained.png` — the queued pulse remains a clean dashed
  magenta arena signal.
- `pulse-edge-contained.png` — the expanding red pulse meets the octagonal wall
  without spilling into the surrounding event presentation.
- `lance-telegraph-contained.png` — long dashed lance forecasts terminate at
  the visible arena boundary.
- `lance-active-contained.png` — active lance bloom stays inside the same
  boundary while its lethal lane remains fully readable.
- `compression-active-contained.png` — the closing red walls retain their safe
  central answer and stop cleanly at the floor edge.
- `dash-catch-telegraph-contained.png` — the predicted endpoint cross is locked,
  contained, and leaves a legible redirection answer.
- `dash-catch-contained.png` — V.37 pressure combines its active sweep and queued
  endpoint lanes without leaking into the audience or scoreboard.
- `full-payoff.png` — a real-input V.01 → V.37 run reaches `LAST CONQUEROR`;
  V.37 fell in 11.83 seconds across two total attempts and two dash commits.
  Debug support restored challenger integrity only and never damaged or advanced
  HEIR.
- `mobile-spectator.png` — the contained threat grammar remains readable in the
  read-only 390×844 presentation with a 390-pixel scroll width.
- Automated suite — 28/28 checks pass. New contracts freeze the authored attack
  signatures and prove that every reachable player circle remains inside the
  visible hazard mask.
- Runtime QA — the production build passes on Node 22.23.1; desktop and mobile
  produced zero console errors, and reload produced zero failed or status-400+
  requests.
- Render sample — 180 V.37 pressure frames measured 8.329ms mean, 9.1ms p95,
  and 9.4ms maximum frame interval.

This checkpoint deepens only the visual ownership and readability of the
existing attacks. It adds no attack, boss version, mode, progression,
networking, account, content catalog, or AI system.
