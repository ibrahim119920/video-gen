import { camera, effects, material, scene } from "@aura3d/engine";
import { COLORS } from "../bike";
import { makeHandRig } from "../stick";
import {
  baseLights,
  clamp,
  groundGrid,
  groundPlane,
  rad,
  smoothstep,
  stageEnvironment,
  stageSky,
} from "../stage";
import { ov } from "../overlay";

export const duration = 8.0;

type NodeHandle = {
  setRotation: (x: number, y: number, z: number) => NodeHandle;
  setPosition: (x: number, y: number, z: number) => NodeHandle;
  setScale: (scale: number | [number, number, number]) => NodeHandle;
  setVisible: (visible: boolean) => NodeHandle;
};
type AppLike = { nodes: { require: (id: string) => NodeHandle }; camera?: { setPose: (p: object) => void } };

const RIG_Y = 0.52;
const MOTION_START = 1.0;
const MOTION_END = 7.4;
const FREQ = 0.28;
const HAND_AMP = 0.105;
const TILT_AMP = rad(4.2);

export function build() {
  const rig = makeHandRig({ name: "stickRig", position: [0, RIG_Y, 0], ringColor: COLORS.green });

  const floorMat = material.pbr({ color: "#0A1522", roughness: 0.95 });
  const gridMat = material.pbr({
    color: "#2E4460",
    emissive: "#1A3050",
    emissiveIntensity: 0.22,
    roughness: 0.9,
  });

  const sceneB = scene({ background: "#070B12" })
    .add(stageSky({ zenith: "#060B14", horizon: "#0B1626", ground: "#05080E" }))
    .add(stageEnvironment(0.5))
    .addMany(baseLights({ key: 2.1, fill: 0.5, rim: 1.45, rimColor: COLORS.cyan }))
    .add(groundPlane("groundS5", 28, floorMat))
    .add(groundGrid("gridS5", { x0: -5, x1: 5, z0: -4, z1: 4, material: gridMat }))
    .add(rig)
    .add(effects.bloom({ intensity: 0.5, threshold: 0.84, scatter: 0.52 }))
    .add(effects.vignette({ intensity: 0.34, smoothness: 0.45 }))
    .add(
      effects.depthOfField({
        focusDistance: 3.7,
        fStop: 3.6,
        focalLength: 55,
        maxBlur: 6,
      }),
    )
    .camera(camera.perspective({ position: [1.15, 1.2, 3.6], target: [0.02, 0.8, 0], fov: 39 }));

  function motionAt(t: number) {
    const phase = 2 * Math.PI * FREQ * (t - MOTION_START);
    const env = smoothstep(clamp((t - MOTION_START) / 0.9)) * smoothstep(clamp((MOTION_END - t) / 0.8));
    return {
      handX: HAND_AMP * Math.sin(phase) * env,
      tilt: TILT_AMP * Math.sin(phase - 0.4) * env,
    };
  }

  function update(t: number, app: AppLike) {
    const { handX, tilt } = motionAt(t);
    app.nodes.require("stickRig").setPosition(handX, RIG_Y, 0);
    app.nodes.require("stickRig-stick").setPosition(0, 0.006, 0).setRotation(0, 0, -tilt);

    // Keep the shot quiet: the green support ring already carries the message.
    app.nodes.require("stickRig-plumb").setVisible(false);
    app.nodes.require("stickRig-gravity").setVisible(false);

    const push = smoothstep(clamp(t / 6.4));
    app.camera?.setPose({
      position: [1.15 - 0.1 * push, 1.2 - 0.03 * push, 3.6 - 0.22 * push],
      target: [0.02, 0.8, 0],
      fov: 39,
    });
  }

  function overlay(t: number) {
    ov.corner("TANGAN MENGIKUTI", clamp((t - 0.3) / 0.4) * 0.8);
    ov.divider(0);
    ov.hud("left", "", 0);
    ov.hud("right", "", 0);
    ov.callout("a", "", 0, 0, 0);
    ov.callout("b", "", 0, 0, 0);
    ov.callout("c", "✓  tetap tegak", clamp((t - 4.4) / 0.4) * clamp((7.55 - t) / 0.3), 60, 1330, COLORS.green);

    if (t < 4.4) {
      ov.sub(
        [["Namun jika kamu gerakkan tangan "], ["mengikuti arah miringnya tongkat,", COLORS.cyan]],
        clamp((t - 0.8) / 0.3) * clamp((4.4 - t) / 0.2),
      );
    } else {
      ov.sub(
        [["tongkatnya akan tetap "], ["tegak.", COLORS.green]],
        clamp((t - 4.4) / 0.3) * clamp((7.7 - t) / 0.25),
      );
    }
  }

  return { views: [{ selector: "#app", scene: sceneB, update }], overlay, duration };
}
