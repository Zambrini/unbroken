# Changelog

All notable changes are recorded here. The project uses semantic versioning.

## [0.6.0] — 2026-07-14

### Changed

- Replaced the procedural challenger and HEIR hulls with five deterministic Blender-rendered sprites: challenger, V.01 sealed/open, and V.37 sealed/open.
- Added the reproducible source scene at `art/blender/unbroken-combatants.blend` and the deterministic `render-combatants.py` export path.
- Integrated the renders as persistent Pixi sprites while keeping Blender entirely offline; the browser still runs the same fixed-camera 2D game with no runtime 3D.
- Preserved the procedural core, aim line, shots, dash streak and ghosts, particles, hit punch, forecasts, danger, safe route, and V.37 energy rails above and around the new physical hulls.
- Kept the validated actor footprint honest with a 320-unit V.01 display and 336-unit V.37 display whose additional outer reach is energy-only.

### Verified

- Passed all 35 automated checks, TypeScript, the production build, and diff validation.
- Inspected rendered V.01 entry, real-input dash, exposed-core hit, V.37 pressure, reduced-motion, mobile spectator, and reproducible Blender-source states.
- Confirmed a real dash uses the forged challenger and its persistent ghosts, and observed a live V.37 `CORE HIT` through the open armor.
- Completed V.01 → inheritance → V.37 → `LAST CONQUEROR` in the production preview; V.37 fell in 35.63 seconds and all 60 boss hits came through real pointer/Space input while the QA harness restored only challenger integrity.
- Confirmed the 390×844 mobile spectator remains exactly 390 pixels wide and reports no horizontal overflow.
- Confirmed reduced motion is active and removes nonessential actor rotation while retaining combat-significant feedback.
- Sampled 180 V.37 pressure frames at 6.943ms mean, 6.9ms cadence, 7.5ms p95, 7.9ms maximum, and zero missed frames.
- Kept the five runtime PNGs below 0.9MiB combined and made no gameplay or simulation changes.
- Shipped GitHub Pages deployment `29369239995`; the public game, companion site, bundle, stylesheet, and all five actor images return successfully.
- Replayed the public 1440×900 dash and V.37 pressure states with zero browser logs; the clean pressure sample measured 7.4ms p95 / 7.8ms maximum with zero missed frames, and mobile remained exactly 390 pixels wide at 390×844.

## [0.5.0] — 2026-07-14

### Changed

- Split persistent venue construction from dynamic lights, hazards, actors, and effects so the arena shell is drawn once instead of rebuilt every frame.
- Materialized the octagonal venue with restrained floor sectors and seams, a layered containment rail, stepped audience stands, and deterministic spectator lights.
- Rebuilt the cyan relay, magenta prism, camera masts, and red maintenance pod as distinct fixtures in the service band between the reachable collider envelope and the visible containment rail.
- Added contact depth and local emissive response while preserving the semantic hierarchy: white/cyan challenger and core, dashed magenta forecasts, and solid red danger remain dominant.
- Added reduced-motion and normalized frame-pacing QA hooks without changing combat behavior.

### Verified

- Kept all 28 automated checks passing; TypeScript, production build, and diff validation are clean on Node 22.23.1.
- Inspected rendered entry, real-input dash-counter, V.37 pressure, final payoff, and 390×844 mobile spectator states against the approved concepts.
- Completed a real-input V.01 → V.37 run through `LAST CONQUEROR`; V.37 fell in 14.30 seconds across two attempts and eight accepted dash commits. Debug support restored only challenger integrity and never damaged or advanced HEIR.
- Confirmed live reduced motion freezes the isolated venue crop exactly across two samples (`0` changed pixels) while gameplay continues.
- Rebaselined V.37 pressure in the same internal-browser session as `0.4.0`: both builds averaged about 6.94ms, recorded zero missed frames, and stayed below 7.9ms maximum.
- Confirmed no mobile overflow, console warnings/errors, failed assets, or status-400+ requests.

## [0.4.0] — 2026-07-14

### Changed

- Added one shared octagonal arena polygon for the visible floor, hazard mask, and foreground containment rail.
- Routed pulse, lance, compression, and `DASH CATCH` forecast and active effects through a dedicated masked hazard layer, so long geometry now stops at the arena wall instead of crossing into the audience or event UI.
- Kept the perimeter rail above hazard bloom so the combat boundary remains crisp under pressure.
- Preserved attack order, timing, damage, collision, safe answers, camera, controls, HUD, and actor rendering.

### Verified

- Expanded the automated suite from 26 to 28 passing checks, including fixed authored-attack signatures and proof that every reachable player circle remains inside the visible hazard mask.
- Inspected rendered containment across all four pattern families, including pulse and lance telegraphs, active pulse, lance and compression danger, and `DASH CATCH` telegraph and pressure states.
- Completed a real-input V.01 → V.37 run through the payoff; V.37 fell in 11.83 seconds across two total attempts and two dash commits. Debug support restored only challenger integrity and never damaged or advanced HEIR.
- Confirmed the 390×844 mobile spectator at a 390-pixel scroll width, with zero desktop or mobile console errors and zero failed or status-400+ requests during reload.
- Sampled 180 V.37 pressure frames at 8.329ms mean, 9.1ms p95, and 9.4ms maximum render interval.
- Passed the production build on Node 22.23.1.

## [0.3.0] — 2026-07-14

### Changed

- Rebuilt HEIR // V.01 as a larger layered armored hull with a physical core socket whose sealed and vulnerable states remain unmistakable.
- Made HEIR // V.37 inherit the baseline structural rig, then added filled mutation emitters and thin energy rails for a stronger evolved silhouette without obscuring attack telegraphs.
- Increased HEIR's solid body radius from 96 to 132 units. The challenger's full 14-unit collider now stops at 146 units from center, leaving a 124-unit punish band inside `BREAK RANGE`.
- Strengthened the challenger's layered hull and directional dash ghosts/streak so player movement carries more visual weight.
- Turned the existing boss flash into a 75ms white/cyan impact punch; attack scripts, timing, damage, camera, controls, and HUD are unchanged.

### Verified

- Kept all 26 automated checks passing and strengthened the combat contract to require full collider clearance plus at least 120 units of usable punish band.
- Inspected rendered entry, dash commitment, core hit, core miss, body exclusion, V.37 pressure, full payoff, and mobile spectator states.
- Sampled 180 V.37 pressure frames at 8.33ms mean, 9.2ms p95, and 9.4ms maximum render interval.
- Completed a real-input V.01 → V.37 run through the payoff, with debug support used only to stabilize challenger integrity and never to damage or advance HEIR.

## [0.2.0] — 2026-07-14

### Changed

- Moved the challenger spawn outside the 270-unit `BREAK RANGE`, so every punish now requires a visible approach.
- Made HEIR's 96-unit body solid against the challenger's full 14-unit collider during both movement and dash, including fixed-step tunneling protection.
- Replaced broad boss damage with core-accurate collision: shots must intersect the exposed 20-unit core, while armor-only aim ricochets with `CORE MISSED`.
- Extended dash recovery to 2.4 seconds. An opening dash reaches the punish sooner but remains committed into the next active threat; an earlier evasive dash recovers before that threat, and walking in remains the slower safe option.
- Added a readable dashed break-range boundary and contextual approach, core-hit, and core-miss feedback.

### Verified

- Expanded the automated suite from 21 to 26 passing checks with contracts for outside-range spawn, full-collider boss exclusion, real shot outcomes, and dash recovery timing across both boss versions.
- Preserved rendered evidence for stationary range denial, walk-in and dash-in punishment, core misses and hits, committed dash recovery, and natural two-round completion.

## [0.1.1] — 2026-07-14

### Fixed

- Arena entry, re-entry, and mobile spectator start now proceed immediately without waiting for browser audio startup.
- Missing, throwing, rejected, or indefinitely suspended audio contexts fall back to silent play instead of trapping the challenger on the title screen.
- Audio failures are contained without unhandled promise rejections or player-facing error UI.

### Verified

- Expanded the automated suite to 21 checks, including five audio startup fault contracts.
- Passed the rendered desktop matrix for native, absent, rejected, and never-settling audio startup.
- Passed mobile spectator entry at 390×844 with audio unavailable.
- Reproduced and cleared the original blocker in the Codex internal browser: entry shows countdown `3` immediately and reaches live combat with no console errors.
- Preserved normal audio unlock and mute behavior where the browser permits playback.

## [0.1.0] — 2026-07-13

### Added

- First playable UNBROKEN vertical slice.
- Fixed top-down octagonal arena and the modular boss `HEIR`.
- Keyboard/mouse movement, aiming, shooting, and rechargeable dash.
- Two 45-second rounds with three-second countdowns: `HEIR // V.01` followed by evolved `HEIR // V.37: DASH CATCH`.
- Telegraph, active-hazard, vulnerability, damage, victory, and restart feedback.
- Dash risk choice: commit the defensive resource to reach a punish window or save it for the next hazard.
- Locally simulated audience, queue, challenger record, and between-round evolution.
- Read-only spectator mode and entry/pressure/payoff debug routes.
- Mobile spectator scoreboard with live challenger, integrity, audience, queue, timer, and mutation context.
- Audio unlock start screen, mute control, and automatic current-round retry.
- Core automated checks and build verification.
- Browser acceptance pass covering desktop states, mobile live view, defeat/retry, and the complete V.01 → V.37 → payoff transition.
- Design notes, roadmap, version file, and gameplay concept references.

### Known limits

- Queue, audience, and evolution are local deterministic simulations.
- No multiplayer service, persisted history, trained model, or account system.
- Gameplay is desktop keyboard/mouse only; mobile is spectator-only.

### Release record

- Preserved the approved concept screens and selected rendered checkpoint evidence.
- Added a public project dossier and human-readable director's devlog.
- Added a reproducible Node `22.23.1` toolchain pin and tested GitHub Pages release workflow.
