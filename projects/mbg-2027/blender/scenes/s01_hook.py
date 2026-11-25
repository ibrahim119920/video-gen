import bpy
from kit import *

def build():
    purge()
    setup(1080, 1920, 30, 32)
    FS, FQ = fonts()
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end = 240

    add_world("#3A2440", 0.30)
    add_backdrop([(0.00, "#E8934E"), (0.14, "#C4613A"),
                  (0.35, "#4A2B44"), (0.80, "#070A14")], z0=0.0, z1=120.0)
    add_sun((-26, 34, 12), (0, 0, 0), 3.2, "#FFD2A0", 6.0)

    gnd  = mat_diff("gnd",  "#0E0F18", 0.95, 0.05)
    far  = mat_diff("far",  "#2A2B44", 0.95, 0.05)
    mid  = mat_diff("mid",  "#1B1C2E", 0.95, 0.05)
    near = mat_diff("near", "#0D0E16", 0.95, 0.05)
    gold = mat_emit("gold", "#F0A44F", 1.0)
    cream = mat_emit("cream", "#FFE9CF", 1.0)
    soft = mat_emit("soft", "#D9C7B4", 0.9)
    hud  = mat_emit("hud",  "#B9A794", 0.9)
    sunm = mat_emit("sunm", "#FFC98A", 1.7)

    add_ground(gnd, 900.0, 0.0)
    city_row("f", 34.0, -70, 70, 12, 28, 4.0, 9.0, far, 11, 4.0)
    city_row("m", 18.0, -45, 45, 6, 16, 3.0, 7.0, mid, 22, 3.5)
    city_row("n", 6.5, -26, 26, 2.5, 8, 2.0, 5.0, near, 33, 2.5)

    cam = add_cam((0, -18, 4.0), (0, 4, 8.6), 35.0)
    add_disc("sundisc", (-16.0, 95.0, 26.0), 6.0, sunm, cam)

    cam.keyframe_insert("location", frame=1)
    cam.location = (0, -15.3, 4.62)
    cam.keyframe_insert("location", frame=240)

    t = cam_text(cam, "hud", "SIMULASI 2027  \u00b7  ANGGARAN MBG", FS, 30, -0.42, 0.435, hud, 1.2, 1.35, "LEFT")
    fit(t, cam, 1.2, 0.86)
    t = cam_text(cam, "big", "Rp180", FS, 210, 0.0, 0.105, cream, 1.2)
    fit(t, cam, 1.2, 0.86)
    t = cam_text(cam, "unit", "TRILIUN", FS, 62, 0.0, 0.012, gold, 1.2, 1.9)
    fit(t, cam, 1.2, 0.86)
    t = cam_text(cam, "cap1", "dari Rp240 triliun,", FQ, 56, 0.0, -0.085, soft, 1.2)
    fit(t, cam, 1.2, 0.86)
    t = cam_text(cam, "cap2", "tersisa Rp60.", FQ, 56, 0.0, -0.132, soft, 1.2)
    fit(t, cam, 1.2, 0.86)

    print("SCENE s01 objects", len(bpy.data.objects), flush=True)
