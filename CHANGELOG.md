# Changelog

All notable changes are recorded here. The project uses semantic versioning.

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
