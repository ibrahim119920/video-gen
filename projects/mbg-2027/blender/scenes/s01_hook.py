import bpy
from kit import *


def build():
    purge()
    setup(1080, 1920, 30, 32)
    FS, FQ = fonts()
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end = 240

    add_world("#4A3050", 0.45)
    add_backdrop([(0.00, "#F2A55E"), (0.10, "#D9713F"),
                  (0.28, "#7A3B4A"), (0.62, "#1A1526")], z0=0.0, z1=150.0)
    add_sun((-30, 44, 16), (0, 6, 6), 3.0, "#FFD2A0", 7.0)
    add_sun((34, -26, 18), (0, 6, 4), 0.9, "#7A88B8", 12.0)

    gnd = mat_diff("gnd", "#14121C", 0.95, 0.05)
    far = mat_diff("far", "#3A3550", 0.95, 0.05)
    mid = mat_diff("mid", "#241F36", 0.95, 0.05)
    near = mat_diff("near", "#15121E", 0.95, 0.05)
    gold = mat_emit("gold", "#F0A44F", 1.0)
    cream = mat_emit("cream", "#FFE9CF", 1.0)
    soft = mat_emit("soft", "#D9C7B4", 0.9)
    hud = mat_emit("hud", "#C4B2A0", 0.9)
    sunm = mat_emit("sunm", "#FFC98A", 1.7)

    add_ground(gnd, 1200.0, 0.0)
    city_row("f", 46.0, -80, 80, 10, 24, 4.5, 10.0, far, 11, 4.0)
    city_row("m", 24.0, -50, 50, 5, 13, 3.5, 8.0, mid, 22, 3.5)
    city_row("n", 9.0, -30, 30, 1.5, 4.5, 2.5, 6.0, near, 33, 2.5)

    cam = add_cam((0, -24, 7.0), (0, 8, 9.4), 35.0)
    add_disc("sundisc", (-20.0, 120.0, 48.0), 8.0, sunm, cam)

    cam.keyframe_insert("location", frame=1)
    cam.location = (0, -21.0, 7.6)
    cam.keyframe_insert("location", frame=240)

    t = cam_text(cam, "hud", "SIMULASI 2027  \u00b7  ANGGARAN MBG", FS, 30, -0.42, 0.435, hud, 1.2, 1.35, "LEFT")
    fit(t, cam, 1.2, 0.86)
    t = cam_text(cam, "big", "Rp180", FS, 210, 0.0, 0.120, cream, 1.2)
    fit(t, cam, 1.2, 0.86)
    t = cam_text(cam, "unit", "TRILIUN", FS, 62, 0.0, 0.026, gold, 1.2, 1.9)
    fit(t, cam, 1.2, 0.86)
    t = cam_text(cam, "cap1", "dari Rp240 triliun,", FQ, 56, 0.0, -0.062, soft, 1.2)
    fit(t, cam, 1.2, 0.86)
    t = cam_text(cam, "cap2", "tersisa Rp60.", FQ, 56, 0.0, -0.108, soft, 1.2)
    fit(t, cam, 1.2, 0.86)

    print("SCENE s01 objects", len(bpy.data.objects), flush=True)
