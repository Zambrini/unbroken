# Roadmap

The roadmap stays narrow until the combat proof earns expansion.

## `0.1.0` — Vertical slice

Status: **preserved release baseline**

- One fixed-camera neon arena
- Responsive keyboard/mouse movement, aim, fire, and dash
- Two on-rails HEIR rounds
- Readable telegraph → evade → opening → precise-shot loop
- Meaningful dash choice: spend it to secure a punish or reserve it for safety
- Named pressure state: `DASH CATCH`
- Local queue/audience/evolution simulation
- Victory record payoff
- Spectator presentation and deterministic debug routes
- Automated checks plus manual playtest pass

Exit gate: a new player can identify danger, execute a dash-counter, explain the dash tradeoff, and finish both rounds without developer explanation.

## `0.1.1` — Resilient arena entry

Status: **shipped 2026-07-14**

Make audio startup best-effort so the player always reaches the countdown immediately after selecting `ENTER ARENA`, even when the browser rejects, omits, or indefinitely suspends its audio context.

- Preserve the user-gesture audio unlock where supported.
- Treat silence as a valid fallback instead of blocking play.
- Add fault checks for missing, throwing, rejected, and never-settling audio contexts.
- Validate entry, countdown, and live combat in the rendered desktop and mobile spectator builds.

Exit gate: every audio fault mode enters playable combat immediately with no unhandled error, while normal audio and mute behavior still work.

## After `0.1.1` — combat contract checkpoint

Status: **next director cycle — selected only after replay**

Replay the shipped build and choose one player-visible weakness in movement, dash commitment, aim precision, attack readability, impact, or pacing. Compare the relevant live state with the approved concept when visual execution is the limiting gap. No new systems during this pass.

## Future validation — shared arena

Status: **not committed**

Consider a real single-challenger queue, synchronized spectators, authoritative server state, and persisted victory history only after the local combat loop tests well. Boss evolution must remain explainable and bounded: versioned mutations selected between victories, never opaque frame-by-frame control.

## Explicitly not planned for the slice

Accounts, chat, cosmetics, inventory, metagame progression, multiple modes, multiple bosses, controller/touch gameplay, user-generated content, large content catalogs, or production-scale AI infrastructure.
