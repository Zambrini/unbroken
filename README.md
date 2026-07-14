# UNBROKEN // HEIR

UNBROKEN is a desktop-first 2D boss-arena prototype. You are the current challenger: survive HEIR's readable attack, decide whether to spend your dash on an aggressive punish or keep it for safety, and leave a victory behind for the next version to inherit.

## Status

- **Version:** `0.1.0` vertical slice
- **Goal:** prove the controls, fixed arena camera, dodge-and-punish combat, `DASH CATCH` pressure state, and victory payoff in one 5–10 minute session.
- **Next checkpoint:** make arena entry immediate even when browser audio startup is unavailable or never settles, without changing combat.

This build is deliberately local and on rails. The audience, queue, challengers, and post-victory evolution are simulated presentation—not a live multiplayer service or trained AI.

**Project dossier:** [public companion site](https://zambrini.github.io/unbroken/project/) · [director’s devlog](DEVLOG.md) · [public source](https://github.com/Zambrini/unbroken)

## Play

```bash
npm ci
npm run dev
```

Use Node `22.23.1` (recorded in `.node-version`), then open [http://localhost:5173/unbroken/](http://localhost:5173/unbroken/).

Use the on-screen start button once to initialize audio.

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
2. Read a dashed magenta warning, evade the solid red attack, and shoot only during the short white-core opening.
3. Choose between committing the dash to reach the punish window or reserving it as an escape.
4. Defeat V.01 and watch the local simulation jump forward to evolved `HEIR // V.37: DASH CATCH`.
5. Face a second 45-second pressure round in which HEIR marks the likely dash endpoint, then win the recorded-champion payoff. Defeat retries the current round rather than resetting the run.

Warnings are deterministic and readable: dashed magenta means queued danger; solid red means active damage; white means a vulnerable target; cyan belongs to the challenger.

## Debug and spectator routes

- `?debug=entry` — opening/entry state
- `?debug=pressure` — evolved `DASH CATCH` pressure state
- `?debug=payoff` — victory/payoff state
- `?spectator=1` — read-only auto-played spectator presentation

Examples: [entry](http://localhost:5173/unbroken/?debug=entry), [pressure](http://localhost:5173/unbroken/?debug=pressure), [payoff](http://localhost:5173/unbroken/?debug=payoff), [spectator](http://localhost:5173/unbroken/?spectator=1).

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
- [Companion website](public/project/index.html)
- Concept screens: [entry](docs/concepts/01-entry-v01.png), [dash counter](docs/concepts/02-dash-counter.png), [DASH CATCH](docs/concepts/03-dash-catch-v37.png)

## Deliberately excluded from `0.1.0`

Real networking, a global queue, accounts, chat, AI training, server persistence, matchmaking, controller/touch play, broad progression, multiple modes, multiple bosses, inventories, cosmetics, content catalogs, and frame-by-frame AI control.
