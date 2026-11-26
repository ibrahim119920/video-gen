import { camera, effects, group, lights, material, primitives, scene } from "@aura3d/engine";
import { COLORS, makeBike, torusRing } from "../bike";
import {
  arrow3D,
  baseLights,
  clamp,
  lerp,
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

const SPEED = 2.4;
const U_MAX = SPEED * duration;
const AMP = 1.6;
const LAMBDA = 10.5;
const K = (2 * Math.PI) / LAMBDA;
const WEAVE_START = 1.0;
const WHEELBASE = 1.1;

type Pose = { x: number; z: number; yaw: number; lean: number; steer: number };

function poseAt(u: number): Pose {
  const env = smoothstep(clamp((u - WEAVE_START) / 2.4));
  const phase = K * (u - WEAVE_START);
  const x = AMP * Math.sin(phase) * env;
  const x1 = AMP * Math.sin(K * (u + 0.02 - WEAVE_START)) * smoothstep(clamp((u + 0.02 - WEAVE_START) / 2.4));
  const x0 = AMP * Math.sin(K * (u - 0.02 - WEAVE_START)) * smoothstep(clamp((u - 0.02 - WEAVE_START) / 2.4));
  const dx = (x1 - x0) / 0.04;
  const yaw = -Math.atan(dx);
  const lean = 0.34 * K * K * AMP * Math.sin(phase) * env;
  return { x, z: -u, yaw, lean, steer: lean * 1.9 };
}

function rearContact(p: Pose) {
  const c = 0.55;
  return [p.x + c * Math.sin(p.yaw), p.z + c * Math.cos(p.yaw)] as const;
}

function frontContact(p: Pose) {
  const c = 0.55;
  const fx = p.x - c * Math.sin(p.yaw) + 0.09 * Math.sin(p.steer) * Math.cos(p.yaw);
  const fz = p.z - c * Math.cos(p.yaw);
  return [fx, fz] as const;
}

function trailChunk(name: string, u0: number, u1: number, color: string, width: number, front: boolean) {
  const mat = material.emissive({ color, emissive: color, emissiveIntensity: 2.0 });
  const subs = 3;
  const boxes = [];
  for (let i = 0; i < subs; i += 1) {
    const a = u0 + ((u1 - u0) * i) / subs;
    const b = u0 + ((u1 - u0) * (i + 1)) / subs;
    const pa = poseAt(a);
    const pb = poseAt(b);
    let xa = pa.x;
    let za = pa.z;
    let xb = pb.x;
    let zb = pb.z;
    if (front) {
      [xa, za] = frontContact(pa);
      [xb, zb] = frontContact(pb);
    } else {
      [xa, za] = rearContact(pa);
      [xb, zb] = rearContact(pb);
    }
    const dx = xb - xa;
    const dz = zb - za;
    const len = Math.hypot(dx, dz) + 0.012;
    boxes.push(
      primitives.box({
        name: `${name}-${i}`,
        size: [width, 0.005, len],
        position: [(xa + xb) / 2, 0.018, (za + zb) / 2],
        rotation: [0, Math.atan2(dx, dz), 0],
        material: mat,
        castShadow: false,
        receiveShadow: false,
      }),
    );
  }
  return group(name, boxes).runtime({ id: name, mutable: true });
}

function hudHtml(leanDeg: number, steerDeg: number) {
  const dir = Math.abs(steerDeg) < 1 ? "LURUS" : steerDeg > 0 ? "KIRI" : "KANAN";
  return (
    `<div style="min-width:250px;padding:14px 18px;border:1px solid rgba(120,160,200,.35);border-radius:10px;background:rgba(5,12,22,.72);box-shadow:0 0 24px rgba(0,0,0,.45)">` +
    `<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:16px;letter-spacing:.14em;color:#9DB6CF">MIRING <b style="font-size:30px;color:#FFD166">${Math.round(Math.abs(leanDeg))}°</b></div>` +
    `<div style="height:5px"></div>` +
    `<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:16px;letter-spacing:.14em;color:#9DB6CF">SETIR <b style="font-size:30px;color:#35D0E8">${Math.round(Math.abs(steerDeg))}°</b></div>` +
    `<div style="margin-top:7px;font-size:14px;letter-spacing:.2em;color:#7FE7B0">${dir}</div>` +
    `</div>`
  );
}

export function build() {
  const bike = makeBike({ name: "bikeS6", prefix: "S6", rider: true });

  const rearRing = torusRing("contact-rear", 0.085, 0.007, {
    position: [0, 0.02, 0],
    rotation: [Math.PI / 2, 0, 0],
    material: material.emissive({ color: COLORS.cyan, emissive: COLORS.cyan, emissiveIntensity: 2.0 }),
    radialSegments: 48,
    tubularSegments: 5,
  }).runtime({ id: "contactR", mutable: true });

  const frontRing = torusRing("contact-front", 0.085, 0.007, {
    position: [0, 0.02, -WHEELBASE],
    rotation: [Math.PI / 2, 0, 0],
    material: material.emissive({ color: COLORS.amber, emissive: COLORS.amber, emissiveIntensity: 2.0 }),
    radialSegments: 48,
    tubularSegments: 5,
  }).runtime({ id: "contactF", mutable: true });

  const steerArrow = group("steerArrow", [
    arrow3D("steerArrowMesh", [0, 0, 0], [0, 0, -1], 0.3, COLORS.cyan, 0.008, {
      headLength: 0.065,
      emissiveIntensity: 1.0,
    }),
  ]).runtime({ id: "steerArrow", mutable: true });

  const CHUNK = 0.4;
  const CHUNKS = Math.ceil(U_MAX / CHUNK);
  const trailRear: { id: string; u: number }[] = [];
  const trailFront: { id: string; u: number }[] = [];
  const trailParts = [];
  for (let i = 0; i < CHUNKS; i += 1) {
    const u0 = i * CHUNK;
    const u1 = Math.min(U_MAX, (i + 1) * CHUNK);
    const r = trailChunk(`trail-r-${i}`, u0, u1, COLORS.cyan, 0.06, false);
    const f = trailChunk(`trail-f-${i}`, u0, u1, COLORS.amber, 0.028, true);
    trailRear.push({ id: `trail-r-${i}`, u: u1 });
    trailFront.push({ id: `trail-f-${i}`, u: u1 });
    trailParts.push(r, f);
  }

  const stage = scene({ background: COLORS.bgTop })
    .add(stageSky())
    .add(stageEnvironment(0.62))
    .addMany(baseLights({ key: 2.3, fill: 0.6, rim: 1.35 }))
    .add(
      lights.directional({
        name: "under",
        position: [0, -3, 2],
        target: [0, 0.4, 0],
        intensity: 0.35,
        color: "#4A7DBF",
      }),
    )
    .add(
      primitives.plane({
        name: "groundS6",
        size: [90, 1, 90],
        position: [0, 0, -22],
        material: material.pbr({ color: COLORS.ground, roughness: 0.92 }),
        receiveShadow: true,
      }),
    )
    .addMany(trailParts)
    .add(bike)
    .add(rearRing)
    .add(frontRing)
    .add(steerArrow)
    .add(effects.bloom({ intensity: 0.42, threshold: 0.85, scatter: 0.5 }))
    .add(effects.vignette({ intensity: 0.24, smoothness: 0.46 }))
    .camera(camera.perspective({ position: [1.7, 1.15, 3.6], target: [0, 0.78, -0.8], fov: 42 }));

  // A sparse grid that covers the whole path.
  const gridLines = [];
  const gridMat = material.pbr({
    color: COLORS.grid,
    emissive: "#1D3354",
    emissiveIntensity: 0.32,
    roughness: 0.8,
  });
  for (let z = 8; z >= -30; z -= 2) {
    gridLines.push(
      primitives.box({
        name: `gx-${z}`,
        size: [80, 0.008, 0.014],
        position: [0, 0.006, z],
        material: gridMat,
        castShadow: false,
        receiveShadow: false,
      }),
    );
  }
  for (let x = -24; x <= 24; x += 2) {
    gridLines.push(
      primitives.box({
        name: `gz-${x}`,
        size: [0.014, 0.008, 64],
        position: [x, 0.006, -22],
        material: gridMat,
        castShadow: false,
        receiveShadow: false,
      }),
    );
  }
  stage.add(group("gridS6", gridLines));

  function update(t: number, app: AppLike) {
    const u = Math.min(U_MAX, SPEED * t);
    const p = poseAt(u);
    app.nodes.require("bikeS6").setPosition(p.x, 0, p.z);
    app.nodes.require("bikeS6").setRotation(0, p.yaw, p.lean);
    app.nodes.require("S6-steer").setRotation(0, p.steer, 0);

    const spin = -u / 0.34;
    app.nodes.require("S6-rear-wheel").setRotation(spin, 0, 0);
    app.nodes.require("S6-front-wheel").setRotation(spin, 0, 0);

    app.nodes.require("contactR").setPosition(...rearContact(p), 0.02);
    const [fx, fz] = frontContact(p);
    app.nodes.require("contactF").setPosition(fx, 0.02, fz);
    app.nodes.require("steerArrow").setPosition(fx, 0.03, fz).setRotation(0, p.yaw + p.steer, 0);

    for (let i = 0; i < CHUNKS; i += 1) {
      const rr = trailRear[i]!;
      const ff = trailFront[i]!;
      app.nodes.require(rr.id).setVisible(rr.u <= u + 0.05);
      app.nodes.require(ff.id).setVisible(ff.u <= u + 0.55);
    }

    // Rear 3/4 -> side tracking -> high behind to reveal the S.
    const side = smoothstep(clamp((t - 1.8) / 1.6));
    const high = smoothstep(clamp((t - 5.0) / 2.4));
    const baseX = p.x + lerp(2.7, 4.4, side);
    const baseY = lerp(1.25, 1.35, side);
    const baseZ = p.z + lerp(4.3, 0.9, side);
    const pos: [number, number, number] = [
      lerp(baseX, p.x * 0.7 + 2.0, high),
      lerp(baseY, 3.9, high),
      lerp(baseZ, p.z + 4.8, high),
    ];
    const target: [number, number, number] = [
      lerp(p.x * 0.7, p.x * 0.25, high),
      lerp(lerp(0.78, 0.7, side), 0.25, high),
      lerp(p.z - lerp(0.8, 0.1, side), p.z + 0.8, high),
    ];
    app.camera?.setPose({
      position: pos,
      target,
      fov: lerp(42, 48, high),
      roll: -p.lean * 0.35 * (1 - high),
    });

    const leanDeg = (p.lean * 180) / Math.PI;
    const steerDeg = (p.steer * 180) / Math.PI;
    ov.hud("left", hudHtml(leanDeg, steerDeg), clamp((t - 0.4) / 0.5) * clamp((7.6 - t) / 0.3));
  }

  function overlay(t: number) {
    ov.corner("SETIR MENGEJAR MIRING", clamp((t - 0.3) / 0.4) * 0.8);
    ov.divider(0);
    ov.hud("right", "", 0);
    ov.scope([], 0);
    ov.callout("a", "", 0, 0, 0);
    ov.callout("b", "", 0, 0, 0);
    ov.callout("c", "", 0, 0, 0);

    if (t < 2.5) {
      ov.sub(
        [["Bagaimana dengan "], ["sepeda?", COLORS.cyan]],
        clamp((t - 0.5) / 0.3) * clamp((2.5 - t) / 0.2),
      );
    } else if (t < 5.0) {
      ov.sub(
        [["Secara alami, setang dan "], ["ban depannya", COLORS.cyan]],
        clamp((t - 2.5) / 0.3) * clamp((5.0 - t) / 0.2),
      );
    } else {
      ov.sub(
        [["akan selalu belok mengikuti "], ["miringnya sepeda.", COLORS.amber]],
        clamp((t - 5.0) / 0.3) * clamp((7.7 - t) / 0.25),
      );
    }
  }

  return { views: [{ selector: "#app", scene: stage, update }], overlay, duration };
}
