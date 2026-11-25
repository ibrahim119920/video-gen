import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const frameRoot = join(root, ".aura3d", "final");
const outRoot = join(root, "out");
const ffmpeg = "ffmpeg";
const ffprobe = "ffprobe";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  if (a.startsWith("--")) {
    const [k, v] = a.slice(2).split("=");
    args.set(k, v ?? process.argv[++i] ?? "true");
  }
}

const only = args.get("only")
  ? new Set(args.get("only").split(",").map((s) => s.trim()))
  : null;
const skipBuild = Boolean(args.get("skip-build"));
const skipRender = Boolean(args.get("skip-render"));
const skipEncode = Boolean(args.get("skip-encode"));

const scenes = [
  { id: "1", slug: "c01_diam_bergerak", duration: 6, panels: ["left", "right"] },
  { id: "2", slug: "c02_mitos_giroskop", duration: 10 },
  { id: "3", slug: "c03_pendulum_terbalik", duration: 11 },
  { id: "4", slug: "c04_setir_miring", duration: 12 },
  { id: "5", slug: "c05_geometri_garpu", duration: 9 },
  { id: "6", slug: "c06_terlalu_lambat", duration: 7 },
  { id: "7", slug: "c07_gerak_penutup", duration: 5 },
];

const FPS = 30;
const W = 1080;
const H = 1920;

function run(cmd, cmdArgs, opts = {}) {
  console.log(`\n> ${cmd} ${cmdArgs.join(" ")}`);
  const result = spawnSync(cmd, cmdArgs, {
    cwd: root,
    stdio: "inherit",
    ...opts,
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} exited with code ${result.status}`);
  }
}

function shoot(sceneId, outDir, extra = [], width = W, height = H, duration = 0) {
  const shootArgs = [
    "scripts/shoot.mjs",
    "--scene",
    sceneId,
    "--out",
    outDir,
    "--format",
    "jpg",
    "--seq",
    "--width",
    String(width),
    "--height",
    String(height),
  ];
  if (duration > 0) shootArgs.push("--duration", String(duration));
  shootArgs.push(...extra);
  run("node", shootArgs);
}

if (!skipBuild) {
  run("npm", ["run", "build"], { shell: true });
}

mkdirSync(outRoot, { recursive: true });

const selected = scenes.filter((s) => !only || only.has(s.id));

if (!skipRender) {
  for (const scene of selected) {
    const sceneDir = join(frameRoot, `s${scene.id}`);
    rmSync(sceneDir, { recursive: true, force: true });
    mkdirSync(sceneDir, { recursive: true });

    if (scene.panels) {
      const panelDirs = scene.panels.map((panel) => {
        const dir = join(sceneDir, `panel-${panel}`);
        mkdirSync(dir, { recursive: true });
        shoot(scene.id, dir, ["--panel", panel], W, 960, scene.duration);
        return dir;
      });
      run(ffmpeg, [
        "-y",
        "-framerate",
        String(FPS),
        "-start_number",
        "0",
        "-i",
        join(panelDirs[0], "f%04d.jpg"),
        "-framerate",
        String(FPS),
        "-start_number",
        "0",
        "-i",
        join(panelDirs[1], "f%04d.jpg"),
        "-filter_complex",
        "[0:v][1:v]vstack=inputs=2[v]",
        "-map",
        "[v]",
        "-q:v",
        "2",
        "-start_number",
        "0",
        join(sceneDir, "f%04d.jpg"),
      ]);
      rmSync(panelDirs[0], { recursive: true, force: true });
      rmSync(panelDirs[1], { recursive: true, force: true });
    } else {
      shoot(scene.id, sceneDir, [], W, H, scene.duration);
    }
  }
}

if (!skipEncode) {
  const clips = [];
  for (const scene of selected) {
    const sceneDir = join(frameRoot, `s${scene.id}`);
    const frames = join(sceneDir, "f%04d.jpg");
    if (!existsSync(join(sceneDir, "f0000.jpg"))) {
      throw new Error(`missing frames for scene ${scene.id}: ${frames}`);
    }
    const clip = join(outRoot, `${scene.slug}.mp4`);
    clips.push(clip);
    run(ffmpeg, [
      "-y",
      "-framerate",
      String(FPS),
      "-start_number",
      "0",
      "-i",
      frames,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "19",
      "-vf",
      "scale=in_range=pc:out_range=tv,format=yuv420p",
      "-color_range",
      "tv",
      "-pix_fmt",
      "yuv420p",
      "-colorspace",
      "bt709",
      "-color_primaries",
      "bt709",
      "-color_trc",
      "bt709",
      "-movflags",
      "+faststart",
      clip,
    ]);
  }

  const listPath = join(outRoot, "concat.txt");
  writeFileSync(
    listPath,
    clips.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n") + "\n",
    "utf8",
  );

  if (selected.length === scenes.length) {
    const final = join(outRoot, "sepeda_seimbang_1080x1920.mp4");
    run(ffmpeg, [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      final,
    ]);

    const probe = JSON.parse(
      execFileSync(
        ffprobe,
        [
          "-v",
          "error",
          "-count_frames",
          "-select_streams",
          "v:0",
          "-show_entries",
          "stream=nb_read_frames,duration,width,height,r_frame_rate",
          "-of",
          "json",
          final,
        ],
        { cwd: root, encoding: "utf8" },
      ),
    );
    console.log("\nfinal:", JSON.stringify(probe.streams?.[0] ?? {}, null, 2));

    const times = [1.5, 8, 16.5, 25, 37.5, 45.5, 52, 57];
    const filter =
      `select=${times.map((s) => `eq(n\\,${Math.round(s * FPS)})`).join("+")}` +
      ",scale=270:480,tile=4x2";
    run(ffmpeg, [
      "-y",
      "-i",
      final,
      "-vf",
      filter,
      "-frames:v",
      "1",
      "-update",
      "1",
      "-fps_mode",
      "vfr",
      join(outRoot, "preview-grid.jpg"),
    ]);
  }
  rmSync(listPath, { force: true });
}
