"""Render + encode klip Three.js menjadi satu MP4.

    python build.py --clips c02,c03,c04,c05 --out ../out/review_c02-c05.mp4

Tiap klip dirender 150 frame (5 detik @30fps) lewat render.py, lalu di-encode
dengan parameter identik dan disambung tanpa re-encode.
"""

import argparse
import os
import subprocess
import sys
import time

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable
FPS = 30
FRAMES = 150


def run(cmd, **kw):
    print("$", " ".join(str(c) for c in cmd), flush=True)
    p = subprocess.run(cmd, cwd=HERE, capture_output=False, **kw)
    if p.returncode != 0:
        raise SystemExit("gagal: %s" % (cmd,))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--clips", default="c01,c02,c03,c04,c05,c06,c07,c08,c09,c10,c11,c12")
    ap.add_argument("--frames", type=int, default=FRAMES)
    ap.add_argument("--out", default=os.path.join("..", "out", "mbg_2027_1080x1920.mp4"))
    ap.add_argument("--skip-render", action="store_true")
    ap.add_argument("--keep", action="store_true")
    args = ap.parse_args()

    clips = [c.strip() for c in args.clips.split(",") if c.strip()]
    out = os.path.abspath(os.path.join(HERE, args.out))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    seg_dir = os.path.join(HERE, "segments")
    os.makedirs(seg_dir, exist_ok=True)

    segs = []
    t0 = time.perf_counter()
    for c in clips:
        frames_dir = os.path.join(HERE, "frames", c)
        if not args.skip_render:
            run([PY, "render.py", "--clip", c, "--frames", str(args.frames), "--out", os.path.join("frames", c)])
        seg = os.path.join(seg_dir, c + ".mp4")
        run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-framerate", str(FPS), "-i", os.path.join(frames_dir, "f_%04d.png"),
            "-c:v", "libx264", "-preset", "medium", "-crf", "18",
            "-pix_fmt", "yuv420p", "-r", str(FPS), "-movflags", "+faststart",
            seg,
        ])
        segs.append(seg)
        print("SEG %s ok (%.1f s)" % (c, time.perf_counter() - t0), flush=True)

    lst = os.path.join(seg_dir, "list.txt")
    with open(lst, "w", encoding="utf-8") as f:
        for s in segs:
            f.write("file '%s'\n" % s.replace("\\", "/"))

    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
         "-i", lst, "-c", "copy", "-movflags", "+faststart", out])

    size = os.path.getsize(out)
    dur = len(segs) * args.frames / FPS
    print("OUT %s  %.1f MB  %.1f s  (%.1f s total)" % (out, size / 1e6, dur, time.perf_counter() - t0), flush=True)


if __name__ == "__main__":
    main()
