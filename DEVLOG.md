# UNBROKEN Director’s Devlog

This is the human-readable record of shipped playable checkpoints. Every entry
describes what changed for the player, how the rendered game was verified, and
what remains intentionally outside the build.

The public version is available through the in-game **PROJECT / DEVLOG** link.

## `0.1.1` — The arena starts before audio

- **Shipped:** 2026-07-14
- **Player impact:** selecting `ENTER ARENA`, `WATCH LIVE`, or a retry starts the countdown immediately, even if the browser cannot start audio.

The first directed checkpoint removed a release-blocking dependency between the
fight and the browser audio system. UNBROKEN still attempts to unlock its synth
from the player gesture, but silence is now a valid fallback instead of a stuck
title screen. Combat, timing, controls, and presentation are otherwise unchanged.

### What was verified

- The original failure target—the Codex internal browser—showed countdown `3`
  immediately and reached live combat with no console errors.
- Desktop Chromium passed with native audio, no `AudioContext`, rejected resume,
  and a resume promise that never settles.
- Mobile spectator mode entered V.37 countdown and live combat with no audio
  context at 390×844.
- Movement, dash, and fire remained responsive during silent fallback play.
- The suite grew from 16 to 21 passing checks; the production build remained clean.

### Kept out of this checkpoint

The separate music catch-up burst after inactive or backgrounded time remains a
future audio-cadence issue. It was deliberately excluded so this release answers
one question only: can the challenger always enter?

## `0.1.0` — First recoverable fight record

- **Preserved:** 2026-07-14
- **Playable scope:** two 45-second rounds, `HEIR // V.01` followed by
  `HEIR // V.37: DASH CATCH`

The first vertical slice established the promise: humanity’s current champion
enters a globally watched fixed-camera arena, reads fair attack forecasts,
chooses when to spend a responsive dash, punishes HEIR’s exposed core, and earns
the `LAST CONQUEROR` record.

### What the player can feel

- Keyboard movement, mouse aim and fire, and a directional dash.
- Dashed magenta forecasts resolving into solid red danger.
- A short white-core punish opening after each evasion.
- One named inherited response: `DASH CATCH` predicts a dash endpoint, declares
  it visibly, and never retargets.
- Immediate current-round retry and a concise final champion payoff.

### What was verified

- The complete V.01 → V.37 → payoff flow was played in desktop Chromium.
- Entry, live combat, DASH CATCH, pressure, defeat/retry, payoff, and mobile
  spectator states were rendered and inspected.
- The production build completed with 16 automated simulation checks passing.
- Approved concept screens and selected `0.1.0` renders were preserved under
  `docs/concepts/` and `docs/checkpoints/0.1.0/`.

### Honest boundary

The audience, queue, challenger identities, victory record, and between-round
evolution are local deterministic presentation. This checkpoint has no live
multiplayer, persisted history, accounts, trained model, or frame-by-frame AI.
Mobile and touch devices receive the read-only spectator presentation.

## Next transmission

Unshipped. The director begins with a fresh playthrough and selects one bounded,
high-leverage player-visible weakness. Depth, weight, readability, and control
feel take priority over additional bosses, modes, progression, or content lists.
