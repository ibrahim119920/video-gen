import { camera, effects, group, lights, material, primitives, scene } from "@aura3d/engine";
import { COLORS, torusRing, tube } from "../bike";
import { makeGhostBike } from "../ghost";
import {
  arrow3D,
  clamp,
  groundGrid,
  groundPlane,
  rad,
  smoothstep,
  stageEnvironment,
  stageSky,
} from "../stage";
import { ov } from "../overlay";

export const duration = 11.0;

type NodeHandle = {
  setRotation: (x: number, y: number, z: number) => NodeHandle;
  setPosition: (x: number, y: number, z: number) => NodeHandle;
  setScale: (x: number, y: number, z: number) => NodeHandle;
  setEmissive?: (color: string, intensity?: number) => NodeHandle;
};
type AppLike = { nodes: { require: (id: string) => NodeHandle }; camera?: { setPose: (p: object) => void } };

const H_COM = 0.72;

export function build() {
  const white = material.emissive({ color: "#EAF6FF", emissive: "#EAF6FF", emissiveIntensity: 1.8 });
  const yellow = material.emissive({ color: COLORS.yellow, emissive: COLORS.yellow, emissiveIntensity: 1.6 });

  const leanGroup = group("lean", [
    makeGhostBike({ name: "ghostS3", color: "#C9DAEF", opacity: 0.42 }),
    tube("pendulum-rod", [0, 0, 0], [0, H_COM, 0], 0.008, white, false),
    primitives.sphere({
      name: "com-ball",
      size: 0.14,
      position: [0, H_COM, 0],
      material: yellow,
      castShadow: false,
    }),
  ]).runtime({ id: "lean", mutable: true });

  const strip = primitives.box({
    name: "support-strip",
    size: [0.045, 0.01, 1.15],
    position: [0, 0.008, 0],
    material: material.emissive({ color: "#EAF6FF", emissive: "#EAF6FF", emissiveIntensity: 2.0 }),
  }).runtime({ id: "strip", mutable: true });

  const contactL = torusRing("contact-rear", 0.1, 0.005, {
    position: [0, 0.014, 0.55],
    rotation: [Math.PI / 2, 0, 0],
    material: white,
    radialSegments: 48,
    tubularSegments: 5,
  });
  const contactR = torusRing("contact-front", 0.1, 0.005, {
    position: [0, 0.014, -0.55],
    rotation: [Math.PI / 2, 0, 0],
    material: white,
    radialSegments: 48,
    tubularSegments: 5,
  });

  const plumb = primitives.cylinder({
    name: "plumb",
    size: [0.012, H_COM, 0.012],
    position: [0, H_COM / 2, 0.018],
    material: material.emissive({ color: COLORS.yellow, emissive: COLORS.yellow, emissiveIntensity: 2.0 }),
  }).runtime({ id: "plumb", mutable: true });

  const gravity = arrow3D("gravity", [0, 0, 0], [0, -1, 0], 0.4, COLORS.red, 0.014, {
    headLength: 0.09,
    emissiveIntensity: 1.2,
  }).runtime({ id: "gravity", mutable: true });

  const darkFloor = material.pbr({ color: "#1A2A40", roughness: 0.94 });
  const dimGrid = material.pbr({
    color: "#2E4460",
    emissive: "#1A3050",
    emissiveIntensity: 0.18,
    roughness: 0.9,
  });

  const sceneB = scene({ background: "#04070C" })
    .add(stageSky({ zenith: "#04070C", horizon: "#0A1422", ground: "#030509" }))
    .add(stageEnvironment(0.3))
    .add(lights.hemisphere({ skyColor: "#2B4A7A", groundColor: "#0F1B2D", intensity: 0.32 }))
    .add(
      lights.spot({
        name: "pool",
        position: [0.5, 6.5, 2.4],
        target: [0, 0.6, 0],
        angle: 0.55,
        penumbra: 0.85,
        distance: 16,
        intensity: 80,
        color: "#FFF1D6",
        shadow: true,
      }),
    )
    .add(
      lights.spot({
        name: "rim-red",
        position: [0.4, 2.4, -4],
        target: [0, 0.8, 0],
        angle: 0.45,
        penumbra: 0.6,
        distance: 10,
        intensity: 26,
        color: "#FF6B6B",
      }),
    )
    .add(
      lights.directional({
        name: "fill-cool",
        position: [3, 1.6, 3.2],
        target: [0, 0.6, 0],
        intensity: 0.55,
        color: "#9CC8FF",
      }),
    )
    .add(groundPlane("groundS3", 24, darkFloor))
    .add(groundGrid("gridS3", { x0: -5, x1: 5, z0: -5, z1: 5, material: dimGrid }))
    .add(strip)
    .add(contactL)
    .add(contactR)
    .add(leanGroup)
    .add(plumb)
    .add(gravity)
    .add(effects.bloom({ intensity: 0.5, threshold: 0.84, scatter: 0.5 }))
    .add(effects.vignette({ intensity: 0.4, smoothness: 0.42 }))
    .camera(camera.perspective({ position: [2.6, 1.2, 3.45], target: [0, 0.56, 0], fov: 41 }));

  function update(t: number, app: AppLike) {
    const still = smoothstep(clamp((t - 3.0) / 5.0));
    const slowFall = clamp((t - 8.0) / 2.6);
    let lean = rad(1) + rad(22) * still + rad(35) * slowFall ** 1.3;
    if (t > 3.0 && t < 4.2) {
      const d = t - 3.0;
      lean += rad(0.6) * Math.exp(-4.5 * d) * Math.sin(14 * d);
    }
    if (t > 10.6) {
      const d = t - 10.6;
      lean += rad(2.0) * Math.exp(-6 * d) * Math.sin(15 * d);
    }
    app.nodes.require("lean").setRotation(0, 0, lean);

    const ballX = -H_COM * Math.sin(lean);
    const ballY = H_COM * Math.cos(lean);

    // Plumb line from the CoM straight down.
    app.nodes.require("plumb").setPosition(ballX, ballY / 2, 0);
    app.nodes.require("plumb").setScale(1, ballY / H_COM, 1);
    app.nodes.require("gravity").setPosition(ballX, ballY - 0.06, 0);
    const gScale = Math.max(0.3, Math.min(1, (ballY - 0.1) / 0.4));
    app.nodes.require("gravity").setScale(1, gScale, 1);

    // The support strip turns red once the plumb line leaves it.
    const outside = Math.abs(ballX) > 0.052;
    app.nodes.require("strip").setEmissive?.(outside ? COLORS.red : "#EAF6FF", outside ? 2.0 : 1.1);

    const dolly = smoothstep(clamp(t / 5.0));
    const orbit = smoothstep(clamp((t - 8.0) / 2.6));
    const pos: [number, number, number] = [
      lerp2(lerp2(2.6, 2.28, dolly), 1.75, orbit),
      lerp2(lerp2(1.2, 1.14, dolly), 1.5, orbit),
      lerp2(lerp2(3.45, 3.0, dolly), 3.8, orbit),
    ];
    const target: [number, number, number] = [
      lerp2(0, -0.32, orbit),
      lerp2(0.58, 0.34, orbit),
      lerp2(0, 0.02, orbit),
    ];
    const roll = rad(7) * still * (1 - orbit * 0.85);
    app.camera?.setPose({ position: pos, target, fov: lerp2(41, 50, orbit), roll });
  }

  function overlay(t: number) {
    ov.corner("PENDULUM TERBALIK", clamp((t - 0.3) / 0.4) * 0.8);
    ov.divider(0);
    ov.callout("a", "Pusat massa", clamp((t - 1.4) / 0.4) * clamp((7.2 - t) / 0.3), 60, 240);
    ov.callout("b", "di luar garis tumpu", clamp((t - 5.4) / 0.4) * clamp((9.4 - t) / 0.3), 60, 1390);
    ov.callout("c", "", 0, 0, 0);

    if (t < 4.6) {
      ov.sub(
        [["Saat diam, sepeda seperti "], ["tongkat di ujung jari.", COLORS.yellow]],
        clamp((t - 0.7) / 0.3) * clamp((4.6 - t) / 0.2),
      );
    } else if (t < 7.8) {
      ov.sub(
        [["Sedikit miring, pusat massanya keluar dari "], ["titik tumpu.", COLORS.red]],
        clamp((t - 4.6) / 0.3) * clamp((7.8 - t) / 0.2),
      );
    } else {
      ov.sub(
        [["Gravitasi "], ["menariknya jatuh.", COLORS.red]],
        clamp((t - 7.8) / 0.3) * clamp((10.6 - t) / 0.25),
      );
    }
  }

  return { views: [{ selector: "#app", scene: sceneB, update }], overlay, duration };
}

function lerp2(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
