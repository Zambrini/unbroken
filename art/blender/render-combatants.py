"""Build and render UNBROKEN's five combatant sprites.

Run from the repository root with Blender 5.1 or newer:

    blender --background --factory-startup \
      --python art/blender/render-combatants.py

The generated .blend remains useful for inspection, but this script is the
source of truth. Every model is centered at the origin in its own collection.
"""

from __future__ import annotations

import math
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

import bpy


def resolve_project_root() -> Path:
    """Resolve paths under CLI Blender and the Blender MCP text wrapper."""
    tool_args = globals().get("args")
    if isinstance(tool_args, dict) and tool_args.get("project_root"):
        return Path(tool_args["project_root"]).expanduser().resolve()

    script_file = globals().get("__file__")
    if script_file:
        return Path(script_file).resolve().parents[2]

    cwd = Path(os.getcwd()).resolve()
    for candidate in (cwd, *cwd.parents):
        if (candidate / "package.json").is_file() and (candidate / "src").is_dir():
            return candidate
    raise RuntimeError("Pass args={'project_root': '/path/to/unbroken'} when __file__ is unavailable.")


PROJECT_ROOT = resolve_project_root()
OUTPUT_DIR = PROJECT_ROOT / "src" / "assets" / "actors"
BLENDER_DIR = PROJECT_ROOT / "art" / "blender"
BLEND_PATH = BLENDER_DIR / "unbroken-combatants.blend"


@dataclass(frozen=True)
class RenderSpec:
    collection: str
    filename: str
    size: int
    ortho_scale: float
    transparent_core: bool = False


RENDERS = (
    RenderSpec("CHALLENGER", "challenger.png", 192, 5.2),
    RenderSpec("HEIR_V01_SEALED", "heir-v01-sealed.png", 512, 10.8, True),
    RenderSpec("HEIR_V01_OPEN", "heir-v01-open.png", 512, 10.8, True),
    RenderSpec("HEIR_V37_SEALED", "heir-v37-sealed.png", 640, 14.0, True),
    RenderSpec("HEIR_V37_OPEN", "heir-v37-open.png", 640, 14.0, True),
)


def reset_scene() -> bpy.types.Scene:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 20
    scene.render.resolution_percentage = 100
    scene.render.use_file_extension = True
    scene.render.engine = choose_eevee(scene)
    scene.render.use_file_extension = True
    scene.camera = make_camera(scene)
    configure_color_management(scene)
    configure_world(scene)
    add_lighting(scene)
    return scene


def choose_eevee(scene: bpy.types.Scene) -> str:
    for identifier in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = identifier
            return identifier
        except TypeError:
            continue
    raise RuntimeError("This Blender build does not expose an EEVEE render engine.")


def configure_color_management(scene: bpy.types.Scene) -> None:
    try:
        scene.view_settings.view_transform = "AgX"
    except TypeError:
        pass
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    scene.view_settings.exposure = 0.0


def configure_world(scene: bpy.types.Scene) -> None:
    world = bpy.data.worlds.new("UNBROKEN World")
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.012, 0.018, 0.035, 1.0)
    background.inputs["Strength"].default_value = 0.22
    scene.world = world


def make_camera(scene: bpy.types.Scene) -> bpy.types.Object:
    data = bpy.data.cameras.new("Combatant Camera")
    data.type = "ORTHO"
    data.lens = 50
    data.dof.use_dof = False
    camera = bpy.data.objects.new("Combatant Camera", data)
    camera.location = (0.0, 0.0, 24.0)
    camera.rotation_euler = (0.0, 0.0, 0.0)
    scene.collection.objects.link(camera)
    return camera


def add_lighting(scene: bpy.types.Scene) -> None:
    # Large area lights give clear facets without a baked directional shadow.
    add_area_light(scene, "Upper-left key", (-7.0, 9.0, 14.0), 780.0, 8.0)
    add_area_light(scene, "Lower-right fill", (8.0, -6.0, 10.0), 360.0, 11.0)
    add_area_light(scene, "Top fill", (0.0, 1.0, 15.0), 240.0, 13.0)


def add_area_light(
    scene: bpy.types.Scene,
    name: str,
    location: tuple[float, float, float],
    energy: float,
    size: float,
) -> None:
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.use_shadow = False
    light = bpy.data.objects.new(name, data)
    light.location = location
    light.rotation_euler = (0.0, 0.0, 0.0)
    scene.collection.objects.link(light)


def make_material(
    name: str,
    color: tuple[float, float, float, float],
    *,
    metallic: float = 0.0,
    roughness: float = 0.74,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = color
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    if emission_strength > 0.0:
        emission = principled.inputs.get("Emission Color") or principled.inputs.get("Emission")
        if emission is not None:
            emission.default_value = color
        strength = principled.inputs.get("Emission Strength")
        if strength is not None:
            strength.default_value = emission_strength
    return material


def make_materials() -> dict[str, bpy.types.Material]:
    return {
        "void": make_material("Void armor", (0.008, 0.012, 0.025, 1.0), metallic=0.35),
        "shadow": make_material("Armor shadow", (0.022, 0.030, 0.055, 1.0), metallic=0.42),
        "armor": make_material("Matte armor", (0.065, 0.078, 0.125, 1.0), metallic=0.48),
        "face": make_material("Armor face", (0.22, 0.24, 0.33, 1.0), metallic=0.38),
        "white": make_material(
            "Challenger ceramic",
            (0.97, 0.985, 1.0, 1.0),
            metallic=0.08,
            roughness=0.62,
            emission_strength=0.28,
        ),
        "cyan": make_material(
            "Cyan restrained emission",
            (0.0, 0.72, 0.92, 1.0),
            roughness=0.52,
            emission_strength=1.35,
        ),
        "magenta": make_material(
            "Magenta restrained emission",
            (0.95, 0.015, 0.28, 1.0),
            roughness=0.50,
            emission_strength=1.05,
        ),
        "red": make_material(
            "Red restrained emission",
            (1.0, 0.012, 0.035, 1.0),
            roughness=0.50,
            emission_strength=1.15,
        ),
    }


def make_collection(name: str) -> tuple[bpy.types.Collection, bpy.types.Object]:
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    root = bpy.data.objects.new(f"{name}_ROOT", None)
    root.empty_display_type = "PLAIN_AXES"
    collection.objects.link(root)
    return collection, root


def attach(
    obj: bpy.types.Object,
    collection: bpy.types.Collection,
    root: bpy.types.Object,
) -> bpy.types.Object:
    for current in tuple(obj.users_collection):
        current.objects.unlink(obj)
    collection.objects.link(obj)
    obj.parent = root
    return obj


def add_bevel(obj: bpy.types.Object, width: float, segments: int = 2) -> None:
    bevel = obj.modifiers.new("Edge bevel", "BEVEL")
    bevel.width = width
    bevel.segments = segments
    bevel.limit_method = "ANGLE"


def add_prism(
    name: str,
    points: Sequence[tuple[float, float]],
    depth: float,
    z: float,
    material: bpy.types.Material,
    collection: bpy.types.Collection,
    root: bpy.types.Object,
    *,
    bevel: float = 0.04,
) -> bpy.types.Object:
    count = len(points)
    bottom = [(x, y, -depth * 0.5) for x, y in points]
    top = [(x, y, depth * 0.5) for x, y in points]
    faces: list[tuple[int, ...]] = [
        tuple(reversed(range(count))),
        tuple(range(count, count * 2)),
    ]
    for index in range(count):
        next_index = (index + 1) % count
        faces.append((index, next_index, count + next_index, count + index))
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    mesh.from_pydata(bottom + top, [], faces)
    mesh.materials.append(material)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location.z = z
    collection.objects.link(obj)
    obj.parent = root
    if bevel > 0.0:
        add_bevel(obj, bevel)
    return obj


def add_box(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    rotation: float,
    material: bpy.types.Material,
    collection: bpy.types.Collection,
    root: bpy.types.Object,
    *,
    bevel: float = 0.04,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=(0.0, 0.0, rotation))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if bevel > 0.0:
        add_bevel(obj, bevel)
    return attach(obj, collection, root)


def add_cylinder(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    depth: float,
    material: bpy.types.Material,
    collection: bpy.types.Collection,
    root: bpy.types.Object,
    *,
    vertices: int = 12,
    bevel: float = 0.03,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    if bevel > 0.0:
        add_bevel(obj, bevel)
    return attach(obj, collection, root)


def add_torus(
    name: str,
    major_radius: float,
    minor_radius: float,
    z: float,
    material: bpy.types.Material,
    collection: bpy.types.Collection,
    root: bpy.types.Object,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=48,
        minor_segments=10,
        location=(0.0, 0.0, z),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return attach(obj, collection, root)


def rotate_points(
    points: Iterable[tuple[float, float]],
    angle: float,
) -> list[tuple[float, float]]:
    cosine = math.cos(angle)
    sine = math.sin(angle)
    return [
        (x * cosine - y * sine, x * sine + y * cosine)
        for x, y in points
    ]


def scale_points(
    points: Iterable[tuple[float, float]],
    scale: float,
) -> list[tuple[float, float]]:
    return [(x * scale, y * scale) for x, y in points]


def open_inner_edge(
    points: Iterable[tuple[float, float]],
    amount: float,
) -> list[tuple[float, float]]:
    """Open the socket while preserving the solid outer collision silhouette."""
    opened: list[tuple[float, float]] = []
    for x, y in points:
        influence = max(0.0, min(1.0, (3.25 - x) / 2.3))
        opened.append((x + amount * influence, y))
    return opened


def mirror_y(points: Iterable[tuple[float, float]]) -> list[tuple[float, float]]:
    return [(x, -y) for x, y in reversed(tuple(points))]


def build_challenger(materials: dict[str, bpy.types.Material]) -> None:
    collection, root = make_collection("CHALLENGER")

    fuselage = [(-1.62, -0.34), (0.42, -0.48), (2.28, 0.0), (0.42, 0.48), (-1.62, 0.34)]
    upper_wing = [(-1.72, 0.28), (0.62, 0.42), (-1.24, 1.13), (-1.78, 0.86)]
    lower_wing = mirror_y(upper_wing)
    for label, points in (("fuselage", fuselage), ("upper wing", upper_wing), ("lower wing", lower_wing)):
        add_prism(
            f"Challenger split underplate {label}",
            [(x * 1.055, y * 1.055) for x, y in points],
            0.20,
            0.22,
            materials["void"],
            collection,
            root,
            bevel=0.055,
        )
        add_prism(
            f"Challenger {label}",
            points,
            0.30,
            0.38,
            materials["armor" if label == "fuselage" else "shadow"],
            collection,
            root,
            bevel=0.07,
        )

    add_prism(
        "Challenger ceramic spear",
        [(-1.28, -0.27), (0.62, -0.34), (2.14, 0.0), (0.62, 0.34), (-1.28, 0.27)],
        0.25,
        0.62,
        materials["white"],
        collection,
        root,
        bevel=0.045,
    )
    upper_ceramic = [(-1.42, 0.37), (0.34, 0.46), (-1.08, 0.94), (-1.48, 0.78)]
    for label, panel in (("upper", upper_ceramic), ("lower", mirror_y(upper_ceramic))):
        add_prism(
            f"Challenger ceramic {label} wing",
            panel,
            0.18,
            0.61,
            materials["white"],
            collection,
            root,
            bevel=0.035,
        )
    add_prism(
        "Challenger canopy",
        [(-0.12, -0.18), (0.55, -0.14), (0.86, 0.0), (0.55, 0.14), (-0.12, 0.18)],
        0.20,
        0.79,
        materials["void"],
        collection,
        root,
        bevel=0.04,
    )

    for side in (-1.0, 1.0):
        add_box(
            f"Challenger wing rail {side:+.0f}",
            (-0.52, side * 0.67, 0.61),
            (1.42, 0.075, 0.12),
            -side * 0.24,
            materials["cyan"],
            collection,
            root,
            bevel=0.025,
        )
        add_cylinder(
            f"Challenger engine {side:+.0f}",
            (-1.48, side * 0.31, 0.52),
            0.14,
            0.28,
            materials["cyan"],
            collection,
            root,
            vertices=10,
        )
        add_prism(
            f"Challenger tail fork {side:+.0f}",
            [(-1.78, side * 0.21), (-1.18, side * 0.28), (-1.52, side * 0.70)],
            0.20,
            0.54,
            materials["face"],
            collection,
            root,
            bevel=0.035,
        )


def build_heir(
    materials: dict[str, bpy.types.Material],
    *,
    version: int,
    is_open: bool,
) -> None:
    state = "OPEN" if is_open else "SEALED"
    collection, root = make_collection(f"HEIR_V{version:02d}_{state}")
    open_shift = 0.78 if is_open else 0.0
    rig_scale = 1.22 if version == 37 else 1.0

    petal = [
        (0.95, -0.66),
        (2.06, -1.42),
        (3.72, -1.20),
        (4.42, -0.44),
        (4.42, 0.44),
        (3.72, 1.20),
        (2.06, 1.42),
        (0.95, 0.66),
    ]
    face = [
        (1.03, -0.60),
        (2.10, -1.34),
        (3.68, -1.13),
        (4.33, -0.40),
        (4.33, 0.40),
        (3.68, 1.13),
        (2.10, 1.34),
        (1.03, 0.60),
    ]
    inset = [
        (1.58, -0.31),
        (2.40, -0.78),
        (3.35, -0.64),
        (3.78, -0.23),
        (3.78, 0.23),
        (3.35, 0.64),
        (2.40, 0.78),
        (1.58, 0.31),
    ]

    for index in range(4):
        angle = index * math.pi * 0.5
        shifted_petal = rotate_points(scale_points(open_inner_edge(petal, open_shift), rig_scale), angle)
        shifted_face = rotate_points(scale_points(open_inner_edge(face, open_shift), rig_scale), angle)
        shifted_inset = rotate_points(scale_points(open_inner_edge(inset, open_shift), rig_scale), angle)
        add_prism(
            f"V{version:02d} petal trim {index}",
            shifted_petal,
            0.24,
            0.24,
            materials["magenta"],
            collection,
            root,
            bevel=0.06,
        )
        add_prism(
            f"V{version:02d} petal armor {index}",
            shifted_face,
            0.42,
            0.43,
            materials["armor"],
            collection,
            root,
            bevel=0.10,
        )
        add_prism(
            f"V{version:02d} petal face {index}",
            shifted_inset,
            0.22,
            0.72,
            materials["face"],
            collection,
            root,
            bevel=0.055,
        )

        rail_center = 2.80 * rig_scale
        add_box(
            f"V{version:02d} magenta seam {index}",
            (math.cos(angle) * rail_center, math.sin(angle) * rail_center, 0.88),
            (2.15 * rig_scale, 0.09, 0.10),
            angle,
            materials["magenta"],
            collection,
            root,
            bevel=0.02,
        )
        bolt_radius = 3.76 * rig_scale
        add_cylinder(
            f"V{version:02d} petal bolt {index}",
            (math.cos(angle) * bolt_radius, math.sin(angle) * bolt_radius, 0.87),
            0.105,
            0.12,
            materials["white"],
            collection,
            root,
            vertices=8,
            bevel=0.015,
        )

    socket_radius = (1.47 if version == 37 else 1.22) if is_open else 1.00
    socket_tube = 0.17 if is_open else 0.22
    add_torus(
        f"V{version:02d} matte core socket",
        socket_radius,
        socket_tube,
        0.62,
        materials["shadow"],
        collection,
        root,
    )
    add_torus(
        f"V{version:02d} core aperture trim",
        socket_radius,
        0.085,
        0.85,
        materials["magenta"],
        collection,
        root,
    )

    if version == 37:
        build_v37_mutation(materials, collection, root)


def build_v37_mutation(
    materials: dict[str, bpy.types.Material],
    collection: bpy.types.Collection,
    root: bpy.types.Object,
) -> None:
    mutation_fin = [
        (4.25, -0.34),
        (4.88, -0.50),
        (5.24, 0.0),
        (4.88, 0.50),
        (4.25, 0.34),
    ]
    mutation_face = [
        (4.31, -0.29),
        (4.88, -0.43),
        (5.16, 0.0),
        (4.88, 0.43),
        (4.31, 0.29),
    ]
    for index, degrees in enumerate((60, 90, 120, 240, 270, 300)):
        angle = math.radians(degrees)
        add_prism(
            f"V37 inherited mutation trim {index}",
            rotate_points(mutation_fin, angle),
            0.20,
            0.18,
            materials["magenta"],
            collection,
            root,
            bevel=0.045,
        )
        add_prism(
            f"V37 inherited mutation fin {index}",
            rotate_points(mutation_face, angle),
            0.38,
            0.39,
            materials["shadow"],
            collection,
            root,
            bevel=0.07,
        )
        rail_center = 5.22
        add_box(
            f"V37 mutation rail {index}",
            (math.cos(angle) * rail_center, math.sin(angle) * rail_center, 0.68),
            (1.78, 0.07, 0.09),
            angle,
            materials["magenta"],
            collection,
            root,
            bevel=0.018,
        )

    for side in (-1.0, 1.0):
        x = side * 4.72
        add_cylinder(
            f"V37 red emitter housing {side:+.0f}",
            (x, 0.0, 0.50),
            0.68,
            0.48,
            materials["armor"],
            collection,
            root,
            vertices=10,
            bevel=0.075,
        )
        add_cylinder(
            f"V37 red emitter core {side:+.0f}",
            (side * 5.02, 0.0, 0.78),
            0.26,
            0.18,
            materials["red"],
            collection,
            root,
            vertices=10,
            bevel=0.025,
        )
        add_box(
            f"V37 emitter bridge {side:+.0f}",
            (side * 4.23, 0.0, 0.45),
            (0.92, 0.48, 0.34),
            0.0,
            materials["shadow"],
            collection,
            root,
            bevel=0.06,
        )
        add_box(
            f"V37 red energy rail {side:+.0f}",
            (side * 5.56, 0.0, 0.56),
            (1.08, 0.08, 0.09),
            0.0,
            materials["red"],
            collection,
            root,
            bevel=0.018,
        )


def render_sprite(scene: bpy.types.Scene, spec: RenderSpec) -> None:
    for candidate in RENDERS:
        collection = bpy.data.collections[candidate.collection]
        collection.hide_render = candidate.collection != spec.collection
        collection.hide_viewport = False

    scene.camera.data.ortho_scale = spec.ortho_scale
    scene.render.resolution_x = spec.size
    scene.render.resolution_y = spec.size
    output_path = OUTPUT_DIR / spec.filename
    scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)

    # Blender 5.1 reports Render Result as 0x0 in some headless MCP sessions.
    # Reloading the written PNG validates the actual integration artifact.
    rendered = bpy.data.images.load(str(output_path), check_existing=False)
    try:
        actual_size = (int(rendered.size[0]), int(rendered.size[1]))
        if actual_size != (spec.size, spec.size):
            raise RuntimeError(
                f"Unexpected render size for {spec.filename}: {actual_size}, expected {(spec.size, spec.size)}."
            )
        if spec.transparent_core:
            center = ((spec.size // 2) * spec.size + spec.size // 2) * 4 + 3
            if rendered.pixels[center] > 0.01:
                raise RuntimeError(f"{spec.filename} blocks the procedural core aperture.")
    finally:
        bpy.data.images.remove(rendered)


def save_source_file() -> None:
    # Keep every asset centered. Open with the challenger isolated; toggle the
    # other named collections to inspect each boss state without moving it.
    for index, spec in enumerate(RENDERS):
        collection = bpy.data.collections[spec.collection]
        collection.hide_render = index != 0
        collection.hide_viewport = index != 0
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH), check_existing=False)


def main() -> dict[str, object]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    scene = reset_scene()
    materials = make_materials()
    build_challenger(materials)
    build_heir(materials, version=1, is_open=False)
    build_heir(materials, version=1, is_open=True)
    build_heir(materials, version=37, is_open=False)
    build_heir(materials, version=37, is_open=True)
    for spec in RENDERS:
        render_sprite(scene, spec)
    save_source_file()
    print(f"Rendered {len(RENDERS)} sprites to {OUTPUT_DIR}")
    print(f"Saved Blender source to {BLEND_PATH}")
    return {
        "blend_path": str(BLEND_PATH),
        "output_dir": str(OUTPUT_DIR),
        "sprites": [spec.filename for spec in RENDERS],
    }


if __name__ == "__main__" or isinstance(globals().get("args"), dict):
    __result__ = main()
