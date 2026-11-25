import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium } from "@playwright/test";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  if (a.startsWith("--")) {
    const [k, v] = a.slice(2).split("=");
    const next = process.argv[i + 1];
    if (v !== undefined) {
      args.set(k, v);
    } else if (next !== undefined && !next.startsWith("--")) {
      args.set(k, next);
      i += 1;
    } else {
      args.set(k, "true");
    }
  }
}

const scene = args.get("scene") ?? "1";
const panel = args.get("panel");
const outDir = resolve(args.get("out") ?? ".aura3d/review");
const format = (args.get("format") ?? "png").toLowerCase();
const width = Number(args.get("width") ?? 1080);
const height = Number(args.get("height") ?? 1920);
const fps = Number(args.get("fps") ?? 30);
const duration = Number(args.get("duration") ?? 0);
const seq = Boolean(args.get("seq"));
const timesArg = args.get("times");
const chrome = args.get("chrome") ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

let times = [];
if (timesArg) {
  times = timesArg.split(",").map((s) => Number(s.trim()));
} else if (duration > 0) {
  const count = Math.round(duration * fps);
  times = Array.from({ length: count }, (_, i) => i / fps);
} else {
  times = [0, 1, 2, 3, 4, 5];
}

mkdirSync(outDir, { recursive: true });

const root = resolve("dist");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".hdr": "application/octet-stream",
  ".exr": "application/octet-stream",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
  ".woff2": "font/woff2",
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  let path = join(root, decodeURIComponent(url.pathname));
  if (!existsSync(path) || statSync(path).isDirectory()) path = join(root, "index.html");
  res.setHeader("Content-Type", mime[extname(path).toLowerCase()] ?? "application/octet-stream");
  res.setHeader("Cache-Control", "no-store");
  createReadStream(path).pipe(res);
});

const port = 4599;
await new Promise((r) => server.listen(port, "127.0.0.1", () => r()));
console.log(`serving ${root} on http://127.0.0.1:${port}`);

const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
  args: ["--enable-unsafe-swiftshader", "--disable-gpu-vsync"],
});
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
page.on("console", (m) => {
  if (m.type() === "error") console.log("[console]", m.text());
});
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(`http://127.0.0.1:${port}/?scene=${scene}${panel ? `&panel=${panel}` : ""}`, {
  waitUntil: "load",
  timeout: 60000,
});
await page.waitForFunction(
  () => document.body.dataset.ready === "1" || document.body.dataset.error,
  undefined,
  { timeout: 90000 },
);
const error = await page.evaluate(() => document.body.dataset.error);
if (error) throw new Error(`app boot failed: ${error}`);

const total = times.length;
let last = performance.now();
for (let i = 0; i < total; i += 1) {
  const t = times[i];
  await page.evaluate(async (time) => {
    await window.__AURA_CAPTURE__.setTime(time);
  }, t);
  const name = seq
    ? `f${String(i).padStart(4, "0")}.${format === "jpg" ? "jpg" : "png"}`
    : `f${String(i).padStart(4, "0")}_${t.toFixed(2).replace(".", "_")}.${format === "jpg" ? "jpg" : "png"}`;
  const path = join(outDir, name);
  await page.screenshot({
    path,
    type: format === "jpg" ? "jpeg" : "png",
    ...(format === "jpg" ? { quality: 95 } : {}),
  });
  if (i % 30 === 0 || i === total - 1) {
    const now = performance.now();
    const frames = i === total - 1 ? (i % 30) + 1 : 30;
    console.log(
      `${i + 1}/${total} t=${t.toFixed(2)}s ${((now - last) / frames).toFixed(0)}ms/frame -> ${path}`,
    );
    last = now;
  }
}

await browser.close();
server.close();
console.log(`done: ${total} frame(s) in ${outDir}`);
