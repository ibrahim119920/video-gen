"""Orkestrator render: bangun scene lalu render rentang frame.

Dijalankan di dalam Blender:

    TASKS='[{"scene":"s01","n":240,"out":"/tmp/frames/s01"}]' \
      blender -b --factory-startup --python build.py

Tiap task:
  scene   kunci di SCENES
  n       jumlah frame scene (1..n)
  out     folder PNG
  still   opsional; kalau ada, hanya frame itu yang dirender
"""

import bpy
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from scenes import (  # noqa: E402
    s01_hook,
    s02_empat,
    s03_jalan,
    s04_kesehatan,
    s05_transportasi,
    s06_pendidikan,
    s07_penutup,
)

SCENES = {
    "s01": s01_hook,
    "s02": s02_empat,
    "s03": s03_jalan,
    "s04": s04_kesehatan,
    "s05": s05_transportasi,
    "s06": s06_pendidikan,
    "s07": s07_penutup,
}


def run_task(t):
    name = t["scene"]
    if name not in SCENES:
        print("UNKNOWN_SCENE", name, flush=True)
        return {}
    mod = SCENES[name]
    n = int(t.get("n", 240))
    out = t["out"]
    still = t.get("still")

    mod.build(n)
    sc = bpy.context.scene
    os.makedirs(out, exist_ok=True)

    frames = [int(still)] if still else list(range(1, n + 1))
    t0 = time.perf_counter()
    times = []
    for i, f in enumerate(frames):
        sc.frame_set(f)
        sc.render.filepath = os.path.join(out, "f_%04d" % f)
        a = time.perf_counter()
        bpy.ops.render.render(write_still=True)
        dt = time.perf_counter() - a
        times.append(dt)
        if still:
            print("FRAME %s %d %.3f" % (name, f, dt), flush=True)
        elif i % 20 == 0 or i == len(frames) - 1:
            el = time.perf_counter() - t0
            print("PROGRESS %s %d/%d %.3f s/frame, elapsed %.0f s"
                  % (name, i + 1, len(frames), dt, el), flush=True)

    steady = sorted(times[1:]) if len(times) > 1 else list(times)
    row = {
        "scene": name,
        "n": len(times),
        "first": round(times[0], 3),
        "median": round(steady[len(steady) // 2], 3),
        "total": round(sum(times), 1),
    }
    print("RESULT", json.dumps(row), flush=True)
    return row


def main():
    tasks = json.loads(os.environ.get("TASKS", "[]"))
    if not tasks:
        print("NO_TASKS", flush=True)
        return
    grand = 0.0
    for t in tasks:
        print("TASK", t["scene"], t.get("n"), t["out"], flush=True)
        row = run_task(t)
        grand += row.get("total", 0.0)
    print("GRAND_TOTAL_S", round(grand, 1), flush=True)


if __name__ == "__main__":
    main()
