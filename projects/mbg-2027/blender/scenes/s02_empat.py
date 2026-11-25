import bpy
from kit import *

def build():
    purge()
    setup(1080, 1920, 30, 32)
    FS, FQ = fonts()
    sc = bpy.context.scene
    sc.frame_start = 241
    sc.frame_end = 450

    add_world("#3D7FBE", 0.35)
    add_backdrop([(0.00, "#A9D8F0"), (0.18, "#7FC0E4"),
                  (0.50, "#3D7FBE"), (1.00, "#14508F")], z0=0.0, z1=140.0)
    add_sun((-40, -30, 40), (0, 0, 0), 4.6, "#FFF4E0", 4.0)

    plat = mat_diff("plat", "#2B3A55", 0.90, 0.10)
    wht  = mat_diff("wht",  "#F3F0E8", 0.85, 0.10)
    stl  = mat_diff("stl",  "#C9D6E3", 0.55, 0.25)
    bus  = mat_diff("bus",  "#E8A03C", 0.75, 0.10)
    drk  = mat_diff("drk",  "#22262E", 0.60, 0.20)
    roof = mat_diff("roof", "#B4543C", 0.85, 0.10)
    red  = mat_emit("red",  "#D9483B", 1.0)
    txt  = mat_emit("txt",  "#FFFFFF", 1.0)
    acc  = mat_emit("acc",  "#FFD27F", 1.0)
    sub  = mat_emit("sub",  "#BFD3E6", 0.9)

    cam = add_cam((0, -9, 0), (0, 0, 0), 50.0)
    D = 9.0

    add_box("bg1", (-6.0, 18.0, 1.0), (9.0, 1.0, 16.0), mat_diff("bg1", "#2E6FA8", 0.95, 0.02), bev=0.0)
    add_box("bg2", (5.5, 22.0, -2.0), (11.0, 1.0, 14.0), mat_diff("bg2", "#5C93C4", 0.95, 0.02), bev=0.0)
    add_box("bg3", (-2.0, 28.0, 3.0), (13.0, 1.0, 18.0), mat_diff("bg3", "#8FB6D6", 0.95, 0.02), bev=0.0)

    rig = bpy.data.objects.new("RIG", None)
    bpy.context.collection.objects.link(rig)

    parts = []
    rows = [(1.95, "Infrastruktur"), (0.75, "Kesehatan"),
            (-0.45, "Transportasi"), (-1.65, "Pendidikan & rumah")]

    for i, (z, lab) in enumerate(rows):
        parts.append(add_cyl("plat" + str(i), (-1.28, 0.0, z - 0.10), 0.50, 0.10, plat, 6))

    z = 1.95
    parts.append(add_box("i1", (-1.43, 0.0, z + 0.26), (0.09, 0.09, 0.48), stl))
    parts.append(add_box("i2", (-1.13, 0.0, z + 0.26), (0.09, 0.09, 0.48), stl))
    parts.append(add_box("i3", (-1.28, 0.0, z + 0.54), (0.78, 0.20, 0.09), stl))

    z = 0.75
    parts.append(add_box("h1", (-1.28, 0.0, z + 0.28), (0.62, 0.44, 0.58), wht))
    parts.append(add_box("h2", (-1.28, -0.23, z + 0.34), (0.26, 0.02, 0.08), red))
    parts.append(add_box("h3", (-1.28, -0.23, z + 0.34), (0.08, 0.02, 0.26), red))

    z = -0.45
    parts.append(add_box("b1", (-1.28, 0.0, z + 0.28), (0.78, 0.34, 0.36), bus))
    parts.append(add_box("b2", (-1.28, -0.17, z + 0.34), (0.62, 0.01, 0.14), drk))
    parts.append(add_cyl("w1", (-1.50, 0.0, z + 0.09), 0.08, 0.34, drk, 12, (math.pi/2, 0, 0)))
    parts.append(add_cyl("w2", (-1.06, 0.0, z + 0.09), 0.08, 0.34, drk, 12, (math.pi/2, 0, 0)))

    z = -1.65
    parts.append(add_box("r1", (-1.28, 0.0, z + 0.22), (0.62, 0.50, 0.40), wht))
    parts.append(add_pyr("r2", (-1.28, 0.0, z + 0.50), 0.46, 0.22, roof, math.pi/4, 0.80))

    for o in parts:
        o.parent = rig
        o.matrix_parent_inverse.identity()

    rig.rotation_euler = (0, 0, math.radians(-1.5))
    rig.keyframe_insert("rotation_euler", frame=241)
    rig.rotation_euler = (0, 0, math.radians(1.5))
    rig.keyframe_insert("rotation_euler", frame=450)

    t = world_text("title", "Empat kemungkinan", FS, 66, 0.0, 2.88, txt, cam, D)
    fit(t, cam, D, 0.88)
    t = world_text("big2", "Rp180 T", FS, 120, 0.0, 2.04, acc, cam, D)
    fit(t, cam, D, 0.88)
    for i, (z, lab) in enumerate(rows):
        t = world_text("lab" + str(i), lab, FS, 48, -0.60, z, txt, cam, D, "LEFT")
        fit(t, cam, D, 0.80)
    t = world_text("foot", "untuk salah satu, bukan keempatnya", FQ, 44, 0.0, -2.62, sub, cam, D)
    fit(t, cam, D, 0.88)

    print("SCENE s02 objects", len(bpy.data.objects), flush=True)
