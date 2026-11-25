import bpy
from kit import *


def overlay(cam, fs, fq, hud_m, big_m, sub_m, acc_m, src_m,
            hud, big, sub, second, src, big_px=140):
    t = cam_text(cam, "hud", hud, fs, 26, -0.42, 0.444, hud_m, 1.2, 1.32, "LEFT")
    fit(t, cam, 1.2, 0.88)
    t = cam_text(cam, "big", big, fs, big_px, 0.0, 0.140, big_m, 1.2)
    fit(t, cam, 1.2, 0.86)
    t = cam_text(cam, "sub", sub, fq, 34, 0.0, 0.040, sub_m, 1.2)
    fit(t, cam, 1.2, 0.90)
    t = cam_text(cam, "sec", second, fs, 38, 0.0, -0.032, acc_m, 1.2)
    fit(t, cam, 1.2, 0.90)
    t = cam_text(cam, "src", src, fs, 20, 0.0, -0.470, src_m, 1.2, 1.1)
    fit(t, cam, 1.2, 0.94)
