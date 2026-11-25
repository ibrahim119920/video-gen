# Sel notebook Kaggle (interaktif)

Enam sel. Kode render diambil dari repo, bukan ditempel.

## Sel 1 — Blender 4.5.9

```python
import os, subprocess

BL_DIR = "/tmp/bl"
EXE = BL_DIR + "/blender-4.5.9-linux-x64/blender"

if not os.path.exists(EXE):
    os.makedirs(BL_DIR, exist_ok=True)
    URL = "https://download.blender.org/release/Blender4.5/blender-4.5.9-linux-x64.tar.xz"
    print("wget", subprocess.run(["wget", "-q", "-O", BL_DIR + "/b.tar.xz", URL]).returncode)
    print("tar", subprocess.run(["tar", "-xf", BL_DIR + "/b.tar.xz", "-C", BL_DIR]).returncode)

print(subprocess.run([EXE, "--version"], capture_output=True, text=True).stdout.splitlines()[0])
```

## Sel 2 — repo

```python
import os, shutil, subprocess

REPO = "/tmp/repo"
if os.path.isdir(REPO):
    shutil.rmtree(REPO)
r = subprocess.run(["git", "clone", "--depth", "1", "--branch", "main",
                    "https://github.com/ibrahim119920/video-gen.git", REPO],
                   capture_output=True, text=True)
print("clone rc", r.returncode)
print("HEAD", subprocess.run(["git", "-C", REPO, "rev-parse", "--short", "HEAD"],
                             capture_output=True, text=True).stdout.strip())
```

## Sel 3 — TTS dan timeline

```python
import subprocess, sys, os, json

os.makedirs("/tmp/vo", exist_ok=True)
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "edge-tts"], check=False)

VO = {
 "s01": "MBG dipangkas dari 240 ke 60 triliun. 180 triliun berpindah. Jadi apa?",
 "s02": "Empat kemungkinan. Masing-masing menyerap 180 triliun. Tidak dijumlahkan.",
 "s03": "Infrastruktur. 80 triliun jalan, setara 14.388 kilometer.",
 "s04": "Kesehatan. 70 triliun BPJS, setara 138,9 juta orang.",
 "s05": "Transportasi. 40 triliun, setara 348 kilometer BRT.",
 "s06": "Pendidikan dan perumahan. 60 triliun, tiga juta rumah.",
 "s07": "Semua ini biaya satuan. Bukan janji selesai tahun ini.",
}
ORDER = ["s01", "s02", "s03", "s04", "s05", "s06", "s07"]
FPS, TAIL, MIN_S = 30, 1.0, 5.0

durs = {}
for k in ORDER:
    p = "/tmp/vo/%s.mp3" % k
    r = subprocess.run(["edge-tts", "--voice", "id-ID-ArdiNeural", "--rate=-4%",
                        "--text", VO[k], "--write-media", p], capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(p):
        print("TTS_FAIL", k, (r.stderr or "")[-200:])
        continue
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", p], capture_output=True, text=True)
    durs[k] = round(float(d.stdout.strip()), 3)

plan = []
for k in ORDER:
    n = max(int(MIN_S * FPS), int(round((durs[k] + TAIL) * FPS)))
    plan.append({"scene": k, "n": n, "vo": durs[k]})
    print("%s  vo %5.2f s  ->  %3d frame  (%.2f s)" % (k, durs[k], n, n / FPS))

json.dump(plan, open("/tmp/vo/plan.json", "w"), indent=1)
print("TOTAL %.2f s, %d frame" % (sum(p["n"] for p in plan) / FPS, sum(p["n"] for p in plan)))
```

## Sel 4 — stills 7 scene (QA, ~1 menit)

```python
import json, os, subprocess

plan = json.load(open("/tmp/vo/plan.json"))
tasks = [{"scene": p["scene"], "n": p["n"], "still": max(1, int(p["n"] * 0.45)),
          "out": "/tmp/stills/" + p["scene"]} for p in plan]
env = dict(os.environ, TASKS=json.dumps(tasks))

p = subprocess.Popen([EXE, "-b", "--factory-startup",
                      "--python", REPO + "/projects/mbg-2027/blender/build.py"],
                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
for line in p.stdout:
    s = line.rstrip()
    if any(k in s for k in ("TASK", "FRAME", "SCENE", "RESULT", "Error", "Traceback")):
        print(s, flush=True)
p.wait()
print("rc", p.returncode)

import shutil, glob
os.makedirs("/kaggle/working/stills", exist_ok=True)
for f in glob.glob("/tmp/stills/*/*.png"):
    shutil.copy(f, "/kaggle/working/stills/" + os.path.basename(os.path.dirname(f)) + ".png")
print(sorted(os.listdir("/kaggle/working/stills")))
```

## Sel 5 — render penuh

```python
import json, os, subprocess, time

plan = json.load(open("/tmp/vo/plan.json"))
tasks = [{"scene": p["scene"], "n": p["n"], "out": "/tmp/frames/" + p["scene"]} for p in plan]
env = dict(os.environ, TASKS=json.dumps(tasks))

t0 = time.time()
p = subprocess.Popen([EXE, "-b", "--factory-startup",
                      "--python", REPO + "/projects/mbg-2027/blender/build.py"],
                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
for line in p.stdout:
    s = line.rstrip()
    if any(k in s for k in ("TASK", "PROGRESS", "RESULT", "GRAND", "SETUP", "Error", "Traceback")):
        print(s, flush=True)
p.wait()
print("rc", p.returncode, "wall %.1f menit" % ((time.time() - t0) / 60))
```

## Sel 6 — encode, audio, QC

```python
import subprocess, os, json, shutil

plan = json.load(open("/tmp/vo/plan.json"))
FIN = "/tmp/final"
os.makedirs(FIN, exist_ok=True)

segs = []
for p in plan:
    name = p["scene"]
    mp4 = "%s/%s.mp4" % (FIN, name)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "30",
                    "-i", "/tmp/frames/%s/f_%%04d.png" % name,
                    "-c:v", "libx264", "-preset", "slow", "-crf", "18",
                    "-pix_fmt", "yuv420p", mp4], check=True)
    segs.append(mp4)
    print("seg", name, os.path.getsize(mp4))

with open(FIN + "/list.txt", "w") as f:
    for s in segs:
        f.write("file '%s'\n" % s)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
                "-i", FIN + "/list.txt", "-c", "copy", FIN + "/video.mp4"], check=True)

wavs = []
for p in plan:
    name, dur = p["scene"], p["n"] / 30.0
    w = "%s/%s.wav" % (FIN, name)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "/tmp/vo/%s.mp3" % name,
                    "-af", "adelay=700|700,apad", "-t", "%.3f" % dur,
                    "-ar", "48000", "-ac", "1", w], check=True)
    wavs.append(w)
with open(FIN + "/alist.txt", "w") as f:
    for w in wavs:
        f.write("file '%s'\n" % w)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
                "-i", FIN + "/alist.txt", "-c", "copy", FIN + "/vo.wav"], check=True)

subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", FIN + "/video.mp4",
                "-i", FIN + "/vo.wav", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                "-shortest", FIN + "/mixed.mp4"], check=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", FIN + "/mixed.mp4",
                "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:v", "copy",
                "-c:a", "aac", "-b:a", "192k", FIN + "/final.mp4"], check=True)

dst = "/kaggle/working/out"
os.makedirs(dst, exist_ok=True)
shutil.copy(FIN + "/final.mp4", dst + "/mbg_realokasi_1080x1920.mp4")
shutil.copy("/tmp/frames/s01/f_0060.png", dst + "/poster.png")

print(subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                      "format=duration,size:stream=width,height,r_frame_rate",
                      "-of", "default=nw=1", dst + "/mbg_realokasi_1080x1920.mp4"],
                     capture_output=True, text=True).stdout)
```

Setelah itu: `kaggle kernels output` atau unduh dari panel Output.
