# UNBROKEN Director’s Devlog

This is the human-readable record of shipped playable checkpoints. Every entry
describes what changed for the player, how the rendered game was verified, and
what remains intentionally outside the build.

The public version is available through the in-game **PROJECT / DEVLOG** link.

## `0.5.0` — Arena Materialized

- **Shipped:** 2026-07-14
- **Player impact:** the duel now takes place inside a constructed broadcast venue instead of a flat neon diagram, while the proven combat grammar remains the first read.

Replaying `0.4.0` beside the approved concepts exposed the next visual gap: the
hazards and actors were contained, but the persistent world around them lacked
material depth. This checkpoint builds the stage itself—floor, shell, rail,
stands, audience, and fixtures—without adding another gameplay question.

### What changed in the fight

- Restrained floor panels, radial seams, layered shell bevels, and a jointed
  containment rail turn the octagon into a built structure.
- Stepped stands and deterministic spectator lights reinforce the globally
  watched event without outranking forecasts, danger, the core, or safe route.
- The cyan relay, magenta prism, camera masts, and red maintenance pod now read
  as four distinct physical fixtures. Each stays in the service band between
  the reachable collider envelope and the visible containment rail.
- Persistent venue construction is drawn once; ambient lights, hazards,
  actors, and effects remain dynamic.
- Attack scripts, timing, damage, collision, safe answers, camera, controls,
  HUD, actor behavior, and audio stay fixed.

### What was verified

- Rendered entry, real-input dash-counter, and V.37 pressure states were
  compared with all three approved concepts. The full HUD, exposed core, dash
  ghosts, and spent `DASH 2.3S` resource now read together in the counter proof.
- A real-input V.01 → V.37 run reached `LAST CONQUEROR`; V.37 fell in 14.30
  seconds across two attempts and eight accepted dash commits. Debug support
  restored only challenger integrity.
- The 390×844 spectator has no horizontal overflow. Live reduced-motion venue
  crops taken 700ms apart are pixel-identical.
- Same-browser `0.4.0` and `0.5.0` pressure samples both averaged about 6.94ms
  with zero missed frames; `0.5.0` stayed below 7.8ms maximum.
- All 28 automated checks, TypeScript, the production build, console, and
  network checks pass.

### Kept out of this checkpoint

No attack, actor redesign, runtime 3D, renderer rewrite, progression,
networking, queue service, AI training, account, boss, mode, or content
expansion was added. The next checkpoint begins only after replaying the public
build.

## `0.4.0` — Threat Containment

- **Shipped:** 2026-07-14
- **Player impact:** HEIR's forecasts and lethal geometry now feel emitted into the arena rather than drawn across the screen, while every reachable threat remains honestly signaled.

Replaying `0.3.0` against the approved V.37 pressure concept exposed one clear
visual break: long lance and `DASH CATCH` lines continued through the octagonal
wall into the audience and event UI. The attacks were fair, but the rendering
made them feel like overlays. This checkpoint contains the existing threat
grammar without changing the fight beneath it.

### What changed in the fight

- The visible floor, hazard mask, and foreground containment rail now share one
  octagonal polygon, eliminating drift between the arena and its effects.
- Pulse, lance, compression, and `DASH CATCH` forecasts and active danger render
  through their own masked layer and stop cleanly at the wall.
- A restrained foreground rail keeps the boundary crisp above red bloom without
  competing with the cyan challenger, white core, or safe pocket.
- Attack order, timing, damage, collision, safe answers, camera, controls, HUD,
  and actor rendering stay fixed.

### What was verified

- Rendered captures cover all four pattern families: pulse and lance forecasts,
  active pulse, lance and compression danger, and both `DASH CATCH` warning and
  pressure states.
- Two new contracts keep the authored attack signatures fixed and prove that
  every reachable player circle remains inside the visible hazard mask. All 28
  automated checks pass, and the production build passes on Node 22.23.1.
- A real-input V.01 → V.37 run reached `LAST CONQUEROR`; V.37 fell in 11.83
  seconds across two total attempts and two dash commits. Debug support restored
  only challenger integrity and never damaged or advanced HEIR.
- The 390×844 mobile spectator holds a 390-pixel scroll width. Desktop and
  mobile produced zero console errors, and reload produced zero failed or
  status-400+ requests.
- A 180-frame V.37 pressure sample measured 8.329ms mean, 9.1ms p95, and 9.4ms
  maximum frame interval.

### Kept out of this checkpoint

No attack, timing, damage, progression, networking, queue service, AI training,
account, mode, boss, or content expansion was added. The next checkpoint begins
only after replaying this shipped build.

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

`0.6.0 — Combatants Forged` is selected after replaying the public `0.5.0`
build beside the approved concepts. The materialized venue now exposes the
procedural challenger wedge and HEIR polygons as the largest visual gap. The
next checkpoint uses Blender only as an offline source for five reproducible
top-down sprites; runtime 3D, combat changes, new actors, attacks, modes, and
progression remain out of scope.
