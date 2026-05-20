import math
import os
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "models"


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def mat(name, color, roughness=0.75, metallic=0.0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    bsdf = next(
        (
            node
            for node in material.node_tree.nodes
            if node.bl_idname == "ShaderNodeBsdfPrincipled"
        ),
        None,
    )
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = color
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = color[3]
            material.blend_method = "BLEND" if color[3] < 1 else "OPAQUE"
    return material


def cube(name, loc, scale, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    return obj


def cylinder(name, loc, radius, depth, material, vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    if material:
        obj.data.materials.append(material)
    return obj


def cone(name, loc, radius1, radius2, depth, material, vertices=8, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius1,
        radius2=radius2,
        depth=depth,
        location=loc,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    if material:
        obj.data.materials.append(material)
    return obj


def sphere(name, loc, radius, material, segments=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=6, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    if material:
        obj.data.materials.append(material)
    return obj


def gable_roof(name, width, depth, height, z_base, material):
    w = width / 2
    d = depth / 2
    vertices = [
        (-w, -d, z_base), (w, -d, z_base), (0, -d, z_base + height),
        (-w, d, z_base), (w, d, z_base), (0, d, z_base + height),
    ]
    faces = [
        (0, 1, 2),
        (3, 5, 4),
        (0, 3, 4, 1),
        (1, 4, 5, 2),
        (2, 5, 3, 0),
    ]
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def awning(name, x, y, z, width, material_a, material_b):
    group = []
    stripe_count = 7
    stripe_width = width / stripe_count
    for i in range(stripe_count):
        material = material_a if i % 2 == 0 else material_b
        stripe = cube(
            f"{name}_stripe_{i}",
            (x - width / 2 + stripe_width * i + stripe_width / 2, y, z),
            (stripe_width, 0.14, 1.1),
            material,
        )
        stripe.rotation_euler[0] = math.radians(8)
        group.append(stripe)
    return group


def set_origin_floor_center():
    for obj in bpy.context.scene.objects:
        obj.select_set(True)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR", center="MEDIAN")


def export_asset(filename):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUT_DIR / filename),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        use_selection=False,
    )


def base_materials():
    return {
        "cream": mat("Warm Cream", (0.82, 0.75, 0.62, 1)),
        "white": mat("Soft White", (0.93, 0.90, 0.82, 1)),
        "roof_red": mat("Roof Red", (0.55, 0.12, 0.10, 1)),
        "roof_blue": mat("Roof Blue", (0.10, 0.23, 0.34, 1)),
        "brick": mat("Brick", (0.62, 0.23, 0.16, 1)),
        "wood": mat("Warm Wood", (0.50, 0.28, 0.13, 1)),
        "dark_wood": mat("Dark Wood", (0.24, 0.13, 0.07, 1)),
        "glass": mat("Glass Blue", (0.42, 0.72, 0.88, 0.72), roughness=0.2, metallic=0.0),
        "road": mat("Soft Asphalt", (0.20, 0.21, 0.22, 1)),
        "black_metal": mat("Black Metal", (0.07, 0.08, 0.08, 1), roughness=0.46, metallic=0.55),
        "stone": mat("Warm Stone", (0.64, 0.59, 0.50, 1)),
        "green": mat("Leaf Green", (0.20, 0.45, 0.18, 1)),
        "green_light": mat("Leaf Light", (0.44, 0.66, 0.26, 1)),
        "yellow": mat("Taxi Yellow", (1.0, 0.70, 0.05, 1)),
        "gold": mat("Soft Gold", (0.92, 0.62, 0.18, 1)),
        "red": mat("Produce Red", (0.75, 0.14, 0.10, 1)),
        "blue": mat("Store Blue", (0.18, 0.40, 0.60, 1)),
        "stripe": mat("Canvas Stripe", (0.92, 0.86, 0.72, 1)),
        "water": mat("Lake Blue", (0.28, 0.56, 0.82, 1), roughness=0.35),
        "cloud": mat("Warm Cloud", (0.96, 0.86, 0.72, 1)),
        "mountain": mat("Soft Mountain", (0.42, 0.51, 0.46, 1)),
    }


def create_cottage():
    reset_scene()
    m = base_materials()
    cube("Cottage_Walls", (0, 0, 1.7), (6.2, 5.2, 3.4), m["cream"])
    gable_roof("Cottage_Gable_Roof", 7.2, 6.3, 2.4, 3.4, m["roof_red"])
    cube("Cottage_Door", (0, -2.64, 1.1), (1.0, 0.16, 2.0), m["dark_wood"])
    for x in (-2.1, 2.1):
        cube(f"Cottage_Window_{x}", (x, -2.66, 2.0), (1.1, 0.14, 1.0), m["glass"])
        cube(f"Cottage_Window_Frame_{x}", (x, -2.74, 2.0), (1.34, 0.08, 1.22), m["white"])
    cube("Cottage_Porch", (0, -3.4, 0.18), (4.8, 1.8, 0.36), m["stone"])
    for x in (-1.8, 1.8):
        cylinder(f"Cottage_Porch_Post_{x}", (x, -3.55, 1.45), 0.09, 2.5, m["white"], vertices=8)
    gable_roof("Cottage_Porch_Roof", 5.1, 2.0, 0.9, 2.45, m["roof_red"]).location.y = -3.55
    cube("Cottage_Chimney", (2.0, 1.3, 4.35), (0.65, 0.65, 1.7), m["brick"])
    for x in (-3.7, 3.7):
        for i in range(5):
            cube(f"Cottage_Fence_{x}_{i}", (x, -2.6 + i * 1.05, 0.45), (0.16, 0.12, 0.9), m["white"])
    export_asset("cottage-house.glb")


def create_supermarket():
    reset_scene()
    m = base_materials()
    cube("Supermarket_Main", (0, 0, 2.3), (9.5, 5.2, 4.6), m["blue"])
    cube("Supermarket_Flat_Roof", (0, 0, 4.85), (10.3, 5.8, 0.5), m["stone"])
    cube("Supermarket_Glass_Front", (0, -2.66, 2.25), (7.2, 0.16, 2.9), m["glass"])
    cube("Supermarket_Door", (0, -2.78, 1.3), (1.35, 0.14, 2.3), m["dark_wood"])
    cube("Supermarket_Sign", (0, -2.94, 4.2), (7.8, 0.18, 0.72), m["gold"])
    awning("Supermarket_Awning", 0, -3.15, 3.28, 7.8, m["stripe"], m["gold"])
    cube("Supermarket_Back_Window_A", (-2.4, 2.66, 2.75), (1.5, 0.14, 1.2), m["glass"])
    cube("Supermarket_Back_Window_B", (2.4, 2.66, 2.75), (1.5, 0.14, 1.2), m["glass"])
    cube("Supermarket_Back_Sign", (0, 2.78, 4.05), (5.8, 0.16, 0.58), m["gold"])
    for x in (-4.84, 4.84):
        cube(f"Supermarket_Side_Window_{x}_A", (x, -0.9, 2.65), (0.14, 1.35, 1.2), m["glass"])
        cube(f"Supermarket_Side_Window_{x}_B", (x, 0.95, 2.65), (0.14, 1.35, 1.2), m["glass"])
        cube(f"Supermarket_Side_Trim_{x}", (x, 0.0, 4.08), (0.16, 3.8, 0.42), m["gold"])
    for i, x in enumerate((-3.4, -2.2, 2.2, 3.4)):
        cube(f"Supermarket_Crate_{i}", (x, -3.65, 0.48), (0.9, 0.7, 0.55), m["wood"])
        sphere(f"Supermarket_Produce_{i}", (x, -3.65, 0.9), 0.22, m["red" if i % 2 else "green_light"], segments=8)
    for i, y in enumerate((-1.6, -0.5, 0.6, 1.7)):
        cube(f"Supermarket_Side_Crate_{i}", (-5.15, y, 0.44), (0.52, 0.78, 0.5), m["wood"])
        sphere(f"Supermarket_Side_Produce_{i}", (-5.18, y, 0.82), 0.18, m["gold" if i % 2 else "red"], segments=8)
    export_asset("supermarket-store.glb")


def create_school():
    reset_scene()
    m = base_materials()
    cube("School_Main", (0, 0, 3.0), (11.5, 6.8, 6.0), m["brick"])
    gable_roof("School_Main_Roof", 12.2, 7.4, 2.0, 6.0, m["roof_red"])
    cube("School_Entry", (0, -3.65, 2.3), (4.4, 1.2, 4.6), m["stone"])
    cube("School_Door", (0, -4.25, 1.45), (1.5, 0.16, 2.7), m["dark_wood"])
    for x in (-4.2, -2.1, 2.1, 4.2):
        cube(f"School_Window_{x}", (x, -3.48, 3.4), (1.0, 0.12, 1.3), m["glass"])
    cube("School_Tower", (0, -0.3, 8.0), (3.2, 3.2, 4.0), m["brick"])
    cone("School_Tower_Roof", (0, -0.3, 10.7), 2.3, 0.0, 1.8, m["roof_red"], vertices=4, rotation=(0, 0, math.radians(45)))
    cylinder("School_Clock_Face", (0, -1.94, 8.35), 0.72, 0.1, m["white"], vertices=24)
    export_asset("school-clocktower.glb")


def create_market_stall():
    reset_scene()
    m = base_materials()
    for x in (-2.2, 2.2):
        for y in (-1.4, 1.4):
            cylinder(f"Stall_Post_{x}_{y}", (x, y, 1.7), 0.08, 3.4, m["wood"], vertices=8)
    cube("Stall_Table", (0, 0, 0.82), (4.9, 2.4, 0.42), m["wood"])
    awning("Stall_Roof", 0, 0, 3.45, 5.2, m["stripe"], m["green"])
    for i, x in enumerate((-1.7, -0.55, 0.55, 1.7)):
        cube(f"Stall_Crate_{i}", (x, -0.15, 1.2), (0.9, 0.9, 0.45), m["dark_wood"])
        for j in range(4):
            sphere(f"Stall_Produce_{i}_{j}", (x - 0.25 + j * 0.17, -0.2, 1.55), 0.13, m["red" if (i + j) % 2 else "green_light"], segments=8)
    export_asset("market-stall.glb")


def create_corner_cafe():
    reset_scene()
    m = base_materials()
    cube("Cafe_Main", (0, 0, 2.45), (7.4, 5.0, 4.9), m["green"])
    cube("Cafe_Roof_Slab", (0, 0, 5.08), (8.2, 5.8, 0.42), m["stone"])
    cube("Cafe_Front_Glass_Left", (-2.05, -2.56, 2.35), (1.7, 0.14, 2.5), m["glass"])
    cube("Cafe_Front_Glass_Right", (2.05, -2.56, 2.35), (1.7, 0.14, 2.5), m["glass"])
    cube("Cafe_Door", (0, -2.66, 1.45), (1.25, 0.14, 2.65), m["dark_wood"])
    cube("Cafe_Sign", (0, -2.82, 4.28), (5.7, 0.18, 0.68), m["gold"])
    awning("Cafe_Awning", 0, -3.06, 3.28, 6.7, m["stripe"], m["green_light"])
    for x in (-3.82, 3.82):
        cube(f"Cafe_Side_Window_{x}_A", (x, -0.8, 2.7), (0.14, 1.35, 1.2), m["glass"])
        cube(f"Cafe_Side_Window_{x}_B", (x, 1.0, 2.7), (0.14, 1.35, 1.2), m["glass"])
    for i, x in enumerate((-2.7, -1.45, 1.45, 2.7)):
        cube(f"Cafe_Crate_{i}", (x, -3.56, 0.42), (0.82, 0.62, 0.48), m["wood"])
        sphere(f"Cafe_Flower_{i}", (x, -3.58, 0.86), 0.18, m["red" if i % 2 else "gold"], segments=8)
    cylinder("Cafe_Table", (-2.6, -4.15, 0.64), 0.45, 0.14, m["wood"], vertices=12)
    cylinder("Cafe_Table_Post", (-2.6, -4.15, 0.35), 0.07, 0.7, m["dark_wood"], vertices=8)
    for i, x in enumerate((-3.25, -1.95)):
        cube(f"Cafe_Chair_{i}", (x, -4.16, 0.42), (0.45, 0.45, 0.28), m["wood"])
    cone("Cafe_Umbrella", (2.55, -4.05, 2.0), 1.05, 0.12, 0.55, m["gold"], vertices=12)
    cylinder("Cafe_Umbrella_Post", (2.55, -4.05, 1.0), 0.06, 2.0, m["wood"], vertices=8)
    export_asset("corner-cafe.glb")


def create_cafe_terrace():
    reset_scene()
    m = base_materials()
    cube("Terrace_Deck", (0, 0, 0.08), (5.8, 3.8, 0.16), m["stone"])

    for x in (-2.55, 2.55):
        for y in (-1.55, 1.55):
            cylinder(f"Terrace_Pergola_Post_{x}_{y}", (x, y, 1.55), 0.07, 3.1, m["wood"], vertices=8)

    for y in (-1.55, 1.55):
        cube(f"Terrace_Pergola_Beam_{y}", (0, y, 3.1), (5.5, 0.14, 0.18), m["dark_wood"])

    for x in (-1.7, 0, 1.7):
        cube(f"Terrace_Awning_Frame_{x}", (x, 0, 3.26), (0.12, 3.5, 0.16), m["wood"])
    awning("Terrace_Canvas", 0, 0, 3.45, 5.5, m["stripe"], m["green_light"])

    table_positions = [(-1.55, -0.75), (1.35, -0.65), (-0.1, 0.85)]
    for i, (x, y) in enumerate(table_positions):
        cylinder(f"Terrace_Table_{i}", (x, y, 0.72), 0.45, 0.12, m["wood"], vertices=12)
        cylinder(f"Terrace_Table_Post_{i}", (x, y, 0.4), 0.06, 0.7, m["dark_wood"], vertices=8)
        for j, (cx, cy) in enumerate(((x - 0.62, y), (x + 0.62, y), (x, y - 0.58))):
            cube(f"Terrace_Chair_{i}_{j}", (cx, cy, 0.42), (0.42, 0.38, 0.28), m["wood"])
            cube(f"Terrace_Chair_Back_{i}_{j}", (cx, cy + 0.12, 0.72), (0.42, 0.08, 0.55), m["dark_wood"])

    cube("Terrace_Chalkboard", (-2.65, -1.95, 0.85), (0.16, 0.12, 1.4), m["dark_wood"])
    cube("Terrace_Chalkboard_Face", (-2.65, -2.02, 0.95), (1.1, 0.08, 0.82), m["road"])
    for i, x in enumerate((-2.2, 2.2)):
        cube(f"Terrace_Planter_{i}", (x, 1.95, 0.38), (0.9, 0.52, 0.55), m["stone"])
        sphere(f"Terrace_Flower_{i}_A", (x - 0.18, 1.95, 0.82), 0.14, m["red"], segments=8)
        sphere(f"Terrace_Flower_{i}_B", (x + 0.18, 1.95, 0.82), 0.14, m["gold"], segments=8)

    export_asset("cafe-terrace.glb")


def create_market_decor():
    reset_scene()
    m = base_materials()
    cube("Market_Decor_Base", (0, 0, 0.08), (6.8, 2.5, 0.16), m["stone"])

    for i, x in enumerate((-2.4, -1.25, 0, 1.25, 2.4)):
        cube(f"Market_Crate_{i}", (x, -0.4 + (i % 2) * 0.45, 0.45), (0.9, 0.72, 0.55), m["wood"])
        for j in range(5):
            sphere(
                f"Market_Produce_{i}_{j}",
                (x - 0.25 + j * 0.13, -0.42 + (i % 2) * 0.45, 0.86 + (j % 2) * 0.05),
                0.12,
                m["red" if (i + j) % 3 == 0 else "green_light" if (i + j) % 3 == 1 else "gold"],
                segments=8,
            )

    for x in (-3.15, 3.15):
        cylinder(f"Market_Banner_Post_{x}", (x, 0.95, 1.55), 0.07, 3.1, m["wood"], vertices=8)
    cube("Market_Banner_Rope", (0, 0.95, 2.95), (6.3, 0.06, 0.06), m["dark_wood"])
    for i, x in enumerate((-2.45, -1.65, -0.85, -0.05, 0.75, 1.55, 2.35)):
        cone(
            f"Market_Bunting_{i}",
            (x, 0.95, 2.66),
            0.22,
            0,
            0.42,
            m["gold" if i % 2 == 0 else "green_light"],
            vertices=3,
            rotation=(math.radians(180), 0, math.radians(30)),
        )

    cube("Market_Sign_Board", (0, -1.55, 1.32), (2.3, 0.14, 0.74), m["gold"])
    cylinder("Market_Sign_Post_Left", (-0.92, -1.55, 0.75), 0.05, 1.5, m["wood"], vertices=8)
    cylinder("Market_Sign_Post_Right", (0.92, -1.55, 0.75), 0.05, 1.5, m["wood"], vertices=8)
    export_asset("market-decor.glb")


def create_lakeside_gazebo():
    reset_scene()
    m = base_materials()
    cylinder("Gazebo_Base", (0, 0, 0.18), 2.1, 0.36, m["stone"], vertices=12)
    for i in range(8):
        angle = (math.pi * 2 * i) / 8
        x = math.cos(angle) * 1.65
        y = math.sin(angle) * 1.65
        cylinder(f"Gazebo_Post_{i}", (x, y, 1.65), 0.07, 3.0, m["white"], vertices=8)
    cone("Gazebo_Roof", (0, 0, 3.45), 2.45, 0.12, 1.25, m["roof_red"], vertices=8)
    cylinder("Gazebo_Roof_Cap", (0, 0, 4.18), 0.22, 0.16, m["gold"], vertices=12)
    for i in range(4):
        angle = (math.pi * 2 * i) / 4 + math.pi / 4
        x = math.cos(angle) * 1.2
        y = math.sin(angle) * 1.2
        bench = cube(f"Gazebo_Bench_{i}", (x, y, 0.68), (1.0, 0.28, 0.22), m["wood"])
        bench.rotation_euler[2] = angle
    export_asset("lakeside-gazebo.glb")


def create_cottage_yard():
    reset_scene()
    m = base_materials()
    cube("Yard_Path", (0, 0, 0.06), (1.15, 4.6, 0.12), m["stone"])

    for x in (-2.8, 2.8):
        for y in (-2.2, -1.25, -0.3, 0.65, 1.6, 2.55):
            cube(f"Yard_Fence_Post_{x}_{y}", (x, y, 0.48), (0.14, 0.14, 0.95), m["white"])
        cube(f"Yard_Fence_Rail_A_{x}", (x, 0.2, 0.68), (0.12, 5.0, 0.12), m["white"])
        cube(f"Yard_Fence_Rail_B_{x}", (x, 0.2, 0.36), (0.12, 5.0, 0.12), m["white"])

    for i, x in enumerate((-1.85, -1.15, 1.15, 1.85)):
        cube(f"Yard_Flowerbed_{i}", (x, -1.95, 0.24), (0.55, 0.85, 0.28), m["wood"])
        sphere(f"Yard_Flower_{i}_A", (x - 0.12, -1.95, 0.52), 0.12, m["red"], segments=8)
        sphere(f"Yard_Flower_{i}_B", (x + 0.12, -1.95, 0.52), 0.12, m["gold"], segments=8)

    cube("Yard_Mailbox_Post", (-2.0, 2.55, 0.48), (0.12, 0.12, 0.96), m["wood"])
    cube("Yard_Mailbox", (-2.0, 2.55, 1.05), (0.62, 0.34, 0.32), m["blue"])
    cube("Yard_Mailbox_Flag", (-1.62, 2.55, 1.18), (0.08, 0.08, 0.42), m["red"])
    export_asset("cottage-yard.glb")


def create_main_street_row():
    reset_scene()
    m = base_materials()
    cube("MainStreet_Sidewalk", (0, -2.95, 0.08), (16.8, 1.9, 0.16), m["stone"])

    modules = [
        ("Bakery", -5.4, 4.6, 4.5, m["cream"], m["roof_red"], m["gold"]),
        ("Clinic", 0.0, 4.9, 5.2, m["white"], m["roof_blue"], m["green_light"]),
        ("Bookshop", 5.45, 4.7, 4.8, m["brick"], m["roof_red"], m["blue"]),
    ]

    for name, x, width, height, wall_mat, roof_mat, accent_mat in modules:
        cube(f"MainStreet_{name}_Wall", (x, 0, height / 2), (width, 4.4, height), wall_mat)
        cube(f"MainStreet_{name}_Cornice", (x, -2.34, height + 0.18), (width + 0.45, 0.22, 0.35), accent_mat)
        if name == "Clinic":
            cube(f"MainStreet_{name}_FlatRoof", (x, 0, height + 0.48), (width + 0.55, 4.85, 0.62), roof_mat)
        else:
            roof = gable_roof(f"MainStreet_{name}_GableRoof", width + 0.7, 4.9, 1.35, height, roof_mat)
            roof.location.x = x

        cube(f"MainStreet_{name}_Door", (x, -2.32, 1.18), (1.02, 0.16, 2.18), m["dark_wood"])
        for i, wx in enumerate((-width * 0.28, width * 0.28)):
            cube(f"MainStreet_{name}_Window_{i}", (x + wx, -2.38, 2.65), (1.02, 0.13, 1.05), m["glass"])
            cube(f"MainStreet_{name}_Window_Frame_{i}", (x + wx, -2.45, 2.65), (1.24, 0.08, 1.22), m["white"])
            cube(f"MainStreet_{name}_Upper_Window_{i}", (x + wx, -2.38, height - 1.05), (0.92, 0.13, 0.86), m["glass"])
            cube(f"MainStreet_{name}_Upper_Frame_{i}", (x + wx, -2.45, height - 1.05), (1.12, 0.08, 1.04), m["white"])

        cube(f"MainStreet_{name}_Sign", (x, -2.52, height - 0.38), (width * 0.72, 0.16, 0.55), accent_mat)
        awning(f"MainStreet_{name}_Awning", x, -2.72, 3.28, width * 0.82, m["stripe"], accent_mat)

        for px in (-width * 0.36, width * 0.36):
            cube(f"MainStreet_{name}_Planter_{px}", (x + px, -3.58, 0.36), (0.74, 0.42, 0.48), m["stone"])
            sphere(f"MainStreet_{name}_Flower_A_{px}", (x + px - 0.16, -3.58, 0.74), 0.13, m["red"], segments=8)
            sphere(f"MainStreet_{name}_Flower_B_{px}", (x + px + 0.16, -3.58, 0.74), 0.13, m["gold"], segments=8)

    for x in (-7.9, -2.7, 2.7, 7.9):
        cylinder(f"MainStreet_Lamp_Post_{x}", (x, -3.72, 1.7), 0.06, 3.4, m["black_metal"], vertices=8)
        sphere(f"MainStreet_Lamp_Globe_{x}", (x, -3.72, 3.5), 0.28, m["cloud"], segments=10)

    export_asset("main-street-row.glb")


def create_street_detail_kit():
    reset_scene()
    m = base_materials()
    cube("StreetKit_Curb", (0, 0, 0.08), (7.4, 0.42, 0.16), m["stone"])
    cube("StreetKit_Pavement", (0, 0.92, 0.06), (7.4, 1.4, 0.12), m["stone"])

    for x in (-3.0, 3.0):
        cylinder(f"StreetKit_Bollard_{x}", (x, -0.35, 0.45), 0.12, 0.9, m["black_metal"], vertices=8)
        cube(f"StreetKit_Bollard_Band_{x}", (x, -0.35, 0.72), (0.26, 0.26, 0.08), m["gold"])

    cylinder("StreetKit_Lamp_Post", (-1.95, 0.64, 1.85), 0.07, 3.7, m["black_metal"], vertices=8)
    cube("StreetKit_Lamp_Arm", (-1.55, 0.64, 3.54), (0.9, 0.08, 0.08), m["black_metal"])
    sphere("StreetKit_Lamp_Globe", (-1.02, 0.64, 3.42), 0.28, m["cloud"], segments=10)

    cylinder("StreetKit_Sign_Post", (1.25, 0.62, 1.0), 0.06, 2.0, m["wood"], vertices=8)
    cube("StreetKit_Sign_Board", (1.25, 0.62, 2.0), (1.5, 0.14, 0.68), m["gold"])
    cone("StreetKit_Sign_Arrow", (1.78, 0.64, 2.02), 0.2, 0, 0.42, m["green_light"], vertices=3, rotation=(0, math.radians(90), -math.pi / 2))

    cube("StreetKit_Newsstand_Base", (2.68, 0.86, 0.58), (0.9, 0.65, 1.0), m["blue"])
    cube("StreetKit_Newsstand_Face", (2.68, 0.48, 1.02), (0.72, 0.1, 0.48), m["glass"])
    cube("StreetKit_Newsstand_Roof", (2.68, 0.86, 1.25), (1.05, 0.78, 0.16), m["roof_red"])

    for i, x in enumerate((-0.6, 0.05, 0.7)):
        cube(f"StreetKit_Crate_{i}", (x, 0.72, 0.34), (0.55, 0.52, 0.48), m["wood"])
        sphere(f"StreetKit_Crate_Produce_{i}", (x, 0.72, 0.7), 0.13, m["red" if i % 2 == 0 else "green_light"], segments=8)

    export_asset("street-detail-kit.glb")


def create_foreground_garden():
    reset_scene()
    m = base_materials()
    cube("Foreground_Garden_Bed", (0, 0, 0.08), (9.2, 3.1, 0.16), m["green_light"])
    cube("Foreground_Path", (0, -1.05, 0.12), (8.8, 0.82, 0.12), m["stone"])

    for x in (-4.35, -3.25, -2.15, 2.15, 3.25, 4.35):
        cube(f"Foreground_Fence_Post_{x}", (x, 1.58, 0.52), (0.12, 0.12, 1.04), m["white"])
    cube("Foreground_Fence_Rail_Top", (0, 1.58, 0.74), (8.9, 0.12, 0.12), m["white"])
    cube("Foreground_Fence_Rail_Bottom", (0, 1.58, 0.38), (8.9, 0.12, 0.1), m["white"])

    for i, x in enumerate((-3.5, -2.4, -1.2, 0.0, 1.2, 2.4, 3.5)):
        sphere(f"Foreground_Shrub_{i}", (x, 0.45 + (i % 2) * 0.28, 0.62), 0.46, m["green" if i % 2 else "green_light"], segments=8)
        sphere(f"Foreground_Flower_{i}_A", (x - 0.16, 0.18 + (i % 2) * 0.28, 1.03), 0.1, m["gold"], segments=8)
        sphere(f"Foreground_Flower_{i}_B", (x + 0.18, 0.18 + (i % 2) * 0.28, 0.98), 0.1, m["red"], segments=8)

    for x in (-3.7, 3.7):
        cylinder(f"Foreground_SmallTree_Trunk_{x}", (x, -0.55, 0.78), 0.12, 1.56, m["wood"], vertices=7)
        sphere(f"Foreground_SmallTree_Crown_{x}", (x, -0.55, 1.82), 0.72, m["green"], segments=8)

    export_asset("foreground-garden.glb")


def create_townsperson():
    reset_scene()
    m = base_materials()
    cylinder("Townsperson_Legs", (0, 0, 0.52), 0.18, 1.04, m["road"], vertices=8)
    cube("Townsperson_Body", (0, 0, 1.28), (0.58, 0.42, 0.92), m["blue"])
    sphere("Townsperson_Head", (0, -0.02, 1.98), 0.33, m["cream"], segments=12)
    cube("Townsperson_Hair", (0, -0.04, 2.26), (0.58, 0.48, 0.18), m["dark_wood"])
    for x in (-0.42, 0.42):
        cylinder(f"Townsperson_Arm_{x}", (x, 0, 1.25), 0.07, 0.72, m["cream"], vertices=8).rotation_euler[1] = math.radians(8 if x < 0 else -8)
    export_asset("townsperson.glb")


def create_farm_barn():
    reset_scene()
    m = base_materials()
    cube("Barn_Main", (0, 0, 2.1), (6.2, 5.5, 4.2), m["brick"])
    gable_roof("Barn_Roof", 7.2, 6.4, 2.3, 4.2, m["roof_red"])
    cube("Barn_Door", (0, -2.84, 1.7), (2.2, 0.16, 3.0), m["dark_wood"])
    cube("Barn_Cross_A", (0, -2.94, 1.7), (2.45, 0.12, 0.16), m["white"]).rotation_euler[1] = math.radians(35)
    cube("Barn_Cross_B", (0, -2.94, 1.7), (2.45, 0.12, 0.16), m["white"]).rotation_euler[1] = math.radians(-35)
    cylinder("Barn_Silo", (4.4, 0.4, 2.7), 0.9, 5.4, m["stone"], vertices=16)
    cone("Barn_Silo_Roof", (4.4, 0.4, 5.75), 1.05, 0, 0.9, m["roof_blue"], vertices=16)
    export_asset("farm-barn.glb")


def create_taxi():
    reset_scene()
    m = base_materials()
    cube("Taxi_Body", (0, 0, 0.55), (1.9, 4.0, 0.72), m["yellow"])
    cube("Taxi_Cabin", (0, -0.35, 1.12), (1.65, 2.0, 0.95), m["yellow"])
    cube("Taxi_Front_Glass", (0, -1.42, 1.18), (1.35, 0.08, 0.62), m["glass"])
    cube("Taxi_Back_Glass", (0, 0.72, 1.18), (1.35, 0.08, 0.62), m["glass"])
    cube("Taxi_Checker", (0, -0.95, 0.95), (1.96, 0.18, 0.18), m["road"])
    cube("Taxi_Sign", (0, -0.35, 1.72), (0.82, 0.34, 0.24), m["gold"])
    for x in (-1.08, 1.08):
        for y in (-1.38, 1.38):
            cylinder(f"Taxi_Wheel_{x}_{y}", (x, y, 0.35), 0.34, 0.28, m["road"], vertices=16).rotation_euler[1] = math.radians(90)
    export_asset("taxi-cab.glb")


def create_tree_oak():
    reset_scene()
    m = base_materials()
    cylinder("Oak_Trunk", (0, 0, 1.25), 0.28, 2.5, m["wood"], vertices=7)
    sphere("Oak_Crown_A", (0, 0, 3.0), 1.25, m["green"], segments=10)
    sphere("Oak_Crown_B", (-0.55, 0.25, 2.75), 0.8, m["green_light"], segments=10)
    sphere("Oak_Crown_C", (0.6, -0.18, 2.85), 0.75, m["green"], segments=10)
    export_asset("tree-oak.glb")


def create_tree_pine():
    reset_scene()
    m = base_materials()
    cylinder("Pine_Trunk", (0, 0, 1.05), 0.2, 2.1, m["wood"], vertices=7)
    cone("Pine_Crown_Low", (0, 0, 2.2), 1.25, 0, 1.8, m["green"], vertices=7)
    cone("Pine_Crown_Mid", (0, 0, 3.0), 1.0, 0, 1.7, m["green_light"], vertices=7)
    cone("Pine_Crown_Top", (0, 0, 3.75), 0.75, 0, 1.5, m["green"], vertices=7)
    export_asset("tree-pine.glb")


def create_bench():
    reset_scene()
    m = base_materials()
    cube("Bench_Seat", (0, 0, 0.58), (2.4, 0.55, 0.22), m["wood"])
    cube("Bench_Back", (0, 0.33, 1.0), (2.4, 0.22, 0.8), m["dark_wood"])
    for x in (-0.85, 0.85):
        cube(f"Bench_Leg_{x}_A", (x, -0.16, 0.28), (0.18, 0.18, 0.56), m["road"])
        cube(f"Bench_Leg_{x}_B", (x, 0.22, 0.28), (0.18, 0.18, 0.56), m["road"])
    export_asset("bench.glb")


def create_planter():
    reset_scene()
    m = base_materials()
    cube("Planter_Box", (0, 0, 0.35), (1.5, 1.0, 0.7), m["stone"])
    cube("Planter_Soil", (0, 0, 0.74), (1.16, 0.7, 0.12), m["dark_wood"])
    for i, x in enumerate((-0.38, 0, 0.38)):
        sphere(f"Planter_Flower_{i}", (x, 0.02 * i, 1.02), 0.16, m["red" if i % 2 else "gold"], segments=8)
        cylinder(f"Planter_Stem_{i}", (x, 0.02 * i, 0.9), 0.025, 0.35, m["green"], vertices=6)
    export_asset("planter.glb")


def create_water_tower():
    reset_scene()
    m = base_materials()
    for x in (-1.0, 1.0):
        for y in (-1.0, 1.0):
            post = cylinder(f"WaterTower_Leg_{x}_{y}", (x, y, 3.0), 0.08, 6.0, m["wood"], vertices=6)
            post.rotation_euler[0] = math.radians(4 if x * y > 0 else -4)
    cylinder("WaterTower_Tank", (0, 0, 6.4), 1.35, 2.1, m["wood"], vertices=16)
    cone("WaterTower_Roof", (0, 0, 7.75), 1.5, 0, 0.7, m["roof_blue"], vertices=16)
    cube("WaterTower_Deck", (0, 0, 5.25), (3.2, 3.2, 0.18), m["dark_wood"])
    export_asset("water-tower.glb")


def create_cloud():
    reset_scene()
    m = base_materials()
    sphere("Cloud_A", (-0.9, 0, 0), 0.7, m["cloud"], segments=10)
    sphere("Cloud_B", (0, 0, 0.18), 1.0, m["cloud"], segments=10)
    sphere("Cloud_C", (0.95, 0, 0.05), 0.75, m["cloud"], segments=10)
    sphere("Cloud_D", (0.35, 0, 0.55), 0.62, m["cloud"], segments=10)
    export_asset("cloud-puff.glb")


def create_mountain_slice():
    reset_scene()
    m = base_materials()
    for i, x in enumerate((-5.2, -2.4, 0.4, 3.2, 5.8)):
        cone(f"Mountain_{i}", (x, 0, 2.3 + i * 0.12), 2.8 + (i % 2) * 0.8, 0, 4.6 + (i % 2) * 1.1, m["mountain"], vertices=5)
    cube("Lake_Strip", (0, -1.9, 0.05), (14.0, 2.0, 0.1), m["water"])
    export_asset("mountain-lake-slice.glb")


def main():
    creators = [
        create_cottage,
        create_supermarket,
        create_school,
        create_market_stall,
        create_corner_cafe,
        create_cafe_terrace,
        create_market_decor,
        create_lakeside_gazebo,
        create_cottage_yard,
        create_main_street_row,
        create_street_detail_kit,
        create_foreground_garden,
        create_townsperson,
        create_farm_barn,
        create_taxi,
        create_tree_oak,
        create_tree_pine,
        create_bench,
        create_planter,
        create_water_tower,
        create_cloud,
        create_mountain_slice,
    ]

    for create in creators:
        create()

    print(f"Generated {len(creators)} GLB assets in {OUT_DIR}")


if __name__ == "__main__":
    main()
