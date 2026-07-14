# `0.3.0` — Actor Authority

Shipped on 2026-07-14 as the third bounded director checkpoint.

## Player-visible result

HEIR now reads as an arena-dominating machine rather than a thin diagram. V.01
uses a larger layered armored hull and a physical core socket; V.37 inherits
that structure, then adds filled mutation emitters and thin energy rails. The
challenger carries a stronger layered silhouette, and each committed dash leaves
directional ghosts and a brighter streak. A core hit resolves in a 75ms
white/cyan punch using the existing boss flash.

The visual mass remains honest to the fight. HEIR's body radius grows from 96 to
132 units, so the full 14-unit challenger collider stops 146 units from center.
That leaves a 124-unit punish band inside the 270-unit `BREAK RANGE`. Attack
scripts, timing, damage, camera, controls, and HUD are unchanged.

## Evidence

- `actor-entry.png` — V.01 and the challenger establish the larger layered
  silhouettes at the start of the same fixed-camera fight.
- `dash-commit.png` — the strengthened challenger, directional ghosts, and
  streak make the aggressive route into the opening physically legible.
- `core-impact.png` — the open socket and exposed core resolve a landed shot
  with the 75ms white/cyan impact punch.
- `body-exclusion.png` — the challenger's full collider stops outside HEIR's
  132-unit body, matching the visible hull.
- `pulse-body-edge.png` — the lethal pulse remains fully visible above HEIR's
  ground shadow at the closest legal challenger position.
- `precision-miss.png` — armor-only aim still ricochets without damaging HEIR.
- `v37-pressure.png` — the inherited V.37 rig, filled emitters, and thin energy
  rails retain attack readability during `DASH CATCH` pressure.
- `full-payoff.png` — a real-input V.01 → V.37 run reaches `LAST CONQUEROR`;
  debug support stabilized challenger integrity but never damaged or advanced
  HEIR.
- `mobile-spectator.png` — the larger actors remain readable in the read-only
  390×844 spectator presentation.
- Automated suite — 26/26 checks pass. The combat contract requires full
  collider clearance and at least 120 units of usable punish band.
- Render sample — 180 V.37 pressure frames measured 8.33ms mean, 9.2ms p95,
  and 9.4ms maximum frame interval.

This checkpoint deepens only the visual and physical authority of the existing
actors. It adds no attack, boss version, mode, progression, networking, account,
content catalog, or AI system.
