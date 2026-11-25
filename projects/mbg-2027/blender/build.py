"""Orkestrator render: bangun scene lalu render rentang frame.

Dijalankan di dalam Blender:

    TASKS='[{"scene":"s01","start":120,"end":120,"out":"/tmp/preview/s01"}]' \
      blender -b --factory-startup --python build.py

Env:
  TASKS  JSON list task. Tiap task: scene, start, end, out.
  SPP    opsional, default 32 (dipakai scene bila tidak di-hardcode).
"""

import bpy
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from scenes import s01_hook, s02_empat  # noqa: E402

SCENES = {
    "s01": s01_hook,
    "s02": s02_empat,
}


def render_range(name, mod, start, end, outdir):
    mod.build()
    sc = bpy.context.scene
    os.makedirs(outdir, exist_ok=True)
    times = []
    for f in range(start, end + 1):
        sc.frame_set(f)
        sc.render.filepath = os.path.join(outdir, "f_%04d" % f)
        t0 = time.perf_counter()
        bpy.ops.render.render(write_still=True)
        dt = time.perf_counter() - t0
        times.append(dt)
        print("FRAME %s %d %.3f" % (name, f, dt), flush=True)
    return times


def stats(t):
    if not t:
        return {}
    steady = sorted(t[1:]) if len(t) > 1 else list(t)
    return {
        "n": len(t),
        "first": round(t[0], 3),
        "median": round(steady[len(steady) // 2], 3),
        "mean": round(sum(steady) / len(steady), 3),
        "total": round(sum(t), 3),
    }


def main():
    raw = os.environ.get("TASKS", "[]")
    tasks = json.loads(raw)
    if not tasks:
        print("NO_TASKS", flush=True)
        return
    for t in tasks:
        name = t["scene"]
        if name not in SCENES:
            print("UNKNOWN_SCENE", name, flush=True)
            continue
        print("TASK", name, t["start"], t["end"], t["out"], flush=True)
        times = render_range(name, SCENES[name], t["start"], t["end"], t["out"])
        row = stats(times)
        row["scene"] = name
        print("RESULT", json.dumps(row), flush=True)


if __name__ == "__main__":
    main()
