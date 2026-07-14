# UNBROKEN Design Contract

## Direction

**UNBROKEN** is the event: one challenger enters a globally watched arena and tries to become the last human recorded to defeat the machine. **HEIR** is the boss: every conquered version appears to inherit a legible answer to the behavior that beat it.

For this slice, that fantasy is staged locally. There is no server queue and no trained AI. The second version is a deterministic authored mutation that proves how an explainable evolution could feel.

## Slice promise

In 5–10 minutes, the player should:

- Feel responsive movement, aim, firing, and dash.
- Learn one clear attack grammar without a tutorial wall.
- Experience the tension of spending dash to punish versus keeping it to survive.
- Recognize `DASH CATCH` as HEIR's explicit response—not random difficulty.
- Defeat the evolved version and receive a concise champion-record payoff.

## Visual and camera grammar

- Fixed straight top-down, 16:9 camera; the whole octagonal arena remains visible.
- Matte black-blue floor, sparse cyan grid geometry, magenta perimeter energy, and audience light blocks.
- Cyan = player action; dashed magenta = queued danger; solid red = active lethal space; white = exposed core/critical impact.
- Player is a narrow white lance/delta craft with charcoal structure, cyan channels, and twin engines. HEIR is a beveled modular machine with magenta seams, restrained red emitters, and a white central core.
- Effects stay geometric, brief, and subordinate to the actors and safe route.
- Four recurring fixtures keep the arena authored without adding gameplay clutter: cyan relay upper-left, magenta prism upper-right, red maintenance pod lower-right, camera masts lower-left.

Concept references:

- [`01-entry-v01.png`](concepts/01-entry-v01.png) — opening composition and HUD hierarchy
- [`02-dash-counter.png`](concepts/02-dash-counter.png) — first satisfying evade/punish
- [`03-dash-catch-v37.png`](concepts/03-dash-catch-v37.png) — evolved pressure grammar

The concepts are targets, not claims of one-to-one asset reproduction. The
combatants use five deterministic top-down sprites rendered from one preserved
Blender scene; the arena, combat signals, core, shots, trails, particles, and
hazards remain native 2D rendering.

### Combatant asset contract

- Blender is an offline authoring tool only. The browser loads transparent PNGs
  as persistent Pixi sprites; it does not load a 3D scene or model.
- `art/blender/unbroken-combatants.blend` and `render-combatants.py` are the
  reproducible source for challenger, V.01 sealed/open, and V.37 sealed/open.
- V.37 visibly inherits the V.01 body. Its solid mutation pieces remain inside
  the validated body envelope; only thin emissive rails extend beyond it.
- The procedural 20-unit core remains the authoritative target. Open sprite
  apertures expose it cleanly; rendered armor never changes collision.
- The challenger sprite and reused dash ghosts rotate from the same aim value,
  preserving the existing shot origin and movement read.
- Reduced motion freezes nonessential actor rotation without suppressing dash,
  hit, opening, or danger information.

## Controls

- `WASD` / arrows: move
- Mouse: aim
- Hold left mouse: fire
- `Space`: dash toward movement/aim direction
- `M`: mute/unmute audio
- `R`: retry after defeat

The dash is a single shared tactical resource. It grants a fast, readable reposition and then recharges; it is not a spammable locomotion mode.

An on-screen start button initializes browser audio. Each round begins with a three-second countdown, lasts 45 seconds, and retries that round after defeat.

## Two-round on-rails loop

### Round 1 — Learn and conquer

1. Entry beat and countdown establish challenger, audience, 45-second timer, and `HEIR // V.01`.
2. HEIR queues a broad attack with dashed magenta geometry.
3. The warning resolves into solid red lethal space while preserving an obvious safe route.
4. HEIR opens its armor briefly; only the white core accepts meaningful damage.
5. The player repeats the evade/punish rhythm until victory.

This round teaches the tradeoff: dash aggressively into position to guarantee more shots during the short opening, or hold it to make the next dodge safer. A committed dash must create upside and a real period of vulnerability afterward.

### Interstitial — Inheritance

The build records the local victory, jumps forward to `HEIR // V.37`, and names the inherited response: `MUTATION: DASH CATCH`. The presentation must not imply that a live model trained during play; V.37 is an authored glimpse of a developed lineage.

### Round 2 — Pressure and payoff

After its own three-second countdown, HEIR repeats the learned grammar in a second 45-second round, then adds `DASH CATCH`: a delayed follow-up marks the player's likely dash endpoint. The marker is visible before it activates and leaves a valid non-dash or redirected-dash answer. The player wins by reading the follow-up, reserving or redirecting dash when necessary, and punishing the same exposed core.

Victory ends on a short champion record: the challenger is logged as the last person to conquer the current version, with the audience/queue presentation reinforcing that someone else would face its heir. Defeat retries the current round; completing both rounds offers a clean replay, not a progression tree.

## Fairness rules

1. **Signal before damage.** Every hazard has a warning phase; no spawn damage or invisible hitboxes.
2. **Shape and color agree.** Dashed geometry is queued, solid geometry is active, and warnings remain distinguishable without relying on hue alone.
3. **One active question at a time.** The player reads one primary attack and at most one queued follow-up; no bullet fog.
4. **A safe answer exists.** Telegraphs preserve a visible route or pocket reachable without perfect play.
5. **The boss obeys its own opening.** HEIR cannot deal surprise contact damage while presenting a punish window.
6. **DASH CATCH predicts; it does not cheat.** The target is committed from known player state, shown before activation, and does not retarget mid-dash.
7. **Pressure is authored and named.** Version two changes one rule only. Speed, damage, and density do not secretly spike together.
8. **Failure teaches.** Hits identify the responsible hazard; retry is immediate.

## Debug routes

- `?debug=entry` starts at the entry/teaching state.
- `?debug=pressure` starts at the evolved `DASH CATCH` state.
- `?debug=payoff` starts at the champion payoff.
- `?debug=run` preserves challenger integrity for a complete input-driven QA
  run; it never damages HEIR or advances a round.
- `?spectator=1` runs a read-only presentation suitable for mobile/touch viewing.
- `?motion=reduce` is a QA override that freezes nonessential venue motion.
- `?profile=1` records a normalized 180-frame pacing sample on the canvas.

These routes are for deterministic review and do not represent separate game modes.

## Scope boundary

Included: one arena, one player kit, one boss identity, two authored versions,
five offline-rendered combatant sprites, one meaningful choice, one pressure
mutation, one payoff, local presentation state, spectator view, and verification
hooks.

Excluded: real networking/global queue, accounts, chat, persistent leaderboards, model training, generative attacks, frame-by-frame AI control, multiple bosses or modes, inventories, cosmetics, broad progression, controller/touch gameplay, and large content catalogs.
