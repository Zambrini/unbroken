# `0.1.1` — Resilient Arena Entry

Shipped on 2026-07-14 as the first directed checkpoint after the preserved
`0.1.0` baseline.

## Player-visible result

Selecting `ENTER ARENA`, `WATCH LIVE`, or a retry begins the countdown
immediately. Browser audio is still requested from the player gesture, but
missing, throwing, rejected, or never-settling audio startup now falls back to
silent play instead of blocking the fight.

## Evidence

- `entry-resume-never-countdown.png` — countdown `3` rendered immediately while
  `AudioContext.resume()` is deliberately held forever.
- `audio-absent-inputs.png` — live movement, dash, and fire exercised with no
  `AudioContext` available.
- `mobile-audio-absent-fight.png` — read-only mobile spectator feed progressing
  through V.37 with no `AudioContext` available.
- Codex internal browser — original regression target reached countdown and live
  combat with zero errors or warnings.
- Desktop Chromium — native, absent, rejected, and never-settling audio modes all
  reached live combat; 14/14 observed resources returned successfully in each run.
- Mobile Chromium at 390×844 — `WATCH LIVE` entered V.37 countdown immediately
  and reached live spectator combat at the measured +3.2 second checkpoint.
- Automated suite — 21/21 checks pass, including five audio startup contracts.

No combat tuning, timing, controls, UI, or visual-language rules changed.
