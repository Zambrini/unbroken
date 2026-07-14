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

## `0.2.0` — Make the Punish Contract Real

Status: **shipped 2026-07-14**

The original slice described a dash-versus-safety tradeoff, but the player began inside effective range, could overlap HEIR, and could damage a broad boss hitbox. This checkpoint makes that promise real without adding a parallel system.

- Spawn the challenger outside the 270-unit `BREAK RANGE`.
- Keep the challenger's full 14-unit collider outside HEIR's 96-unit body radius.
- Require every damaging shot to intersect the exposed 20-unit core; armor-only aim returns `CORE MISSED`.
- Extend dash recovery to 2.4 seconds: an opening dash remains committed into the next active threat, while an earlier evasive dash recovers before it.
- Preserve walking as the slower, safer route into the same opening.
- Cover the combat contract with deterministic checks plus rendered range, precision, commitment, and natural-completion evidence.

Exit gate: standing still cannot punish; walking in can punish without spending dash; dashing in reaches the opening sooner; inaccurate fire cannot damage HEIR; and an opening dash is still cooling down when the next threat activates.

## `0.3.0` — Actor Authority

Status: **shipped 2026-07-14**

The combat contract was sound, but the rendered actors still read like thin
diagram elements inside a large arena. This checkpoint gives HEIR and the
challenger physical presence without adding an attack or changing the fight's
authored rhythm.

- Build V.01 from a larger layered hull with a clearly physical core socket.
- Let V.37 inherit the same structural rig, then extend it with filled emitters
  and thin energy rails that read as mutation rather than a different boss.
- Pair the larger HEIR silhouette with a 132-unit solid body radius, preserving
  at least 120 units of usable punish band inside `BREAK RANGE`.
- Strengthen the challenger hull, dash ghosts, and streak so player movement
  holds its own against the boss.
- Turn the existing hit flash into a 75ms white/cyan impact punch.
- Preserve attack scripts, timing, damage, camera, controls, and HUD.

Exit gate: V.01 and V.37 carry materially more visual mass, the core's sealed
and open states remain instantly readable, the physical exclusion matches the
new hull, and the complete fight remains performant and winnable by real input.

## `0.4.0` — Threat Containment

Status: **shipped 2026-07-14**

After Actor Authority, the V.37 concept comparison exposed one remaining break
in the arena fiction: long forecasts and lethal bloom crossed the octagonal
wall into the audience and event UI. This checkpoint makes every existing
threat feel emitted into the arena without changing how the fight behaves.

- Use one shared octagonal polygon for the visible floor, hazard mask, and
  foreground containment rail.
- Keep pulse, lance, compression, and `DASH CATCH` forecast and active effects
  inside that visible combat floor.
- Preserve every reachable challenger position inside the mask so no live
  collision region loses its signal.
- Preserve attack order, timing, damage, collision, safe answers, camera,
  controls, HUD, and actor rendering.
- Cover every pattern family with rendered containment evidence, then complete
  the full fight by real input.

Exit gate: no queued or active hazard leaks into the audience or scoreboard;
every reachable hitbox remains visibly signaled; the `DASH CATCH` safe pocket
stays readable; and the unchanged two-round fight remains performant and
winnable.

## After `0.4.0` — next director cycle

Status: **unshipped — selected only after replay**

Replay the shipped build and choose one player-visible weakness in movement, attack readability, impact, audio weight, onboarding, or visual authority. Compare the relevant live state with the approved concept when visual execution is the limiting gap. No new systems during this pass.

## Future validation — shared arena

Status: **not committed**

Consider a real single-challenger queue, synchronized spectators, authoritative server state, and persisted victory history only after the local combat loop tests well. Boss evolution must remain explainable and bounded: versioned mutations selected between victories, never opaque frame-by-frame control.

## Explicitly not planned for the slice

Accounts, chat, cosmetics, inventory, metagame progression, multiple modes, multiple bosses, controller/touch gameplay, user-generated content, large content catalogs, or production-scale AI infrastructure.
