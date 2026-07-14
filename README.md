# UNBROKEN // HEIR

UNBROKEN is a desktop-first 2D boss-arena prototype. You are the current challenger: survive HEIR's readable attack, decide whether to spend your dash on an aggressive punish or keep it for safety, and leave a victory behind for the next version to inherit.

## Status

- **Version:** `0.6.0` Combatants Forged, shipped and verified publicly.
- **Goal:** make the challenger and HEIR read as constructed machines while preserving the proven 2D fight, collision, camera, controls, and combat grammar.
- **Next checkpoint:** `0.7.0` HEIR Citadel Authority — replace the remaining turbine/flower read with the heavier interlocking citadel silhouette established by the concepts, without changing combat.
- **Verified locally:** 35 automated checks, five reproducible Blender sprites, a complete real-input V.01 → V.37 run through `LAST CONQUEROR`, 390×844 mobile width, reduced motion, and a 180-frame pressure sample at 7.5ms p95 / 7.9ms maximum with zero missed frames.

This build is deliberately client-only and on rails. The audience, queue, challengers, and post-victory evolution are simulated presentation—not a live multiplayer service or trained AI.

**Project dossier:** [public companion site](https://zambrini.github.io/unbroken/project/) · [director’s devlog](DEVLOG.md) · [public source](https://github.com/Zambrini/unbroken)

## Play

```bash
npm ci
npm run dev
```

Use Node `22.23.1` (recorded in `.node-version`), then open [http://localhost:5173/unbroken/](http://localhost:5173/unbroken/).

Use the on-screen start button once. Audio unlock is attempted from that gesture, but unavailable or suspended audio never blocks play.

### Controls

- `WASD` or arrow keys — move
- Mouse — aim
- Hold left mouse button — fire
- `Space` — dash toward movement/aim direction
- `M` — mute/unmute audio
- `R` — retry after defeat

Mobile and touch devices receive the spectator presentation only; touch gameplay is outside this slice.

## The slice

1. Enter a 45-second round against `HEIR // V.01` after a three-second countdown.
2. Start outside the dashed `BREAK RANGE`, read a dashed magenta warning contained by the octagonal floor, and evade the solid red attack while your full collider stays outside HEIR's layered 132-unit hull.
3. During the short opening, walk into range safely or commit a dash to arrive sooner. The dash then remains unavailable for 2.4 seconds, into the next active threat.
4. Land shots on the exposed 20-unit white core. Armor-only shots ricochet with `CORE MISSED`; being in range alone is not enough.
5. Defeat V.01 and watch the local simulation jump forward to evolved `HEIR // V.37: DASH CATCH`.
6. Face a second 45-second pressure round in which HEIR marks the likely dash endpoint, then win the recorded-champion payoff. Defeat retries the current round rather than resetting the run.

Warnings are deterministic and readable: dashed magenta means queued danger; solid red means active damage; white means a vulnerable target; cyan belongs to the challenger.

## Debug and spectator routes

- `?debug=entry` — opening/entry state
- `?debug=pressure` — evolved `DASH CATCH` pressure state
- `?debug=payoff` — victory/payoff state
- `?debug=run` — full-flow QA; preserves challenger integrity only
- `?spectator=1` — read-only auto-played spectator presentation
- `?motion=reduce` — freezes nonessential venue motion for review
- `?profile=1` — records a normalized 180-frame pacing sample on the canvas

Examples: [entry](http://localhost:5173/unbroken/?debug=entry), [pressure](http://localhost:5173/unbroken/?debug=pressure), [payoff](http://localhost:5173/unbroken/?debug=payoff), [full-flow QA](http://localhost:5173/unbroken/?debug=run), [spectator](http://localhost:5173/unbroken/?spectator=1).

## Quality checks

```bash
npm test
npm run build
npm run check
npm run preview
```

## Project notes

- [Design](docs/DESIGN.md)
- [QA acceptance record](docs/QA.md)
- [Roadmap](ROADMAP.md)
- [Changelog](CHANGELOG.md)
- [Director's devlog](DEVLOG.md)
- [`0.6.0` checkpoint evidence](docs/checkpoints/0.6.0/README.md)
- [Companion website](public/project/index.html)
- Concept screens: [entry](docs/concepts/01-entry-v01.png), [dash counter](docs/concepts/02-dash-counter.png), [DASH CATCH](docs/concepts/03-dash-catch-v37.png)

## Deliberately excluded from `0.6.0`

Runtime 3D, real networking, a global queue, accounts, chat, AI training,
server persistence, matchmaking, controller/touch play, broad progression,
multiple modes, multiple bosses, inventories, cosmetics, content catalogs, and
frame-by-frame AI control.
