# UNBROKEN Acceptance Record

- Date: 2026-07-13
- Target: desktop Chromium at 1440×900; mobile spectator Chromium at 390×844

## Automated

- `npm test`: 16/16 checks pass across collision, pattern fairness, and evolution constraints.
- `npm run build`: TypeScript and production Vite build pass.
- Browser console: 0 errors, 0 warnings.
- Browser network log: no failed requests.

## Played and inspected

- Entered through the audio-unlock screen and completed the countdown into live control.
- Exercised movement, aim, held fire, dash, player damage, defeat, and automatic retry.
- Confirmed shots only damage the exposed core from `BREAK_RANGE`; unsafe shots ricochet.
- Confirmed V.01 defeat enters the inheritance reveal, then starts V.37 with the same 30 HP.
- Confirmed `DASH CATCH` presents an active sweep and one queued endpoint follow-up without retargeting.
- Confirmed V.37 defeat enters the `LAST CONQUEROR` payoff and replay state.
- Inspected deterministic entry, pressure, and payoff routes against the approved concept screens.
- Inspected mobile title and live spectator states; touch remains read-only by design.

## Intentional limits

The audience, queue, challenger identities, evolution, and records are local simulations. This pass does not validate networking, persistence, trained-model behavior, controller play, or touch gameplay because those systems are outside `0.1.0`.

## Latest acceptance — `0.5.0` Arena Materialized

- Date: 2026-07-14
- Targets: desktop internal browser at a 1440×900 review frame; mobile spectator at 390×844

### Automated and production

- `npm test`: 28/28 checks pass across collision, attack signatures, fairness, containment, evolution, and audio entry faults.
- `npm run check`: TypeScript passes.
- `npm run build`: production Vite build passes on Node 22.23.1.
- Browser console: 0 errors and 0 warnings.
- Browser reload: no failed assets or status-400+ requests.

### Played and inspected

- Compared rendered entry, real-input dash-counter, and V.37 pressure states with the three approved concept screens.
- Confirmed floor depth, built rail, stands, lights, and four distinct fixtures read as one physical venue without outranking challenger, core, forecasts, danger, or safe route.
- Kept every fixture outside the reachable collider envelope, in the visible service band before the containment rail.
- Completed V.01 → V.37 → `LAST CONQUEROR` by real input. V.37 fell in 14.30 seconds across two attempts and eight accepted dash commits; debug support restored only challenger integrity.
- Confirmed the 390×844 spectator has a 390-pixel scroll width and no overflow or shimmer.
- Confirmed two live reduced-motion venue crops are pixel-identical while gameplay continues.
- Rebaselined `0.4.0` and `0.5.0` sequentially in the same internal-browser viewport. Both averaged about 6.94ms with zero missed frames; `0.5.0` stayed at 7.4–7.7ms p95 and at or below 7.8ms maximum.

### Preserved contract

Attack scripts, order, timing, damage, collision, safe answers, camera, controls, HUD, and procedural audio are unchanged. This acceptance does not cover networking, persistence, trained-model behavior, controller/touch gameplay, additional bosses, modes, or progression.
