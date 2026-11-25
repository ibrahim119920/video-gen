import bpy
from kit import *
from scenes._shared import overlay


def build(n=240):
    purge()
    setup(1080, 1920, 30, 32)
    FS, FQ = fonts()
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end = n

    add_world("#3A2A3A", 0.35)
    add_backdrop([(0.00, "#F6C089"), (0.12, "#E08A4C"),
                  (0.30, "#7A4358"), (0.65, "#241A30")], z0=0.0, z1=140.0)
    add_sun((-40, 60, 10), (0, 20, 2), 3.4, "#FFD9A8", 5.0)

    road = mat_diff("road", "#2B2A31", 0.92, 0.05)
    shou = mat_diff("shou", "#6E6355", 0.92, 0.05)
    line = mat_emit("line", "#EFE3C8", 0.9)
    gnd = mat_diff("gnd", "#1A1620", 0.95, 0.05)
    far = mat_diff("far", "#4A3A4C", 0.95, 0.05)

    add_ground(gnd, 900.0, -0.02)
    add_box("road", (0, 70.0, 0.0), (16.0, 240.0, 0.06), road, bev=0.0)
    add_box("sh1", (-9.0, 70.0, 0.0), (2.2, 240.0, 0.05), shou, bev=0.0)
    add_box("sh2", (9.0, 70.0, 0.0), (2.2, 240.0, 0.05), shou, bev=0.0)

    y = 6.0
    i = 0
    while y < 210.0:
        add_box("dash%d" % i, (0.0, y, 0.045), (0.20, 4.0, 0.02), line, bev=0.0)
        y += 13.0
        i += 1

    for k in range(16):
        yy = 4.0 + k * 13.0
        add_box("p1%d" % k, (-7.6, yy, 0.55), (0.10, 0.10, 1.1), line, bev=0.0)
        add_box("p2%d" % k, (7.6, yy, 0.55), (0.10, 0.10, 1.1), line, bev=0.0)

    city_row("f", 250.0, -120, 120, 8, 22, 6.0, 14.0, far, 77, 6.0)

    cam = add_cam((0, -6.0, 3.4), (0, 60.0, 3.9), 30.0)
    push_cam(cam, (0, -6.0, 3.4), (0, 0.5, 3.6), n)

    hud = mat_emit("o_hud", "#C4B2A0", 0.9)
    big = mat_emit("o_big", "#FFF1DC", 1.0)
    sub = mat_emit("o_sub", "#E8D7C4", 0.9)
    acc = mat_emit("o_acc", "#F0A44F", 1.0)
    src = mat_emit("o_src", "#9A8C80", 1.0)

    overlay(cam, FS, FQ, hud, big, sub, acc, src,
            "INFRASTRUKTUR  \u00b7  Rp80 T",
            "14.388 km",
            "jalan nasional & daerah, setara biaya IJD",
            "Rp50 T rel  \u00b7  850 km ekuivalen",
            "Bina Marga \u00b7 IJD 2025-2026 \u00b7 Dephub")

    print("SCENE s03 objects", len(bpy.data.objects), flush=True)
