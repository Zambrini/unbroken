# UNBROKEN combatant source

`render-combatants.py` is the reproducible source for the challenger and HEIR
sprite models. It rebuilds the five centered models from procedural polygon
prisms, beveled boxes, cylinders, and toruses; saves
`unbroken-combatants.blend`; and writes transparent PNGs directly into the game.

## Render

From the repository root, using Blender 5.1 or newer:

```sh
/Applications/Blender.app/Contents/MacOS/Blender \
  --background --factory-startup \
  --python art/blender/render-combatants.py
```

The script replaces the active Blender scene and overwrites its generated
`.blend` and PNG outputs. Edit the script, not the generated file, when a model
must remain reproducible.

## Output contract

| File | Canvas | Approximate visible silhouette |
| --- | ---: | ---: |
| `src/assets/actors/challenger.png` | 192 x 192 | 152 x 85 px |
| `src/assets/actors/heir-v01-sealed.png` | 512 x 512 | 420 x 420 px |
| `src/assets/actors/heir-v01-open.png` | 512 x 512 | 420 x 420 px |
| `src/assets/actors/heir-v37-sealed.png` | 640 x 640 | 558 x 558 px |
| `src/assets/actors/heir-v37-open.png` | 640 x 640 | 558 x 558 px |

- Every asset is centered on a transparent square canvas.
- The challenger faces screen-right (`+X`). Its runtime pivot is the image
  center; aim rotation, dash ghosts, thrust, hit tint, and impact effects remain
  procedural in Pixi.
- HEIR keeps a transparent center pixel in all four renders. The runtime draws
  the sealed or exposed procedural core through that aperture.
- V.37 literally contains a scaled V.01 four-petal rig, then adds six compact
  inherited fin anchors, thin magenta energy rails, and two red emitter
  housings. Only the thin energy rails extend beyond the inherited solid hull,
  preserving the fixed gameplay collision. It is a developed lineage, not a
  different boss.
- Sealed/open files move only the inner plate edges and change the dark
  mechanical socket radius; the outer collision silhouette does not expand.
  Cyan and white remain entirely available to the procedural runtime core.
  The sprites do not bake a core, glow halo, attack effect, hit flash, or
  directional shadow.

## Look and camera

The camera is fixed, straight-down, orthographic, and square. A broad upper-left
area key plus soft fill lights reveal the bevels; every light has shadows
disabled. Armor uses rough matte materials. Cyan, magenta, and red emission is
restrained and rendered without bloom or compositor effects so combat signals
remain under runtime control.

The generated `.blend` stores each model at the origin in a separate named
collection. It opens with `CHALLENGER` isolated. Toggle one HEIR collection at a
time to inspect its centered sealed/open source state.
