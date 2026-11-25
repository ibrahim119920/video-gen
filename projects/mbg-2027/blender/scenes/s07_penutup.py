import bpy
from kit import *


def build(n=150):
    purge()
    setup(1080, 1920, 30, 32)
    FS, FQ = fonts()
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end = n

    add_world("#1A1424", 0.30)
    add_backdrop([(0.00, "#6A4A50"), (0.14, "#3A2A3A"),
                  (0.45, "#150F1E")], z0=0.0, z1=130.0)

    gnd = mat_diff("gnd", "#0C0A12", 0.95, 0.05)
    far = mat_diff("far", "#241E32", 0.95, 0.05)
    mid = mat_diff("mid", "#171320", 0.95, 0.05)

    add_ground(gnd, 900.0, 0.0)
    city_row("f", 40.0, -70, 70, 8, 20, 4.5, 10.0, far, 11, 4.0)
    city_row("m", 20.0, -45, 45, 4, 10, 3.5, 8.0, mid, 22, 3.5)

    cam = add_cam((0, -26, 6.5), (0, 8, 8.0), 35.0)

    hudm = mat_emit("o_hud", "#8C7C90", 1.0)
    line1 = mat_emit("o_l1", "#F0A44F", 1.0)
    line2 = mat_emit("o_l2", "#D9C7B4", 0.95)

    t = cam_text(cam, "hud", "SIMULASI BIAYA SATUAN", FS, 30, 0.0, 0.30, hudm, 1.2, 1.4)
    fit(t, cam, 1.2, 0.90)
    t = cam_text(cam, "l1", "Bukan janji output 2027.", FS, 50, 0.0, 0.06, line1, 1.2)
    fit(t, cam, 1.2, 0.90)
    t = cam_text(cam, "l2", "Butuh multiyears, lahan,", FQ, 48, 0.0, -0.02, line2, 1.2)
    fit(t, cam, 1.2, 0.90)
    t = cam_text(cam, "l3", "dan biaya pemeliharaan.", FQ, 48, 0.0, -0.075, line2, 1.2)
    fit(t, cam, 1.2, 0.90)

    print("SCENE s07 objects", len(bpy.data.objects), flush=True)
