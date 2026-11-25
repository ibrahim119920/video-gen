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

    add_world("#204A52", 0.40)
    add_backdrop([(0.00, "#DDF0EC"), (0.18, "#9FD2CC"),
                  (0.50, "#3E8C8C"), (1.00, "#0E2E38")], z0=0.0, z1=160.0)
    add_sun((30, -40, 50), (0, 10, 6), 3.8, "#EAF7F2", 5.0)

    wall = mat_diff("wall", "#EDF2F0", 0.85, 0.10)
    teal = mat_diff("teal", "#4E9E96", 0.80, 0.15)
    glass = mat_emit("glass", "#8FD8CE", 0.85)
    red = mat_emit("red", "#D9483B", 1.0)
    gnd = mat_diff("gnd", "#22322F", 0.95, 0.05)

    add_ground(gnd, 900.0, 0.0)
    add_box("main", (0, 16, 6.0), (14.0, 10.0, 12.0), wall)
    add_box("wing1", (-11.5, 20, 4.0), (7.0, 8.0, 8.0), wall)
    add_box("wing2", (11.0, 22, 3.2), (6.0, 8.0, 6.4), teal)

    for k in range(5):
        z = 2.2 + k * 2.2
        add_box("win%d" % k, (0, 11.03, z), (11.0, 0.10, 0.55), glass, bev=0.0)

    add_box("cr1", (0, 11.03, 9.4), (2.2, 0.10, 0.60), red, bev=0.0)
    add_box("cr2", (0, 11.03, 9.4), (0.60, 0.10, 2.2), red, bev=0.0)

    add_box("can", (0, 8.2, 3.4), (7.0, 4.2, 0.25), teal)
    add_box("cp1", (-3.2, 6.8, 1.7), (0.22, 0.22, 3.4), wall)
    add_box("cp2", (3.2, 6.8, 1.7), (0.22, 0.22, 3.4), wall)

    cam = add_cam((0, -14.0, 3.2), (0, 14.0, 7.0), 28.0)
    push_cam(cam, (0, -14.0, 3.2), (0, -10.2, 3.6), n)

    hud = mat_emit("o_hud", "#BFD8D2", 0.9)
    bigm = mat_emit("o_big", "#F4FBF8", 1.0)
    subm = mat_emit("o_sub", "#D3E8E2", 0.9)
    acc = mat_emit("o_acc", "#8FE0D2", 1.0)
    src = mat_emit("o_src", "#8FA9A4", 1.0)

    overlay(cam, FS, FQ, hud, bigm, subm, acc, src,
            "KESEHATAN  \u00b7  Rp70 T",
            "138,9 juta",
            "orang-tahun iuran PBI, Rp504.000 per orang",
            "Rp35 T rumah sakit  \u00b7  205 unit setara",
            "BPJS Kesehatan \u00b7 Kemenkes")

    print("SCENE s04 objects", len(bpy.data.objects), flush=True)
