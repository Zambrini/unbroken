# `0.6.0` — Combatants Forged

After `0.5.0` made the broadcast venue physical, comparison with the approved
concepts exposed the remaining foreground gap: the challenger and HEIR still
read as procedural diagrams. This checkpoint forges only those two combatants
as reproducible offline-rendered sprites and leaves the validated fight intact.

## Player-visible result

- The challenger is now a narrow white lance/delta craft with charcoal armor,
  cyan channels, and twin engines. The same render drives the live craft and
  its persistent dash ghosts.
- HEIR V.01 uses four beveled armor assemblies around a legible central socket,
  with distinct sealed and open renders.
- HEIR V.37 visibly inherits the V.01 machine before adding restrained mutation
  anchors, emitters, spines, and thin red/magenta energy rails.
- The existing procedural core, aim line, shots, dash streak, particles, hit
  punch, forecasts, danger, safe route, and energy effects remain on top of and
  around the physical sprites.

## Reproducible source

All five runtime images come from:

- `art/blender/unbroken-combatants.blend`
- `art/blender/render-combatants.py`

The render path is deterministic and produces transparent top-down PNGs for the
challenger, V.01 sealed/open, and V.37 sealed/open states. Blender is not part of
the browser runtime. Pixi loads persistent 2D sprites; there is no GLB, live 3D
camera, model animation, shader pipeline, or renderer rewrite.

The five PNGs total less than 0.9MiB. V.01 displays at 320 world units and V.37
at 336. V.37's solid inherited rig remains coherent with the 132-unit collision
body; only its thin emissive rails extend beyond that physical envelope.

## Rendered evidence

- [Forged V.01 entry](entry-forged.jpg) — challenger, sealed V.01 armor, arena,
  and HUD hierarchy at 1440×900.
- [Real-input dash](real-dash.jpg) — the forged ship, reused sprite ghosts,
  cyan streak, and committed dash state.
- [Open core hit](open-core-hit.jpg) — open armor, procedural white/cyan core,
  and live impact feedback.
- [V.37 pressure](v37-pressure.jpg) — inherited evolved silhouette, energy-only
  outer reach, and readable pressure grammar.
- [Mobile spectator](mobile-spectator.jpg) — 390×844 read-only presentation.
- [Reduced motion](reduced-motion.jpg) — nonessential actor rotation frozen
  while the combat state remains readable.
- [Blender source](blender-source.jpg) — the reproducible combatant source scene.
- [Full-run payoff](full-run-payoff.jpg) — the production preview after the
  complete V.01 → V.37 real-input flow reached `LAST CONQUEROR`.

## Local acceptance

- All 35 automated checks, TypeScript, the production build, and diff validation pass.
- A real dash was executed and inspected with the persistent challenger ghosts.
- A live V.37 `CORE HIT` was observed through the open armor.
- The production preview completed V.01 → inheritance → V.37 → `LAST
  CONQUEROR`; V.37 fell in 35.63 seconds. The `debug=run` harness restored only
  challenger integrity while real pointer aim/fire and Space dashes delivered
  every boss hit.
- Mobile at 390×844 reported `scrollWidth = 390`.
- The reduced-motion route reported `true`.
- A 180-frame V.37 pressure sample measured 6.943ms mean, 6.9ms cadence,
  7.5ms p95, 7.9ms maximum, and zero missed frames.
- No gameplay or simulation file changed.

## Preserved scope and release boundary

Attack scripts, timing, damage, collision, safe answers, camera, controls, HUD,
arena, spectator behavior, and audio retain the verified `0.5.0` contract. This
checkpoint adds no runtime 3D, new attack, actor, boss, mode, progression,
networking, account, trained model, controller, or touch gameplay.

The checkpoint shipped through GitHub Pages deployment `29369239995`. The
public 1440×900 build repeated the real dash with zero browser logs, a clean
180-frame V.37 pressure sample measured 7.4ms p95 / 7.8ms maximum with zero
missed frames, and the 390×844 spectator remained exactly 390 pixels wide.

The public concept replay selected `0.7.0` HEIR Citadel Authority: join the
remaining detached-petal read into the heavier interlocking chassis promised by
the concepts while leaving the challenger and combat contract untouched.
