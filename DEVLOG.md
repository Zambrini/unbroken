# UNBROKEN Director’s Devlog

This is the human-readable record of shipped playable checkpoints. Every entry
describes what changed for the player, how the rendered game was verified, and
what remains intentionally outside the build.

The public version is available through the in-game **PROJECT / DEVLOG** link.

## `0.3.0` — Actor Authority

- **Shipped:** 2026-07-14
- **Player impact:** HEIR now occupies the arena like a machine built to stop humanity's champion, while the challenger and every committed dash read with equal physical clarity.

The punish contract was mechanically honest after `0.2.0`, but the approved
concept comparison exposed the next weakness immediately: both combatants were
thin line work floating inside the arena. This checkpoint gives the existing
duel mass and impact. It does not add another attack, phase, boss, or system.

### What changed in the fight

- V.01 now has a larger, layered armored hull around a physical core socket.
  The socket visibly seals during danger and opens around the white vulnerable
  core during the punish window.
- V.37 inherits that same structural rig, then grows filled mutation emitters
  and thin energy rails. The evolution reads as an authored answer built onto
  HEIR rather than an unrelated silhouette.
- HEIR's solid body radius grows from 96 to 132 units to match the new hull.
  With the challenger's 14-unit radius, center-to-center clearance is 146 units,
  leaving a 124-unit punish band before the 270-unit break-range boundary.
- The challenger receives a stronger layered hull, directional dash ghosts, and
  a brighter streak. The existing hit flash now lands as a 75ms white/cyan punch.
- Attack scripts, attack timing, damage, camera, controls, and HUD stay fixed.

### What was verified

- Rendered desktop captures cover entry scale, dash commitment, core impact,
  body exclusion, armor-only `CORE MISSED`, V.37 pressure, and the final payoff.
- The physical contract still holds: the full challenger collider clears the
  boss, while the punish band remains at least 120 units wide.
- A 180-frame V.37 pressure sample measured 8.33ms mean, 9.2ms p95, and 9.4ms
  maximum frame interval.
- Mobile remains a clear read-only spectator experience.
- A real-input V.01 → V.37 run reached `LAST CONQUEROR`. Debug support stabilized
  only challenger integrity for observation; it never damaged or advanced HEIR.
- All 26 automated checks pass.

### Kept out of this checkpoint

No attack logic, timing, damage, progression, networking, queue service, AI
training, account, or content expansion was added. The next checkpoint will be
chosen only after replaying this shipped build.

## `0.2.0` — Make the punish contract real

- **Shipped:** 2026-07-14
- **Player impact:** every punish now demands approach, aim, and an honest decision about whether faster damage is worth entering the next threat without dash.

The vertical slice already described a strong choice—dash into HEIR's opening or
hold the dash for safety—but the implementation did not force it. The challenger
started inside effective range, could overlap the boss, and could damage a broad
boss hitbox. This checkpoint fixes those contradictions without adding a new
attack, mode, progression layer, or secondary system.

### What changed in the fight

- The challenger starts outside the dashed 270-unit `BREAK RANGE`, so standing
  still cannot convert an opening into damage.
- HEIR's 96-unit body excludes the challenger's full 14-unit collider during
  both walking and dashing; the player can circle the machine but cannot occupy
  or tunnel through it.
- Damage requires a shot to intersect the exposed 20-unit core. A shot that
  reaches armor instead returns `CORE MISSED` rather than silently counting.
- Dash recovery now lasts 2.4 seconds. Walking in preserves the resource;
  dashing in reaches the same punish sooner but remains unavailable when the
  next active threat begins. A dash used earlier to evade is ready by then.

### What was verified

- A stationary rendered state remains outside range and displays the approach
  instruction.
- Separate walk-in and dash-in rendered states both show legitimate `CORE HIT`
  feedback during the opening.
- A fourth rendered state captures the next active threat with dash still at
  `0.6s`, alongside the consequence of the aggressive commitment.
- Off-axis fire held through an opening left HEIR at 30 integrity and returned
  `CORE MISSED`; centered fire then dealt damage. A real-input run completed
  V.01 and V.37 through `LAST CONQUEROR`, with debug support used only to keep
  the challenger alive for observation.
- The automated suite grew from 21 to 26 passing checks, adding contracts for
  spawn/range geometry, full-collider boss exclusion, actual hit/miss/sealed/
  out-of-range shot outcomes, and dash recovery across both authored timelines.

### Kept out of this checkpoint

No new attacks, boss versions, modes, progression, networking, or content were
added. Visual mass, audio weight, onboarding, and broader spectator depth remain
candidate weaknesses for future cycles, chosen only after replay.

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
