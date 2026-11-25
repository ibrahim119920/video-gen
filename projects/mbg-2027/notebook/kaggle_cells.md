# Sel notebook Kaggle

Empat sel. Kode render tidak ditempel di sini; notebook mengambilnya dari repo.

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

## Sel 2 — ambil kode dari repo

```python
REPO = "/tmp/repo"
URL = "https://github.com/USER/REPO.git"   # ganti
REF = "main"

import os, shutil, subprocess

if os.path.isdir(REPO):
    shutil.rmtree(REPO)
r = subprocess.run(["git", "clone", "--depth", "1", "--branch", REF, URL, REPO],
                   capture_output=True, text=True)
print("clone rc", r.returncode, r.stderr[-300:])
print("HEAD", subprocess.run(["git", "-C", REPO, "rev-parse", "HEAD"],
                             capture_output=True, text=True).stdout.strip())
```

Repo privat: ganti `URL` dengan
`f"https://{TOKEN}@github.com/USER/REPO.git"`, di mana
`TOKEN = UserSecretsClient().get_secret("GITHUB_TOKEN")`.

## Sel 3 — render

```python
import json, os, subprocess

PROJ = REPO + "/projects/mbg-2027"
tasks = [
    {"scene": "s01", "start": 120, "end": 120, "out": "/tmp/preview/s01"},
    {"scene": "s02", "start": 345, "end": 345, "out": "/tmp/preview/s02"},
    {"scene": "s01", "start": 100, "end": 111, "out": "/tmp/preview/bench"},
]
env = dict(os.environ, TASKS=json.dumps(tasks))

p = subprocess.Popen([EXE, "-b", "--factory-startup", "--python", PROJ + "/blender/build.py"],
                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
for line in p.stdout:
    s = line.rstrip()
    if any(k in s for k in ("TASK", "RESULT", "FRAME", "SETUP", "FONT", "SCENE",
                            "Path tracing", "Error", "Traceback")):
        print(s, flush=True)
p.wait()
print("rc", p.returncode)
```

## Sel 4 — kumpulkan output

```python
import glob, os, shutil

dst = "/kaggle/working/out"
os.makedirs(dst, exist_ok=True)
for f in glob.glob("/tmp/preview/*/*.png"):
    sub = os.path.basename(os.path.dirname(f))
    shutil.copy(f, os.path.join(dst, sub + "_" + os.path.basename(f)))
for f in sorted(glob.glob(dst + "/*")):
    print(os.path.basename(f), os.path.getsize(f))
```
