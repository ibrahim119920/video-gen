import { camera, effects, group, lights, material, scene } from "@aura3d/engine";
import { COLORS, HEAD_CENTER, HEAD_TILT, HEAD_TOP, makeBike, torusRing, tube } from "../bike";
import {
  clamp,
  easeInOut,
  groundGrid,
  groundPlane,
  lerp,
  rad,
  smoothstep,
  stageEnvironment,
  stageSky,
} from "../stage";
import { ov } from "../overlay";

export const duration = 9.0;

type V3 = [number, number, number];
type NodeHandle = {
  setRotation: (x: number, y: number, z: number) => NodeHandle;
  setPosition: (x: number, y: number, z: number) => NodeHandle;
  setScale: (x: number, y: number, z: number) => NodeHandle;
  setVisible: (visible: boolean) => NodeHandle;
  setOpacity?: (opacity: number) => NodeHandle;
};
type AppLike = { nodes: { require: (id: string) => NodeHandle }; camera?: { setPose: (p: object) => void } };

// Steering axis meets the ground slightly ahead of the tyre contact: that gap is trail.
const AXIS_GROUND_Z = HEAD_CENTER[2] - (HEAD_CENTER[1] / Math.cos(HEAD_TILT)) * Math.sin(HEAD_TILT);
const HUB: V3 = (() => {
  const y = -0.465;
  const z = -0.02;
  const c = Math.cos(HEAD_TILT);
  const s = Math.sin(HEAD_TILT);
  return [HEAD_CENTER[0], HEAD_CENTER[1] + y * c - z * s, HEAD_CENTER[2] + y * s + z * c];
})();

export function build() {
  const bike = makeBike({ name: "bikeS5", prefix: "S5" });

  const pulse = torusRing("pulse", 0.12, 0.0035, {
    position: [0, 0.024, 0.15],
    rotation: [Math.PI / 2, 0, 0],
    material: material.emissive({ color: COLORS.yellow, emissive: COLORS.yellow, emissiveIntensity: 1.8 }),
    radialSegments: 64,
    tubularSegments: 5,
  }).runtime({ id: "pulse", mutable: true });

  // Dashed steering axis: thick enough to read at 1080 px.
  const axisTop: V3 = [0, HEAD_TOP[1] + 0.02, HEAD_TOP[2]];
  const axisBot: V3 = [0, 0.012, AXIS_GROUND_Z];
  const axisDir: V3 = [axisBot[0] - axisTop[0], axisBot[1] - axisTop[1], axisBot[2] - axisTop[2]];
  const axisLen = Math.hypot(...axisDir);
  const axisUnit: V3 = [axisDir[0] / axisLen, axisDir[1] / axisLen, axisDir[2] / axisLen];
  const axisMat = material.emissive({ color: COLORS.yellow, emissive: COLORS.yellow, emissiveIntensity: 2.6 });
  const axisDashes = [];
  for (let d = 0.02; d < axisLen - 0.02; d += 0.085) {
    const e = Math.min(d + 0.05, axisLen - 0.01);
    const a: V3 = [axisTop[0] + axisUnit[0] * d, axisTop[1] + axisUnit[1] * d, axisTop[2] + axisUnit[2] * d];
    const b: V3 = [axisTop[0] + axisUnit[0] * e, axisTop[1] + axisUnit[1] * e, axisTop[2] + axisUnit[2] * e];
    axisDashes.push(tube(`axis-dash-${axisDashes.length}`, a, b, 0.0045, axisMat, false));
  }
  const axis = group("steer-axis", axisDashes).runtime({ id: "axis", mutable: true });

  // Dimension bracket for trail, drawn in the wheel plane: horizontal run plus end ticks.
  const dim = material.emissive({ color: COLORS.cyan, emissive: COLORS.cyan, emissiveIntensity: 2.4 });
  const dimY = 0.03;
  const trailBracket = group(
    "trail-dim",
    [
      tube("trail-run", [0, dimY, -0.55], [0, dimY, AXIS_GROUND_Z], 0.005, dim, false),
      tube("trail-tick-a", [0, 0.003, AXIS_GROUND_Z], [0, 0.072, AXIS_GROUND_Z], 0.0045, dim, false),
      tube("trail-tick-b", [0, 0.003, -0.55], [0, 0.072, -0.55], 0.0045, dim, false),
    ],
  ).runtime({ id: "trail", mutable: true });

  const contact = torusRing("contact", 0.075, 0.006, {
    position: [0, 0.012, -0.55],
    rotation: [Math.PI / 2, 0, 0],
    material: material.emissive({ color: "#EAF6FF", emissive: "#EAF6FF", emissiveIntensity: 2.0 }),
    radialSegments: 48,
    tubularSegments: 5,
  }).runtime({ id: "contact", mutable: true });

  // Ghost outline of the front wheel for the fork close-up.
  const ghostMat = material.emissive({ color: COLORS.cyan, emissive: COLORS.cyan, emissiveIntensity: 1.8 });
  const ghostSpokes = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const r = 0.31;
    return tube(`ghost-spoke-${i}`, [0, 0, 0], [0, Math.cos(a) * r, Math.sin(a) * r], 0.0022, ghostMat, false);
  });
  const ghostWheel = group(
    "ghost-wheel",
    [
      torusRing("ghost-wheel-rim", 0.32, 0.004, {
        rotation: [0, Math.PI / 2, 0],
        material: ghostMat,
        radialSegments: 72,
        tubularSegments: 5,
      }),
      ...ghostSpokes,
    ],
    { position: HUB },
  ).runtime({ id: "ghostWheel", mutable: true });

  const warmFloor = material.pbr({ color: "#1F3350", roughness: 0.9 });
  const gridMat = material.pbr({
    color: "#3A4F6D",
    emissive: "#1D3354",
    emissiveIntensity: 0.3,
    roughness: 0.8,
  });

  const sceneB = scene({ background: COLORS.bgTop })
    .add(stageSky())
    .add(stageEnvironment(0.65))
    .add(lights.hemisphere({ skyColor: "#2B4A7A", groundColor: "#0F1B2D", intensity: 0.5 }))
    .add(
      lights.directional({
        name: "warm-low",
        position: [3.5, 2.2, -4.5],
        target: [0, 0.7, 0],
        intensity: 2.4,
        color: "#FFE2B8",
        shadow: true,
      }),
    )
    .add(
      lights.directional({
        name: "fill",
        position: [-5, 2.2, 2.2],
        target: [0, 0.7, 0],
        intensity: 0.5,
        color: "#6EA8FF",
      }),
    )
    .add(
      lights.directional({
        name: "rim",
        position: [0, 3, -6],
        target: [0, 0.8, 0],
        intensity: 1.3,
        color: "#8FD3FF",
      }),
    )
    .add(groundPlane("groundS5", 34, warmFloor))
    .add(groundGrid("gridS5", { x0: -7, x1: 7, z0: -12, z1: 6, material: gridMat }))
    .add(bike)
    .add(pulse)
    .add(axis)
    .add(contact)
    .add(trailBracket)
    .add(ghostWheel)
    .add(effects.bloom({ intensity: 0.4, threshold: 0.86, scatter: 0.5 }))
    .add(effects.vignette({ intensity: 0.2, smoothness: 0.48 }))
    .add(effects.depthOfField({ focusDistance: 2.3, fStop: 3.0, focalLength: 55, maxBlur: 9 }).runtime({ id: "dof", mutable: true }))
    .camera(camera.perspective({ position: [-3.35, 1.05, -2.85], target: [0, 0.62, 0], fov: 42 }));

  function leanAt(t: number) {
    // Small nudge at 2 s, then a deliberate weave so the steering is readable.
    let angle = 0;
    if (t >= 2.0) {
      const d = t - 2.0;
      angle += rad(3.2) * Math.exp(-0.9 * d) * Math.sin(2.2 * d);
    }
    const weave = clamp((t - 3.6) / 0.7) * clamp((5.9 - t) / 0.7);
    if (weave > 0) {
      angle += rad(6.5) * weave * Math.sin(2 * Math.PI * 0.55 * (t - 3.6));
    }
    return angle;
  }

  function update(t: number, app: AppLike) {
    const lean = leanAt(t);
    const drift = t < 2.0 ? 0 : 0.05 * Math.exp(-0.6 * (t - 2)) * Math.sin(1.8 * (t - 2));
    app.nodes.require("bikeS5").setPosition(drift, 0, 0);
    app.nodes.require("bikeS5").setRotation(0, 0, lean);
    app.nodes.require("S5-steer").setRotation(0, lean * 1.9, 0);

    const spin = -(5.5 * t) / 0.34;
    app.nodes.require("S5-rear-wheel").setRotation(spin, 0, 0);
    app.nodes.require("S5-front-wheel").setRotation(spin, 0, 0);
    app.nodes.require("gridS5").setPosition(0, 0, (5.5 * t) % 1);

    // Saddle nudge at 2 s: a ring ripples out across the floor.
    if (t < 2.0 || t > 2.95) {
      app.nodes.require("pulse").setVisible(false);
    } else {
      const k = clamp((t - 2.0) / 0.9);
      const s = 1 + k * 6.5;
      app.nodes.require("pulse").setVisible(true).setScale(s, s, s);
    }

    // Close-up blueprint reveal.
    const reveal = t > 5.6;
    app.nodes.require("axis").setVisible(reveal);
    app.nodes.require("contact").setVisible(reveal);
    app.nodes.require("trail").setVisible(reveal);
    app.nodes.require("ghostWheel").setVisible(reveal);
    app.nodes.require("S5-front-wheel").setVisible(!reveal);
    app.nodes.require("dof").setVisible(t > 4.6);

    // Wide tracking shot, then a low side-on push around the fork.
    const push = easeInOut(clamp((t - 4.6) / 1.5));
    const orbit = smoothstep(clamp((t - 6.3) / 2.5));
    const pos: [number, number, number] = [
      lerp(lerp(-3.35, 1.95, push), 2.4, orbit),
      lerp(lerp(1.05, 0.52, push), 0.5, orbit),
      lerp(lerp(-2.85, -2.35, push), -0.1, orbit),
    ];
    const target: [number, number, number] = [
      0,
      lerp(lerp(0.62, 0.32, push), 0.3, orbit),
      lerp(lerp(0, -0.55, push), -0.58, orbit),
    ];
    app.camera?.setPose({
      position: pos,
      target,
      fov: lerp(lerp(42, 35, push), 34, orbit),
    });
  }

  function overlay(t: number) {
    ov.corner("TANPA PENGENDARA", clamp((t - 0.3) / 0.4) * 0.8);
    ov.divider(0);
    ov.speedo(5.5, clamp((t - 0.5) / 0.4), true);
    ov.callout("a", "trail", clamp((t - 6.4) / 0.4) * clamp((8.7 - t) / 0.3), 650, 1345);
    ov.callout("b", "", 0, 0, 0);
    ov.callout("c", "", 0, 0, 0);
    ov.scope([], 0);

    if (t < 3.8) {
      ov.sub(
        [["Bahkan tanpa pengendara, "], ["geometri garpu depan", COLORS.cyan], [" membantu."]],
        clamp((t - 0.7) / 0.3) * clamp((3.8 - t) / 0.2),
      );
    } else if (t < 5.7) {
      ov.sub(
        [["Roda depan otomatis berbelok "], ["ke arah miring.", COLORS.cyan]],
        clamp((t - 3.8) / 0.3) * clamp((5.7 - t) / 0.2),
      );
    } else {
      ov.sub(
        [["Asalkan sepedanya "], ["cukup cepat.", COLORS.green]],
        clamp((t - 5.7) / 0.3) * clamp((8.7 - t) / 0.25),
      );
    }
  }

  return { views: [{ selector: "#app", scene: sceneB, update }], overlay, duration };
}
