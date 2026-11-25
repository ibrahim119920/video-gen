"""Render deterministik scene three.js lewat Chrome headless.

    python render.py --frames 90 --out frames

Menyajikan folder ini lewat http lokal (ES module tidak bisa dibuka dari
file://), lalu memanggil window.draw(i, n) dan menyimpan screenshot.
"""

import argparse
import functools
import http.server
import os
import statistics
import threading
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1920


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=HERE)
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, httpd.server_address[1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", type=int, default=90)
    ap.add_argument("--out", default="frames")
    ap.add_argument("--page", default="index.html")
    args = ap.parse_args()

    out = os.path.join(HERE, args.out)
    os.makedirs(out, exist_ok=True)

    httpd, port = serve()
    url = "http://127.0.0.1:%d/%s" % (port, args.page)
    print("serve", url, flush=True)

    t_render, t_shot = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome", headless=True,
            args=["--force-device-scale-factor=1", "--hide-scrollbars",
                  "--disable-lcd-text", "--allow-insecure-localhost"],
        )
        page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
        page.on("console", lambda m: print("PAGE", m.text, flush=True))
        page.on("pageerror", lambda e: print("PAGEERROR", e, flush=True))
        page.goto(url, wait_until="load")
        page.wait_for_function("window.READY === true", timeout=60000)
        page.evaluate("() => document.fonts.ready.then(() => true)")
        print("GL", page.evaluate("window.GL_INFO"), flush=True)

        for i in range(args.frames):
            a = time.perf_counter()
            page.evaluate("([i, n]) => window.draw(i, n)", [i, args.frames])
            b = time.perf_counter()
            page.screenshot(path=os.path.join(out, "f_%04d.png" % (i + 1)))
            c = time.perf_counter()
            t_render.append(b - a)
            t_shot.append(c - b)

        browser.close()
    httpd.shutdown()

    steady_r = sorted(t_render[1:]) or t_render
    steady_s = sorted(t_shot[1:]) or t_shot
    med = lambda v: statistics.median(v)
    total = sum(t_render) + sum(t_shot)
    print("RENDER median %.3f s/frame" % med(steady_r), flush=True)
    print("SHOT   median %.3f s/frame" % med(steady_s), flush=True)
    print("TOTAL  %.3f s/frame  (%.1f s untuk %d frame)" % (total / args.frames, total, args.frames), flush=True)


if __name__ == "__main__":
    main()
