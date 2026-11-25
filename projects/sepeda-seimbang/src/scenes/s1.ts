import { camera, effects, scene } from "@aura3d/engine";
import { COLORS, makeBike } from "../bike";
import {
  baseLights,
  clamp,
  dustRing,
  easeInOut,
  groundGrid,
  groundPlane,
  rad,
  stageEnvironment,
  stageSky,
} from "../stage";
import { ov } from "../overlay";

export const duration = 6.0;

type NodeHandle = {
  setRotation: (x: number, y: number, z: number) => NodeHandle;
  setPosition: (x: number, y: number, z: number) => NodeHandle;
  setScale: (x: number, y: number, z: number) => NodeHandle;
  setVisible: (visible: boolean) => NodeHandle;
  setOpacity?: (opacity: number) => NodeHandle;
};
type AppLike = { nodes: { require: (id: string) => NodeHandle }; camera?: { setPose: (p: object) => void } };
type View = { selector: string; scene: ReturnType<typeof scene>; update: (t: number, app: AppLike) => void };

function leftView(): View {
  const bike = makeBike({ name: "bikeL", prefix: "L" });
  const grid = groundGrid("gridL", { x0: -7, x1: 7, z0: -7, z1: 7 });
  const dust = dustRing("dustL", [-0.5, 0, 0.22]).runtime({ id: "dustL", mutable: true });

  const sceneB = scene({ background: COLORS.bgTop })
    .add(stageSky())
    .add(stageEnvironment(0.55))
    .addMany(baseLights({ key: 1.85, fill: 0.55, rim: 1.05 }))
    .add(groundPlane("groundL", 32))
    .add(grid)
    .add(bike)
    .add(dust)
    .add(effects.bloom({ intensity: 0.4, threshold: 0.86, scatter: 0.5 }))
    .add(effects.vignette({ intensity: 0.26, smoothness: 0.45 }))
    .camera(camera.perspective({ position: [2.85, 0.98, 1.3], target: [-0.3, 0.6, 0], fov: 40 }));

  function update(t: number, app: AppLike) {
    // A held bike, nudged at 1 s: an inverted pendulum accelerating to the ground.
    const u = clamp((t - 1.05) / 3.05);
    let lean = rad(2) + rad(70) * u ** 2.55;
    if (t > 1.05) {
      const d = t - 1.05;
      lean += rad(1.1) * Math.exp(-5.2 * d) * Math.sin(16 * d);
    }
    if (t > 4.1) {
      const d = t - 4.1;
      lean += rad(2.2) * Math.exp(-5.5 * d) * Math.sin(15 * d);
    }
    app.nodes.require("bikeL").setRotation(0, 0, lean);
    // Rest on the handlebar/pedal rather than sinking the wheels into the grid.
    app.nodes.require("bikeL").setPosition(0, 0.03 * Math.sin(lean) ** 2, 0);
    // Front wheel flops as the frame goes down.
    app.nodes.require("L-steer").setRotation(0, -lean * 0.22, 0);

    // Impact dust: expands and fades after the frame lands.
    if (t < 4.12) {
      app.nodes.require("dustL").setVisible(false);
    } else {
      const k = clamp((t - 4.12) / 0.62);
      const s = 0.45 + k * 2.4;
      app.nodes.require("dustL").setVisible(true).setScale(s, 1, s);
      app.nodes.require("dustL").setOpacity?.(0.55 * (1 - k));
    }

    // Slow dolly-in over the first 4 s.
    const d = easeInOut(clamp(t / 4.2));
    app.camera?.setPose({
      position: [2.85 - 0.22 * d, 0.98, 1.3 - 0.14 * d],
      target: [-0.3, 0.6, 0],
      fov: 40,
    });
  }

  return { selector: "#app", scene: sceneB, update };
}

function rightView(): View {
  const bike = makeBike({ name: "bikeR", prefix: "R" });
  const grid = groundGrid("gridR", { x0: -7, x1: 7, z0: -12, z1: 6 });

  const sceneB = scene({ background: COLORS.bgTop })
    .add(stageSky())
    .add(stageEnvironment(0.6))
    .addMany(baseLights({ key: 2.25, fill: 0.6, rim: 1.25 }))
    .add(groundPlane("groundR", 34))
    .add(grid)
    .add(bike)
    .add(effects.bloom({ intensity: 0.42, threshold: 0.85, scatter: 0.5 }))
    .add(effects.vignette({ intensity: 0.22, smoothness: 0.45 }))
    .camera(camera.perspective({ position: [3.0, 1.0, 0.85], target: [0, 0.6, -0.05], fov: 40 }));

  function update(t: number, app: AppLike) {
    // Rolling at 5.5 m/s with a tiny natural sway; steering chases the lean.
    const sway = rad(1.25) * Math.sin(2 * Math.PI * 0.52 * t + 0.4);
    app.nodes.require("bikeR").setRotation(0, 0, sway);
    app.nodes.require("R-steer").setRotation(0, sway * 2.4, 0);

    const spin = -(5.5 * t) / 0.34;
    app.nodes.require("R-rear-wheel").setRotation(spin, 0, 0);
    app.nodes.require("R-front-wheel").setRotation(spin, 0, 0);

    // Simulate forward travel by scrolling the ground toward the camera.
    app.nodes.require("gridR").setPosition(0, 0, (5.5 * t) % 1);
  }

  return { selector: "#app", scene: sceneB, update };
}

export function build(panel = "left") {
  const isLeft = panel !== "right";
  const view = isLeft ? leftView() : rightView();

  function overlay(t: number) {
    if (isLeft) {
      ov.tag("left", "DIAM", COLORS.red, clamp((t - 0.5) / 0.35));
      ov.sub([], 0);
      ov.divider(0);
      return;
    }

    ov.tag("right", "BERGERAK", COLORS.green, clamp((t - 0.5) / 0.35));
    ov.divider(0);
    if (t < 3.35) {
      ov.sub(
        [["Sepeda itu aneh. "], ["Diam, ia roboh.", COLORS.red]],
        clamp((t - 0.72) / 0.25) * clamp((3.35 - t) / 0.2),
      );
    } else {
      ov.sub(
        [["Melaju, ia "], ["tegak sendiri.", COLORS.green]],
        clamp((t - 3.35) / 0.22) * clamp((5.72 - t) / 0.18),
      );
    }
  }

  return { views: [view], overlay, duration, panel };
}
