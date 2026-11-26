import { camera, effects, group, lights, material, primitives, scene } from "@aura3d/engine";
import { COLORS, makeBike } from "../bike";
import { clamp, lerp, rad, smoothstep, stageEnvironment, stageSky } from "../stage";
import { ov } from "../overlay";

export const duration = 6.0;

type NodeHandle = {
  setRotation: (x: number, y: number, z: number) => NodeHandle;
  setPosition: (x: number, y: number, z: number) => NodeHandle;
};
type AppLike = { nodes: { require: (id: string) => NodeHandle }; camera?: { setPose: (p: object) => void } };

const SPEED = 1.6;

export function build() {
  const bike = makeBike({ name: "bikeS9", prefix: "S9", rider: true });

  const gridMat = material.pbr({
    color: "#6B4A3A",
    emissive: "#4A2A18",
    emissiveIntensity: 0.35,
    roughness: 0.82,
  });
  const gridLines = [];
  for (let z = 6; z >= -30; z -= 2) {
    gridLines.push(
      primitives.box({
        name: `gx-${z}`,
        size: [60, 0.008, 0.016],
        position: [0, 0.006, z],
        material: gridMat,
        castShadow: false,
        receiveShadow: false,
      }),
    );
  }
  for (let x = -20; x <= 20; x += 2) {
    gridLines.push(
      primitives.box({
        name: `gz-${x}`,
        size: [0.016, 0.008, 40],
        position: [x, 0.006, -12],
        material: gridMat,
        castShadow: false,
        receiveShadow: false,
      }),
    );
  }
  const grid = group("gridS9", gridLines).runtime({ id: "gridS9", mutable: true });

  const sceneB = scene({ background: "#0D1424" })
    .add(
      stageSky({
        zenith: "#1B2C4A",
        horizon: "#F2A15C",
        ground: "#241822",
      }),
    )
    .add(stageEnvironment(0.55))
    .add(
      lights.hemisphere({
        skyColor: "#3A4A6A",
        groundColor: "#2A1A18",
        intensity: 0.6,
      }),
    )
    .add(
      lights.directional({
        name: "sun-key",
        position: [5, 1.7, -4.2],
        target: [0, 0.8, 0],
        intensity: 4.0,
        color: "#FFB36B",
        shadow: { softness: 2 },
      }),
    )
    .add(
      lights.directional({
        name: "fill",
        position: [-4.5, 2.6, 3.2],
        target: [0, 0.8, 0],
        intensity: 1.0,
        color: "#8FA8C9",
      }),
    )
    .add(
      lights.spot({
        name: "camera-fill",
        position: [4, 2.6, 3.2],
        target: [0, 0.9, 0],
        angle: 0.6,
        penumbra: 0.85,
        distance: 14,
        intensity: 28,
        color: "#FFC08A",
      }),
    )
    .add(
      lights.directional({
        name: "rim",
        position: [0, 2.4, -6],
        target: [0, 1.0, 0],
        intensity: 1.6,
        color: "#FFD9A0",
      }),
    )
    .add(
      primitives.plane({
        name: "groundS9",
        size: [70, 1, 70],
        position: [0, 0, -12],
        material: material.pbr({ color: "#33241F", roughness: 0.88 }),
        receiveShadow: true,
      }),
    )
    .add(grid)
    .add(bike)
    .add(effects.bloom({ intensity: 0.55, threshold: 0.82, scatter: 0.55 }))
    .add(effects.vignette({ intensity: 0.28, smoothness: 0.44 }))
    .camera(camera.perspective({ position: [2.35, 0.88, 2.7], target: [0, 0.85, 0], fov: 40 }));

  function update(t: number, app: AppLike) {
    const dist = SPEED * t;
    const sway = rad(1.1) * Math.sin(0.9 * t + 0.4);
    app.nodes.require("bikeS9").setRotation(0, 0, sway);
    app.nodes.require("S9-steer").setRotation(0, sway * 1.8, 0);

    const spin = -dist / 0.34;
    app.nodes.require("S9-rear-wheel").setRotation(spin, 0, 0);
    app.nodes.require("S9-front-wheel").setRotation(spin, 0, 0);
    app.nodes.require("gridS9").setPosition(0, 0, dist % 2);

    const crane = smoothstep(clamp(t / 4.8));
    app.camera?.setPose({
      position: [
        lerp(2.35, 3.9, crane),
        lerp(0.88, 2.55, crane),
        lerp(2.7, 6.4, crane),
      ],
      target: [0, lerp(0.85, 0.95, crane), lerp(0, -0.3, crane)],
      fov: lerp(40, 42, crane),
    });
  }

  function overlay(t: number) {
    ov.corner("", 0);
    ov.divider(0);
    ov.speedo(0, 0);
    ov.scope([], 0);
    ov.hud("left", "", 0);
    ov.callout("a", "", 0, 0, 0);
    ov.callout("b", "", 0, 0, 0);
    ov.callout("c", "", 0, 0, 0);

    const fadeIn = 1 - clamp(t / 0.55);
    const dim = 0.34 * smoothstep(clamp((t - 3.0) / 0.9));
    ov.fade(Math.max(fadeIn, dim));

    if (t < 2.15) {
      ov.sub(
        [["Pesan moral hari ini adalah:"]],
        clamp((t - 0.6) / 0.3) * clamp((2.15 - t) / 0.2),
      );
    } else {
      ov.sub(
        [
          ["terus bergerak maju", COLORS.green],
          [" dan "],
          ["mengoreksi diri", COLORS.cyan],
          [", adalah syarat kita bertahan di kehidupan ini."],
        ],
        clamp((t - 2.15) / 0.3) * clamp((5.85 - t) / 0.2),
      );
    }

    const titleP = clamp((t - 2.15) / 0.7);
    ov.title("TERUS BERGERAK", titleP, { size: 70, y: -390 });
  }

  return { views: [{ selector: "#app", scene: sceneB, update }], overlay, duration };
}
