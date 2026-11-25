"""Render frame klip Three.js lewat Chrome headless.

Contoh:
    python render.py --clip c01 --times 0.4,1.5,2.6,4.9
    python render.py --clip c01 --frames 150

Memakai window.draw(t) dengan t dalam detik (bukan indeks frame), lalu
menyimpan screenshot 1080x1920. Deterministik: tidak ada requestAnimationFrame.
"""

import argparse
import functools
import http.server
import os
import statistics
import threading
import time

import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1920


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=HERE)
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, httpd.server_address[1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--clip", default="c01")
    ap.add_argument("--frames", type=int, default=150)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--times", default="")
    ap.add_argument("--out", default="")
    ap.add_argument("--headed", action="store_true")
    args = ap.parse_args()

    out = os.path.join(HERE, args.out or os.path.join("frames", args.clip))
    os.makedirs(out, exist_ok=True)

    httpd, port = serve()
    url = "http://127.0.0.1:%d/index.html?clip=%s" % (port, args.clip)
    print("SERVE", url, flush=True)

    t_render, t_shot = [], []
    t_wall = time.perf_counter()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome",
            headless=not args.headed,
            args=[
                "--force-device-scale-factor=1",
                "--hide-scrollbars",
                "--disable-lcd-text",
                "--allow-insecure-localhost",
                "--disable-features=CalculateNativeWinOcclusion",
            ],
        )
        page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
        page.on("console", lambda m: print("PAGE", m.text, flush=True))
        page.on("pageerror", lambda e: print("PAGEERROR", e, flush=True))
        page.goto(url, wait_until="load")
        page.wait_for_function("window.READY === true", timeout=90000)
        print("GL", page.evaluate("window.GL_INFO"), flush=True)
        print("DUR", page.evaluate("window.DURATION"), flush=True)

        if args.times:
            for raw in args.times.split(","):
                t = float(raw)
                a = time.perf_counter()
                page.evaluate("(t) => window.draw(t)", t)
                b = time.perf_counter()
                path = os.path.join(HERE, "stills", "%s_t%04.1f.png" % (args.clip, t))
                os.makedirs(os.path.dirname(path), exist_ok=True)
                page.screenshot(path=path)
                print("STILL %.2f -> %s" % (t, os.path.relpath(path, HERE)), flush=True)
                t_render.append(b - a)
        else:
            for i in range(args.frames):
                t = i / args.fps
                a = time.perf_counter()
                page.evaluate("(t) => window.draw(t)", t)
                b = time.perf_counter()
                page.screenshot(path=os.path.join(out, "f_%04d.png" % (i + 1)))
                c = time.perf_counter()
                t_render.append(b - a)
                t_shot.append(c - b)
                if (i + 1) % 30 == 0:
                    print("  %d/%d" % (i + 1, args.frames), flush=True)

        browser.close()
    httpd.shutdown()

    med = statistics.median
    if t_shot:
        print("RENDER median %.3f s/frame" % med(t_render), flush=True)
        print("SHOT   median %.3f s/frame" % med(t_shot), flush=True)
    total = time.perf_counter() - t_wall
    print("WALL   %.1f s  (%.3f s/frame)" % (total, total / max(1, args.frames if not args.times else len(args.times))), flush=True)


if __name__ == "__main__":
    main()
