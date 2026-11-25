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

    add_world("#2A6EA8", 0.45)
    add_backdrop([(0.00, "#CFE9F5"), (0.20, "#8FC6E6"),
                  (0.55, "#3D7FB8"), (1.00, "#123E63")], z0=0.0, z1=160.0)
    add_sun((40, -30, 45), (0, 8, 2), 4.4, "#FFF6E2", 4.0)

    road = mat_diff("road", "#33343A", 0.90, 0.08)
    busm = mat_diff("bus", "#E8A03C", 0.70, 0.15)
    glass = mat_diff("glass", "#2A3540", 0.35, 0.40)
    dark = mat_diff("dark", "#1C1F24", 0.70, 0.10)
    gnd = mat_diff("gnd", "#47634C", 0.95, 0.05)
    wht = mat_diff("wht", "#E9EDF0", 0.90, 0.10)

    add_ground(gnd, 900.0, -0.02)
    add_box("road", (0, 34.0, 0.0), (18.0, 170.0, 0.06), road, bev=0.0)
    add_box("walk", (-11.2, 34.0, 0.04), (4.0, 170.0, 0.12), wht, bev=0.0)

    for k in range(3):
        y = 6.0 + k * 9.5
        x = -1.4 if k % 2 == 0 else 1.4
        add_box("b%d" % k, (x, y, 1.45), (2.6, 8.4, 2.3), busm)
        add_box("g%d" % k, (x, y, 1.85), (2.64, 6.6, 0.75), glass, bev=0.0)
        for sx in (-1.30, 1.30):
            for sy in (-2.6, 2.6):
                add_cyl("w%g_%g_%g" % (k, sx, sy), (x + sx, y + sy, 0.45),
                        0.42, 0.24, dark, 14, (0, math.pi / 2, 0))

    add_box("sh_roof", (-10.0, 12.0, 3.1), (3.2, 7.0, 0.18), wht)
    add_box("sh_p1", (-8.6, 9.0, 1.55), (0.14, 0.14, 3.1), dark, bev=0.0)
    add_box("sh_p2", (-8.6, 15.0, 1.55), (0.14, 0.14, 3.1), dark, bev=0.0)

    cam = add_cam((12.0, -10.0, 5.6), (0.0, 14.0, 1.8), 35.0)
    push_cam(cam, (12.0, -10.0, 5.6), (12.0, -6.0, 5.6), n)

    hud = mat_emit("o_hud", "#BBD8EC", 0.9)
    bigm = mat_emit("o_big", "#FFFFFF", 1.0)
    subm = mat_emit("o_sub", "#D7E9F5", 0.9)
    acc = mat_emit("o_acc", "#FFD27F", 1.0)
    src = mat_emit("o_src", "#9FB6C8", 1.0)

    overlay(cam, FS, FQ, hud, bigm, subm, acc, src,
            "TRANSPORTASI  \u00b7  Rp40 T",
            "348 km",
            "jalur khusus BRT, pembanding Trans Semarang",
            "Rp10 T armada  \u00b7  7.893 bus medium",
            "Antara \u00b7 DAMRI 2024")

    print("SCENE s05 objects", len(bpy.data.objects), flush=True)
