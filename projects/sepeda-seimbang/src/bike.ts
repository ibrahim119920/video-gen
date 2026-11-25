import { group, material, primitives } from "@aura3d/engine";

export const COLORS = {
  bgTop: "#0F1B2D",
  bgBottom: "#1B2A41",
  ground: "#22324A",
  grid: "#3A4F6D",
  frame: "#FF8A3D",
  tire: "#1A1F27",
  metal: "#C9D3E0",
  rider: "#CBD5E1",
  riderDark: "#2A3446",
  cyan: "#35D0E8",
  yellow: "#FFD166",
  red: "#FF4D5E",
  green: "#4ADE80",
  amber: "#FFC857",
};

const frameMat = material.pbr({ color: COLORS.frame, metallic: 0.3, roughness: 0.45 });
const tireMat = material.pbr({ color: COLORS.tire, roughness: 0.85 });
const rimMat = material.pbr({ color: COLORS.metal, metallic: 0.9, roughness: 0.3 });
const riderMat = material.pbr({ color: COLORS.rider, roughness: 0.7 });
const darkMat = material.pbr({ color: COLORS.riderDark, roughness: 0.6 });
const saddleMat = material.pbr({ color: "#121722", roughness: 0.75 });

type V3 = [number, number, number];
type Quat = [number, number, number, number];

export const WHEEL_R = 0.34;
export const REAR_Z = 0.55;
export const FRONT_Z = -0.55;
export const BB: V3 = [0, 0.30, 0.12];
export const SEAT_TOP: V3 = [0, 0.86, 0.30];
export const HEAD_BOT: V3 = [0, 0.64, -0.42];
export const HEAD_TOP: V3 = [0, 0.90, -0.35];
export const HEAD_CENTER: V3 = [0, 0.78, -0.385];
export const HEAD_TILT = 0.30;

export function qFromY(dir: V3): Quat {
  const len = Math.hypot(dir[0], dir[1], dir[2]);
  if (len < 1e-6) return [0, 0, 0, 1];
  const x = dir[0] / len;
  const y = dir[1] / len;
  const z = dir[2] / len;
  const w = 1 + y;
  if (w < 1e-6) return [1, 0, 0, 0];
  const q: Quat = [z, 0, -x, w];
  const n = Math.hypot(q[0], q[1], q[2], q[3]);
  return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
}

export function tube(name: string, a: V3, b: V3, r: number, mat: ReturnType<typeof material.pbr>, cast = true) {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]);
  return primitives.cylinder({
    name,
    size: [r * 2, len, r * 2],
    position: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
    quaternion: qFromY(d),
    material: mat,
    castShadow: cast,
    receiveShadow: true,
    params: { radialSegments: 10 },
  });
}

function ball(name: string, p: V3, r: number, mat: ReturnType<typeof material.pbr>) {
  return primitives.sphere({
    name,
    size: r * 2,
    position: p,
    material: mat,
    castShadow: true,
    params: { widthSegments: 16, heightSegments: 12 },
  });
}

// Aura3D torus base radius is 0.43 and `size` is an overall scale, so solve
// for an exact outer radius while keeping the tube radius in metres.
export function torusRing(
  name: string,
  outerRadius: number,
  tubeRadius: number,
  options: {
    position?: V3;
    rotation?: V3;
    material: ReturnType<typeof material.pbr>;
    castShadow?: boolean;
    radialSegments?: number;
    tubularSegments?: number;
  },
) {
  const scale = (outerRadius - tubeRadius) / 0.43;
  return primitives.torus({
    name,
    size: scale,
    params: {
      tube: tubeRadius / scale,
      radialSegments: options.radialSegments ?? 48,
      tubularSegments: options.tubularSegments ?? 8,
    },
    position: options.position,
    rotation: options.rotation,
    material: options.material,
    castShadow: options.castShadow ?? false,
  });
}

export function wheel(prefix: string, x: number, z: number) {
  const spokes = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const rr = WHEEL_R - 0.045;
    return tube(
      `${prefix}-spoke-${i}`,
      [0, 0, 0],
      [0, Math.cos(a) * rr, Math.sin(a) * rr],
      0.0045,
      rimMat,
      false,
    );
  });
  return group(
    `${prefix}-wheel`,
    [
      torusRing(`${prefix}-tire`, WHEEL_R, 0.035, {
        rotation: [0, Math.PI / 2, 0],
        material: tireMat,
        castShadow: true,
        radialSegments: 96,
        tubularSegments: 12,
      }),
      torusRing(`${prefix}-rim`, 0.285, 0.008, {
        rotation: [0, Math.PI / 2, 0],
        material: rimMat,
        radialSegments: 96,
        tubularSegments: 6,
      }),
      primitives.cylinder({
        name: `${prefix}-hub`,
        size: [0.07, 0.13, 0.07],
        rotation: [0, 0, Math.PI / 2],
        material: rimMat,
        params: { radialSegments: 12 },
      }),
      ...spokes,
    ],
    { position: [x, WHEEL_R, z] },
  ).runtime({ id: `${prefix}-wheel`, mutable: true });
}

function rider(prefix: string) {
  const hipL: V3 = [-0.10, 0.96, 0.28];
  const hipR: V3 = [0.10, 0.96, 0.28];
  const kneeL: V3 = [-0.13, 0.69, -0.02];
  const kneeR: V3 = [0.13, 0.69, -0.02];
  const footL: V3 = [-0.11, 0.33, 0.12];
  const footR: V3 = [0.11, 0.33, 0.12];
  const shL: V3 = [-0.16, 1.27, 0.04];
  const shR: V3 = [0.16, 1.27, 0.04];
  const elL: V3 = [-0.20, 1.12, -0.16];
  const elR: V3 = [0.20, 1.12, -0.16];
  const handL: V3 = [-0.21, 1.00, -0.32];
  const handR: V3 = [0.21, 1.00, -0.32];

  return group(
    `${prefix}-rider`,
    [
      tube(`${prefix}-torso`, [0, 1.00, 0.28], [0, 1.29, 0.03], 0.135, riderMat),
      ball(`${prefix}-hips`, [0, 0.97, 0.28], 0.115, riderMat),
      ball(`${prefix}-head`, [0, 1.40, -0.01], 0.105, riderMat),
      primitives.sphere({
        name: `${prefix}-helmet`,
        size: 0.245,
        position: [0, 1.43, -0.015],
        scale: [1, 0.82, 1.02],
        material: darkMat,
        castShadow: true,
      }),
      primitives.box({
        name: `${prefix}-visor`,
        size: [0.14, 0.035, 0.035],
        position: [0, 1.415, 0.085],
        material: material.emissive({
          color: "#8FD3FF",
          emissive: "#35D0E8",
          emissiveIntensity: 1.6,
        }),
      }),
      // arms
      tube(`${prefix}-upperarm-l`, shL, elL, 0.045, riderMat),
      tube(`${prefix}-upperarm-r`, shR, elR, 0.045, riderMat),
      tube(`${prefix}-forearm-l`, elL, handL, 0.038, riderMat),
      tube(`${prefix}-forearm-r`, elR, handR, 0.038, riderMat),
      ball(`${prefix}-elbow-l`, elL, 0.052, riderMat),
      ball(`${prefix}-elbow-r`, elR, 0.052, riderMat),
      // legs
      tube(`${prefix}-thigh-l`, hipL, kneeL, 0.062, riderMat),
      tube(`${prefix}-thigh-r`, hipR, kneeR, 0.062, riderMat),
      tube(`${prefix}-shin-l`, kneeL, footL, 0.05, riderMat),
      tube(`${prefix}-shin-r`, kneeR, footR, 0.05, riderMat),
      ball(`${prefix}-knee-l`, kneeL, 0.065, riderMat),
      ball(`${prefix}-knee-r`, kneeR, 0.065, riderMat),
      primitives.box({
        name: `${prefix}-shoe-l`,
        size: [0.10, 0.06, 0.21],
        position: [footL[0], footL[1] - 0.02, footL[2] + 0.03],
        material: darkMat,
        castShadow: true,
      }),
      primitives.box({
        name: `${prefix}-shoe-r`,
        size: [0.10, 0.06, 0.21],
        position: [footR[0], footR[1] - 0.02, footR[2] + 0.03],
        material: darkMat,
        castShadow: true,
      }),
    ],
  ).runtime({ id: `${prefix}-rider`, mutable: true });
}

export function steerAssembly(prefix: string) {
  // Front wheel sits at the fork dropouts, inside the steering assembly.
  const frontWheel = wheel(`${prefix}-front`, 0, 0).position(0, -0.465, -0.02);
  return group(
    `${prefix}-steer`,
    [
      tube(`${prefix}-fork-l`, [-0.05, -0.10, 0], [-0.05, -0.46, -0.02], 0.018, frameMat),
      tube(`${prefix}-fork-r`, [0.05, -0.10, 0], [0.05, -0.46, -0.02], 0.018, frameMat),
      tube(`${prefix}-fork-crown`, [-0.07, -0.10, 0], [0.07, -0.10, 0], 0.026, frameMat),
      frontWheel,
      tube(`${prefix}-stem`, [0, 0.00, 0], [0, 0.11, 0.015], 0.024, darkMat),
      tube(`${prefix}-bar`, [-0.23, 0.13, 0.015], [0.23, 0.13, 0.015], 0.018, darkMat),
      tube(`${prefix}-grip-l`, [-0.28, 0.13, 0.015], [-0.22, 0.13, 0.015], 0.028, saddleMat),
      tube(`${prefix}-grip-r`, [0.22, 0.13, 0.015], [0.28, 0.13, 0.015], 0.028, saddleMat),
    ],
  ).runtime({ id: `${prefix}-steer`, mutable: true });
}

export function makeBike({
  name,
  prefix,
  position = [0, 0, 0],
  rider: withRider = false,
}: {
  name: string;
  prefix: string;
  position?: V3;
  rider?: boolean;
}) {
  const steer = steerAssembly(prefix);

  const bike = group(
    name,
    [
      tube(`${prefix}-seat-tube`, BB, SEAT_TOP, 0.026, frameMat),
      tube(`${prefix}-down-tube`, BB, HEAD_BOT, 0.028, frameMat),
      tube(`${prefix}-top-tube`, SEAT_TOP, HEAD_TOP, 0.024, frameMat),
      tube(`${prefix}-head-tube`, HEAD_BOT, HEAD_TOP, 0.032, frameMat),
      tube(`${prefix}-chainstay-l`, [-0.055, WHEEL_R, REAR_Z], [-0.045, BB[1], BB[2]], 0.015, frameMat),
      tube(`${prefix}-chainstay-r`, [0.055, WHEEL_R, REAR_Z], [0.045, BB[1], BB[2]], 0.015, frameMat),
      tube(`${prefix}-seatstay-l`, [-0.055, WHEEL_R, REAR_Z], [-0.035, SEAT_TOP[1], SEAT_TOP[2]], 0.013, frameMat),
      tube(`${prefix}-seatstay-r`, [0.055, WHEEL_R, REAR_Z], [0.035, SEAT_TOP[1], SEAT_TOP[2]], 0.013, frameMat),
      tube(`${prefix}-seatpost`, SEAT_TOP, [0, 1.00, 0.31], 0.018, rimMat),
      primitives.roundedBox({
        name: `${prefix}-saddle`,
        size: [0.115, 0.052, 0.28],
        position: [0, 1.02, 0.31],
        material: saddleMat,
        castShadow: true,
      }),
      wheel(`${prefix}-rear`, 0, REAR_Z),
      // steering assembly: the steer axis is tilted, steering happens around its local Y
      group(
        `${prefix}-steer-axis`,
        [steer],
        { position: HEAD_CENTER, rotation: [HEAD_TILT, 0, 0] },
      ),
      // crank + chainring
      primitives.cylinder({
        name: `${prefix}-bb`,
        size: [0.115, 0.13, 0.115],
        position: BB,
        rotation: [0, 0, Math.PI / 2],
        material: rimMat,
        params: { radialSegments: 16 },
      }),
      torusRing(`${prefix}-chainring`, 0.115, 0.009, {
        position: [0.055, BB[1], BB[2]],
        rotation: [0, Math.PI / 2, 0],
        material: rimMat,
        radialSegments: 32,
        tubularSegments: 6,
      }),
      primitives.box({
        name: `${prefix}-pedal-l`,
        size: [0.11, 0.025, 0.055],
        position: [-0.10, BB[1] + 0.06, BB[2] + 0.14],
        material: darkMat,
      }),
      primitives.box({
        name: `${prefix}-pedal-r`,
        size: [0.11, 0.025, 0.055],
        position: [0.10, BB[1] - 0.06, BB[2] - 0.14],
        material: darkMat,
      }),
      ...(withRider ? [rider(prefix)] : []),
    ],
    { position },
  ).runtime({ id: name, mutable: true });

  return bike;
}
