# UNBROKEN `0.1.0` Acceptance Record

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
