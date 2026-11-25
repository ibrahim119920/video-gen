import { camera, effects, group, lights, material, primitives, scene } from "@aura3d/engine";
import { COLORS, makeBike, torusRing } from "../bike";
import {
  baseLights,
  clamp,
  lerp,
  rad,
  smoothstep,
  stageEnvironment,
  stageSky,
} from "../stage";
import { ov } from "../overlay";

export const duration = 7.0;

type NodeHandle = {
  setRotation: (x: number, y: number, z: number) => NodeHandle;
  setPosition: (x: number, y: number, z: number) => NodeHandle;
  setScale: (x: number, y: number, z: number) => NodeHandle;
  setEmissive?: (color: string, intensity?: number) => NodeHandle;
};
type AppLike = { nodes: { require: (id: string) => NodeHandle }; camera?: { setPose: (p: object) => void } };

const V0 = 6.0;
const DECEL = 0.8;
const T_FALL = 5.0;

function speedAt(t: number) {
  return Math.max(0, V0 - DECEL * t);
}

function travel(t: number) {
  const tStop = Math.min(t, V0 / DECEL);
  return V0 * tStop - 0.5 * DECEL * tStop * tStop;
}

function wobbleAt(t: number) {
  const growth = clamp((t - 1.2) / 4.0);
  const amp = rad(1.2 + 6.5 * growth * growth);
  const omega = 2.7 + 0.35 * t;
  if (t < T_FALL) {
    return amp * Math.sin(omega * t + 0.5);
  }
  const before = amp * Math.sin(omega * T_FALL + 0.5);
  const k = smoothstep(clamp((t - T_FALL) / 1.1));
  return before + rad(52) * k ** 1.25 + rad(2) * Math.exp(-6 * (t - T_FALL)) * Math.sin(16 * (t - T_FALL));
}

function steerAt(t: number) {
  // The correction lags the lean as the speed bleeds off.
  const growth = clamp((t - 1.2) / 4.0);
  const amp = rad(2.0 + 9.0 * growth * growth);
  const omega = 2.7 + 0.35 * t;
  if (t < T_FALL) return amp * Math.sin(omega * t + 0.5 - 0.55);
  return amp * Math.sin(omega * T_FALL + 0.5 - 0.55) * clamp((T_FALL + 1.2 - t) / 1.2);
}

export function build() {
  const bike = makeBike({ name: "bikeS6", prefix: "S6", rider: true });

  const rearRing = torusRing("contact-rear", 0.08, 0.006, {
    position: [0, 0.02, 0.55],
    rotation: [Math.PI / 2, 0, 0],
    material: material.emissive({ color: COLORS.cyan, emissive: COLORS.cyan, emissiveIntensity: 1.6 }),
    radialSegments: 48,
    tubularSegments: 5,
  }).runtime({ id: "contactR", mutable: true });

  const frontRing = torusRing("contact-front", 0.08, 0.006, {
    position: [0, 0.02, -0.55],
    rotation: [Math.PI / 2, 0, 0],
    material: material.emissive({ color: COLORS.amber, emissive: COLORS.amber, emissiveIntensity: 1.6 }),
    radialSegments: 48,
    tubularSegments: 5,
  }).runtime({ id: "contactF", mutable: true });

  const gridMat = material.pbr({
    color: COLORS.grid,
    emissive: "#20364F",
    emissiveIntensity: 0.34,
    roughness: 0.8,
  });
  const gridLines = [];
  for (let z = 4; z >= -14; z -= 1) {
    gridLines.push(
      primitives.box({
        name: `gx-${z}`,
        size: [20, 0.008, 0.014],
        position: [0, 0.006, z],
        material: gridMat,
        castShadow: false,
        receiveShadow: false,
      }),
    );
  }
  for (let x = -10; x <= 10; x += 1) {
    gridLines.push(
      primitives.box({
        name: `gz-${x}`,
        size: [0.014, 0.008, 20],
        position: [x, 0.006, -5],
        material: gridMat,
        castShadow: false,
        receiveShadow: false,
      }),
    );
  }
  const grid = group("gridS6", gridLines).runtime({ id: "gridS6", mutable: true });

  const sceneB = scene({ background: "#070B12" })
    .add(stageSky({ zenith: "#050A12", horizon: "#0C1728", ground: "#04070C" }))
    .add(stageEnvironment(0.5))
    .addMany(baseLights({ key: 2.1, fill: 0.5, rim: 1.2 }))
    .add(
      lights.directional({
        name: "red-alert",
        position: [-3, 2.2, -4],
        target: [0, 0.9, 0],
        intensity: 0.55,
        color: "#FF4D5E",
      }),
    )
    .add(
      primitives.plane({
        name: "groundS6",
        size: [30, 1, 30],
        position: [0, 0, -5],
        material: material.pbr({ color: "#1A2638", roughness: 0.94 }),
        receiveShadow: true,
      }),
    )
    .add(grid)
    .add(bike)
    .add(rearRing)
    .add(frontRing)
    .add(effects.bloom({ intensity: 0.44, threshold: 0.84, scatter: 0.5 }))
    .add(effects.vignette({ intensity: 0.3, smoothness: 0.45 }))
    .camera(camera.perspective({ position: [1.15, 1.2, 4.5], target: [0, 0.78, 0], fov: 40 }));

  function update(t: number, app: AppLike) {
    const lean = wobbleAt(t);
    const steer = steerAt(t);
    app.nodes.require("bikeS6").setRotation(0, 0, lean);
    app.nodes.require("S6-steer").setRotation(0, steer, 0);

    const spin = -travel(t) / 0.34;
    app.nodes.require("S6-rear-wheel").setRotation(spin, 0, 0);
    app.nodes.require("S6-front-wheel").setRotation(spin, 0, 0);
    app.nodes.require("gridS6").setPosition(0, 0, travel(t) % 1);

    // Contact rings slide with the tiny sideways drift of the tyres.
    app.nodes.require("contactR").setPosition(-0.34 * Math.sin(lean), 0.02, 0.55);
    app.nodes.require("contactF").setPosition(-0.34 * Math.sin(lean), 0.02, -0.55);

    // The bike falls toward -X. Watch it across the frame from a rear 3/4.
    const fall = smoothstep(clamp((t - T_FALL) / 1.1));
    app.camera?.setPose({
      position: [
        lerp(1.15, 1.6, fall),
        lerp(1.2, 0.9, fall),
        lerp(4.5, 4.0, fall),
      ],
      target: [
        lerp(0, -0.28, fall),
        lerp(0.78, 0.46, fall),
        0,
      ],
      fov: lerp(40, 43, fall),
      roll: rad(2.5) * Math.sin(2.7 * t) * (1 - fall),
    });
  }

  function overlay(t: number) {
    ov.corner("TERLALU LAMBAT", clamp((t - 0.3) / 0.4) * 0.8);
    ov.divider(0);
    const v = speedAt(t);
    ov.speedo(v, clamp((t - 0.4) / 0.4) * clamp((6.55 - t) / 0.3), v > 3.0);
    ov.callout("a", "", 0, 0, 0);
    ov.callout("b", "koreksi terlambat", clamp((t - 4.3) / 0.4) * clamp((6.4 - t) / 0.3), 60, 1330);
    ov.callout("c", "", 0, 0, 0);

    const samples: number[] = [];
    for (let i = 0; i < 44; i += 1) {
      const tt = Math.max(0, t - 1.6 + (i / 43) * 1.6);
      samples.push(wobbleAt(tt) / rad(50));
    }
    ov.scope(samples, clamp((t - 0.8) / 0.5), COLORS.red);

    if (t < 3.2) {
      ov.sub(
        [["Melambat, sepeda jadi "], ["makin sulit dikoreksi.", COLORS.amber]],
        clamp((t - 0.7) / 0.3) * clamp((3.2 - t) / 0.2),
      );
    } else if (t < 5.8) {
      ov.sub(
        [["Ayunan setir makin "], ["lebar dan cepat.", COLORS.amber]],
        clamp((t - 3.2) / 0.3) * clamp((5.8 - t) / 0.2),
      );
    } else {
      ov.sub(
        [["Koreksi tak lagi "], ["cukup.", COLORS.red]],
        clamp((t - 5.8) / 0.3) * clamp((6.7 - t) / 0.25),
      );
    }
  }

  return { views: [{ selector: "#app", scene: sceneB, update }], overlay, duration };
}
