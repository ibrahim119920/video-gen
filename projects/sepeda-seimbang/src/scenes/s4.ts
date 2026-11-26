import { camera, effects, material, scene } from "@aura3d/engine";
import { COLORS } from "../bike";
import { makeHandRig, STICK_LEN } from "../stick";
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
  setEmissive?: (color: string, intensity?: number) => NodeHandle;
};
type AppLike = { nodes: { require: (id: string) => NodeHandle }; camera?: { setPose: (p: object) => void } };

const RIG_Y = 0.52;
const TIP_START = 2.3;
const TIP_END = 4.5;
const SLIP_START = 4.95;
const SLIP_END = 5.9;
const COM = STICK_LEN * 0.5;

export function build() {
  const rig = makeHandRig({ name: "stickRig", position: [0, RIG_Y, 0] });

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
    .add(groundPlane("groundS4", 28, floorMat))
    .add(groundGrid("gridS4", { x0: -5, x1: 5, z0: -4, z1: 4, material: gridMat }))
    .add(rig)
    .add(effects.bloom({ intensity: 0.5, threshold: 0.84, scatter: 0.52 }))
    .add(effects.vignette({ intensity: 0.34, smoothness: 0.45 }))
    .add(
      effects.depthOfField({
        focusDistance: 4.1,
        fStop: 3.4,
        focalLength: 55,
        maxBlur: 7,
      }),
    )
    .camera(camera.perspective({ position: [1.55, 1.3, 4.05], target: [0.25, 0.72, 0], fov: 40 }));

  function stickState(t: number) {
    const u = clamp((t - TIP_START) / (TIP_END - TIP_START));
    let angle = rad(1.0) + rad(66) * u ** 2.1;
    if (t > TIP_START && t < TIP_START + 0.8) {
      const d = t - TIP_START;
      angle += rad(0.7) * Math.exp(-4.5 * d) * Math.sin(15 * d);
    }
    if (t > TIP_END && t < SLIP_START) {
      const d = t - TIP_END;
      angle += rad(1.2) * Math.exp(-5.0 * d) * Math.sin(13 * d);
    }
    const slip = smoothstep(clamp((t - SLIP_START) / (SLIP_END - SLIP_START)));
    angle += rad(19) * slip;
    const baseX = 0.24 * slip;
    const baseY = 0.006 - (RIG_Y - 0.006) * slip;
    return { angle, baseX, baseY, slip };
  }

  function update(t: number, app: AppLike) {
    const { angle, baseX, baseY, slip } = stickState(t);
    app.nodes.require("stickRig-stick").setPosition(baseX, baseY, 0).setRotation(0, 0, -angle);

    const comX = baseX + COM * Math.sin(angle);
    const comY = baseY + COM * Math.cos(angle);
    const plant = 0.008;
    const plumbH = Math.max(0.002, comY - plant);
    app.nodes
      .require("stickRig-plumb")
      .setPosition(comX, plant + plumbH / 2, 0.022)
      .setScale([1, plumbH, 1]);
    const ballX = baseX + STICK_LEN * Math.sin(angle);
    const ballY = baseY + STICK_LEN * Math.cos(angle);
    app.nodes.require("stickRig-gravity").setPosition(ballX, ballY, 0.05);

    // The support ring turns red the moment the plumb leaves the palm.
    const outside = Math.abs(comX) > 0.052;
    app.nodes
      .require("stickRig-ring")
      .setEmissive?.(outside ? COLORS.red : "#EAF6FF", outside ? 1.9 : 1.2);

    // Once the stick has left the hand, the annotations belong to the palm.
    const gone = slip > 0.6;
    app.nodes.require("stickRig-plumb").setVisible(!gone);
    app.nodes.require("stickRig-gravity").setVisible(!gone);

    const fall = smoothstep(clamp((t - 2.0) / 3.9));
    app.camera?.setPose({
      position: [1.55 - 0.12 * fall, 1.3 - 0.04 * fall, 4.05 - 0.2 * fall],
      target: [0.25 + 0.08 * fall, 0.72, 0],
      fov: 40,
    });
  }

  function overlay(t: number) {
    ov.corner("TANGAN DIAM", clamp((t - 0.3) / 0.4) * 0.8);
    ov.divider(0);
    ov.hud("left", "", 0);
    ov.hud("right", "", 0);
    ov.callout("a", "", 0, 0, 0);
    ov.callout("b", "✕  jatuh", clamp((t - 4.3) / 0.4) * clamp((7.55 - t) / 0.3), 60, 1330, COLORS.red);
    ov.callout("c", "", 0, 0, 0);

    if (t < 4.3) {
      ov.sub(
        [["Coba kamu berdirikan tongkat di "], ["telapak tangan", COLORS.yellow], [" kamu."]],
        clamp((t - 0.8) / 0.3) * clamp((4.3 - t) / 0.2),
      );
    } else {
      ov.sub(
        [["Tangan kamu diam, tongkat akan "], ["jatuh.", COLORS.red]],
        clamp((t - 4.3) / 0.3) * clamp((7.7 - t) / 0.25),
      );
    }
  }

  return { views: [{ selector: "#app", scene: sceneB, update }], overlay, duration };
}
