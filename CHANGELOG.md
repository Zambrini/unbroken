# Changelog

All notable changes are recorded here. The project uses semantic versioning.

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
