import { camera, effects, group, material, scene } from "@aura3d/engine";
import { COLORS, makeBike, torusRing, WHEEL_R } from "./bike";
import { makeGripHand } from "./hand";
import {
  arrow3D,
  baseLights,
  groundGrid,
  groundPlane,
  stageEnvironment,
  stageSky,
} from "./stage";

type NodeHandle = {
  setRotation: (x: number, y: number, z: number) => NodeHandle;
  setPosition: (x: number, y: number, z: number) => NodeHandle;
  setScale: (scale: number | [number, number, number]) => NodeHandle;
  setVisible: (visible: boolean) => NodeHandle;
};
export type LeanApp = {
  nodes: { require: (id: string) => NodeHandle };
  camera?: { setPose: (p: object) => void };
};

export function makeLeanStage({ name, prefix }: { name: string; prefix: string }) {
  const bike = makeBike({ name: `${name}-bike`, prefix, rider: false });
  const hand = makeGripHand({ name: `${name}-hand`, position: [0.08, 1.02, 0.31] });
  const rig = group(name, [bike, hand]).runtime({ id: name, mutable: true });

  const rearRing = torusRing(`${name}-rearRing`, 0.085, 0.007, {
    position: [0, 0.02, 0.55],
    rotation: [Math.PI / 2, 0, 0],
    material: material.emissive({ color: COLORS.cyan, emissive: COLORS.cyan, emissiveIntensity: 2.0 }),
    radialSegments: 48,
    tubularSegments: 5,
  }).runtime({ id: `${name}-rearRing`, mutable: true });

  const frontRing = torusRing(`${name}-frontRing`, 0.085, 0.007, {
    position: [0, 0.02, -0.55],
    rotation: [Math.PI / 2, 0, 0],
    material: material.emissive({ color: COLORS.amber, emissive: COLORS.amber, emissiveIntensity: 2.0 }),
    radialSegments: 48,
    tubularSegments: 5,
  }).runtime({ id: `${name}-frontRing`, mutable: true });

  const steerArrow = group(`${name}-arrow`, [
    arrow3D(`${name}-arrowMesh`, [0, 0, 0], [0, 0, -1], 0.36, COLORS.cyan, 0.009, {
      headLength: 0.07,
      emissiveIntensity: 1.1,
    }),
  ]).runtime({ id: `${name}-arrow`, mutable: true });

  const floorMat = material.pbr({ color: "#1A2638", roughness: 0.94 });
  const gridMat = material.pbr({
    color: COLORS.grid,
    emissive: "#20364F",
    emissiveIntensity: 0.34,
    roughness: 0.8,
  });
  const turntableMat = material.pbr({
    color: "#243B56",
    emissive: "#1D3354",
    emissiveIntensity: 0.5,
    roughness: 0.8,
  });

  const grid = groundGrid(`${name}-grid`, { x0: -7, x1: 7, z0: -7, z1: 7, material: gridMat });

  const turntable = torusRing(`${name}-turntable`, 1.05, 0.012, {
    position: [0, 0.012, 0],
    rotation: [Math.PI / 2, 0, 0],
    material: turntableMat,
    radialSegments: 96,
    tubularSegments: 6,
  });

  const sceneB = scene({ background: "#070B12" })
    .add(stageSky({ zenith: "#060B14", horizon: "#0B1626", ground: "#05080E" }))
    .add(stageEnvironment(0.55))
    .addMany(baseLights({ key: 2.2, fill: 0.55, rim: 1.35, rimColor: COLORS.cyan }))
    .add(groundPlane(`${name}-floor`, 34, floorMat))
    .add(grid)
    .add(turntable)
    .add(rig)
    .add(rearRing)
    .add(frontRing)
    .add(steerArrow)
    .add(effects.bloom({ intensity: 0.44, threshold: 0.84, scatter: 0.5 }))
    .add(effects.vignette({ intensity: 0.28, smoothness: 0.46 }))
    .camera(camera.perspective({ position: [2.4, 1.95, 2.9], target: [0.06, 0.7, -0.15], fov: 40 }));

  function pose(app: LeanApp, lean: number, steer: number, travel: number) {
    // Rotate about the tyre contact line instead of the ground origin so the
    // wheels stay planted while the frame leans.
    const shift = WHEEL_R * Math.sin(lean);
    const lift = WHEEL_R * (1 - Math.cos(lean));
    app.nodes.require(name).setPosition(shift, lift, 0).setRotation(0, 0, lean);
    app.nodes.require(`${prefix}-steer`).setRotation(0, steer, 0);

    const spin = -travel / WHEEL_R;
    app.nodes.require(`${prefix}-rear-wheel`).setRotation(spin, 0, 0);
    app.nodes.require(`${prefix}-front-wheel`).setRotation(spin, 0, 0);

    const frontX = shift + 0.09 * Math.sin(steer);
    app.nodes.require(`${name}-rearRing`).setPosition(shift, 0.02, 0.55);
    app.nodes.require(`${name}-frontRing`).setPosition(frontX, 0.02, -0.55);
    app.nodes.require(`${name}-arrow`).setPosition(frontX, 0.03, -0.55).setRotation(0, steer, 0);
    app.nodes.require(`${name}-grid`).setPosition(0, 0, travel % 2);
  }

  return { sceneB, pose };
}

export const LEAN_DEG = 14;
export const STEER_DEG = 26;
export const LEAN = (LEAN_DEG * Math.PI) / 180;
export const STEER = (STEER_DEG * Math.PI) / 180;

export function leanHud(leanDeg: number, steerDeg: number, dir: string, moving = false) {
  const status = moving
    ? `<div style="margin-top:7px;font-size:14px;letter-spacing:.2em;color:#7FE7B0">▶  GERAK MAJU</div>`
    : `<div style="margin-top:7px;font-size:14px;letter-spacing:.2em;color:#9DB6CF">${dir}</div>`;
  return (
    `<div style="min-width:250px;padding:14px 18px;border:1px solid rgba(120,160,200,.35);border-radius:10px;background:rgba(5,12,22,.72);box-shadow:0 0 24px rgba(0,0,0,.45)">` +
    `<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:16px;letter-spacing:.14em;color:#9DB6CF">MIRING <b style="font-size:30px;color:#FFD166">${Math.round(Math.abs(leanDeg))}°</b></div>` +
    `<div style="height:5px"></div>` +
    `<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:16px;letter-spacing:.14em;color:#9DB6CF">SETIR <b style="font-size:30px;color:#35D0E8">${Math.round(Math.abs(steerDeg))}°</b></div>` +
    status +
    `</div>`
  );
}
