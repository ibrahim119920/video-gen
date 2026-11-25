import math

import bpy
from kit import *
from scenes._shared import overlay


def build(n=210):
    purge()
    setup(1080, 1920, 30, 32)
    FS, FQ = fonts()
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end = n

    add_world("#5A3A44", 0.40)
    add_backdrop([(0.00, "#F7D9AE"), (0.16, "#E8A878"),
                  (0.45, "#8A5560"), (1.00, "#2A2032")], z0=0.0, z1=150.0)
    add_sun((-35, 20, 12), (0, 10, 3), 3.6, "#FFD9B0", 6.0)

    gnd = mat_diff("gnd", "#2A2230", 0.95, 0.05)
    wallA = mat_diff("wallA", "#EFE0C8", 0.88, 0.10)
    wallB = mat_diff("wallB", "#E5D2B4", 0.88, 0.10)
    roofA = mat_diff("roofA", "#B4543C", 0.88, 0.10)
    roofB = mat_diff("roofB", "#8E5A46", 0.88, 0.10)
    school = mat_diff("school", "#E9EDE4", 0.85, 0.10)
    flag = mat_emit("flag", "#D9483B", 1.0)
    pale = mat_emit("pale", "#FFE2B8", 1.0)

    add_ground(gnd, 900.0, 0.0)

    for k in range(5):
        y = 3.0 + k * 4.6
        x = -3.0 if k % 2 == 0 else 2.6
        w = wallA if k % 3 else wallB
        r = roofA if k % 2 == 0 else roofB
        add_box("h%d" % k, (x, y, 1.25), (2.4, 3.0, 2.5), w)
        add_pyr("hr%d" % k, (x, y, 3.05), 2.0, 1.1, r, math.pi / 4, 1.25)

    add_box("school", (6.0, 26.0, 2.4), (9.0, 7.0, 4.8), school)
    add_box("scwin", (6.0, 22.56, 2.9), (7.0, 0.10, 1.0), pale, bev=0.0)
    add_box("pole", (1.6, 24.0, 4.2), (0.10, 0.10, 8.4), pale, bev=0.0)
    add_box("flag", (2.4, 24.0, 7.6), (1.6, 0.06, 0.9), flag, bev=0.0)

    cam = add_cam((11.0, -9.0, 4.6), (0.0, 16.0, 2.6), 35.0)
    push_cam(cam, (11.0, -9.0, 4.6), (11.0, -5.0, 4.6), n)

    hud = mat_emit("o_hud", "#D6BCA8", 0.9)
    bigm = mat_emit("o_big", "#FFF3E2", 1.0)
    subm = mat_emit("o_sub", "#EBD6C2", 0.9)
    acc = mat_emit("o_acc", "#F0A44F", 1.0)
    src = mat_emit("o_src", "#A89184", 1.0)

    overlay(cam, FS, FQ, hud, bigm, subm, acc, src,
            "PENDIDIKAN & PERUMAHAN  \u00b7  Rp60 T",
            "3 juta",
            "rumah tidak layak huni, Rp20 juta per unit",
            "Rp50 T sekolah  \u00b7  30.437 satuan",
            "PKP \u00b7 BSPS \u00b7 Kemendikdasmen 2025")

    print("SCENE s06 objects", len(bpy.data.objects), flush=True)
