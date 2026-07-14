# `0.2.0` — Make the Punish Contract Real

Shipped on 2026-07-14 as the second bounded director checkpoint.

## Player-visible result

The challenger now starts outside `BREAK RANGE`, cannot walk or dash through
HEIR, and damages the boss only by landing a shot on the exposed 20-unit core.
Armor-only aim returns `CORE MISSED`. Walking into the opening preserves dash;
dashing in arrives sooner but starts a 2.4-second recovery that remains active
into the next threat. A dash used earlier to evade recovers before it.

## Evidence

- `stationary-out-of-range.png` — the initial position remains outside the dashed
  boundary with `ENTER BREAK RANGE` visible; passive fire does not create a
  punish.
- `walk-in-punish.png` — ordinary movement reaches the opening and earns a
  `CORE HIT` while dash remains ready.
- `dash-in-punish.png` — one committed dash reaches the opening sooner and earns
  a `CORE HIT` with recovery visibly underway.
- `dash-committed-next-threat.png` — the following active attack arrives while
  dash still shows `0.6s`, recording the cost of the aggressive route.
- `core-missed.png` and `core-hit.png` — the same opening records an armor-only
  shot doing zero damage, followed by centered fire damaging the core.
- `natural-payoff.png` — a real-input V.01 → V.37 run reaches `LAST CONQUEROR`;
  debug support preserved integrity but never damaged or advanced HEIR.
- Automated suite — 26/26 checks pass. Combat-contract checks cover the
  outside-range spawn, full-collider boss exclusion and dash tunneling, actual
  hit/miss/sealed/out-of-range shot outcomes, and recovery timing across every
  consecutive attack in both boss versions.

This checkpoint changes the depth of the existing dodge-and-punish loop only.
It adds no attack, mode, boss, progression, account, networking, or AI system.
