import math

import bpy
from kit import *


def build():
    purge()
    setup(1080, 1920, 30, 32)
    FS, FQ = fonts()
    sc = bpy.context.scene
    sc.frame_start = 241
    sc.frame_end = 450

    add_world("#6FA8CC", 0.45)
    add_backdrop([(0.00, "#DDEFF5"), (0.20, "#A9D2E4"),
                  (0.55, "#5E9BC4"), (1.00, "#1F4F7A")], z0=0.0, z1=180.0)
    add_sun((-40, -30, 40), (0, 0, 0), 4.2, "#FFF6E6", 4.0)

    plat = mat_diff("plat", "#2B3A55", 0.90, 0.10)
    wht = mat_diff("wht", "#F3F0E8", 0.85, 0.10)
    stl = mat_diff("stl", "#C9D6E3", 0.55, 0.25)
    bus = mat_diff("bus", "#E8A03C", 0.75, 0.10)
    drk = mat_diff("drk", "#22262E", 0.60, 0.20)
    roof = mat_diff("roof", "#B4543C", 0.85, 0.10)
    red = mat_emit("red", "#D9483B", 1.0)
    ink = mat_emit("ink", "#12203A", 1.0)
    acc = mat_emit("acc", "#C25A0A", 1.0)
    subi = mat_emit("subi", "#3C5570", 1.0)

    cam = add_cam((0, -9, 0), (0, 0, 0), 50.0)
    D = 9.0

    rig = bpy.data.objects.new("RIG", None)
    bpy.context.collection.objects.link(rig)

    parts = []
    rows = [(1.70, "Infrastruktur"), (0.60, "Kesehatan"),
            (-0.50, "Transportasi"), (-1.60, "Pendidikan & rumah")]

    for i, (z, lab) in enumerate(rows):
        parts.append(add_cyl("plat" + str(i), (-1.05, 0.0, z - 0.05), 0.56, 0.10, plat, 6))

    z = 1.70
    parts.append(add_box("i1", (-1.20, 0.0, z + 0.24), (0.09, 0.09, 0.46), stl))
    parts.append(add_box("i2", (-0.90, 0.0, z + 0.24), (0.09, 0.09, 0.46), stl))
    parts.append(add_box("i3", (-1.05, 0.0, z + 0.50), (0.78, 0.20, 0.09), stl))

    z = 0.60
    parts.append(add_box("h1", (-1.05, 0.0, z + 0.29), (0.62, 0.44, 0.56), wht))
    parts.append(add_box("h2", (-1.05, -0.23, z + 0.35), (0.26, 0.02, 0.08), red))
    parts.append(add_box("h3", (-1.05, -0.23, z + 0.35), (0.08, 0.02, 0.26), red))

    z = -0.50
    parts.append(add_box("b1", (-1.05, 0.0, z + 0.27), (0.78, 0.34, 0.34), bus))
    parts.append(add_box("b2", (-1.05, -0.17, z + 0.32), (0.62, 0.01, 0.13), drk))
    parts.append(add_cyl("w1", (-1.27, 0.0, z + 0.09), 0.075, 0.34, drk, 12, (math.pi / 2, 0, 0)))
    parts.append(add_cyl("w2", (-0.83, 0.0, z + 0.09), 0.075, 0.34, drk, 12, (math.pi / 2, 0, 0)))

    z = -1.60
    parts.append(add_box("r1", (-1.05, 0.0, z + 0.21), (0.64, 0.50, 0.42), wht))
    parts.append(add_pyr("r2", (-1.05, 0.0, z + 0.51), 0.40, 0.24, roof, math.pi / 4, 0.78))

    for o in parts:
        o.parent = rig
        o.matrix_parent_inverse.identity()

    rig.rotation_euler = (0, 0, math.radians(-1.5))
    rig.keyframe_insert("rotation_euler", frame=241)
    rig.rotation_euler = (0, 0, math.radians(1.5))
    rig.keyframe_insert("rotation_euler", frame=450)

    t = world_text("title", "Empat kemungkinan", FS, 64, 0.0, 2.95, ink, cam, D)
    fit(t, cam, D, 0.88)
    t = world_text("sub", "masing-masing menyerap Rp180 triliun", FQ, 40, 0.0, 2.52, subi, cam, D)
    fit(t, cam, D, 0.90)
    for i, (z, lab) in enumerate(rows):
        t = world_text("lab" + str(i), lab, FS, 44, -0.28, z, ink, cam, D, "LEFT")
        fit(t, cam, D, 0.80)
    t = world_text("foot", "Kita tidak menjumlahkannya.", FQ, 40, 0.0, -2.56, subi, cam, D)
    fit(t, cam, D, 0.90)

    print("SCENE s02 objects", len(bpy.data.objects), flush=True)
