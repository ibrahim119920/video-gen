import {
  environments,
  group,
  instances,
  lights,
  lines,
  material,
  primitives,
  sky,
} from "@aura3d/engine";
import { COLORS, torusRing } from "./bike";

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const easeInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t));
export const easeIn = (t: number) => clamp(t) * clamp(t);
export const easeOut = (t: number) => 1 - (1 - clamp(t)) ** 2;
export const rad = (d: number) => (d * Math.PI) / 180;

const groundMat = material.pbr({ color: COLORS.ground, roughness: 0.92 });
const gridMat = material.pbr({
  color: COLORS.grid,
  roughness: 0.78,
  emissive: "#1D3354",
  emissiveIntensity: 0.35,
});

export function stageSky({
  zenith = COLORS.bgTop,
  horizon = COLORS.bgBottom,
  ground = COLORS.bgTop,
}: { zenith?: string; horizon?: string; ground?: string } = {}) {
  return sky.gradient({
    zenith,
    horizon,
    ground,
    exponent: 0.9,
    horizonGlow: 0.35,
    intensity: 1,
  });
}

export function stageEnvironment(intensity = 0.6) {
  // Neutral IBL keeps the metals readable; the sky is the visible backdrop.
  return environments.neutral({ intensity, background: false });
}

export function baseLights({
  key = 2.2,
  fill = 0.6,
  rim = 1.2,
  hemi = 0.5,
  keyColor = "#FFE2B8",
  fillColor = "#6EA8FF",
  rimColor = "#8FD3FF",
}: {
  key?: number;
  fill?: number;
  rim?: number;
  hemi?: number;
  keyColor?: string;
  fillColor?: string;
  rimColor?: string;
} = {}) {
  return [
    lights.hemisphere({
      skyColor: "#2B4A7A",
      groundColor: "#0F1B2D",
      intensity: hemi,
    }),
    lights.directional({
      name: "key",
      position: [4.5, 6.5, 4.5],
      target: [0, 0.7, 0],
      intensity: key,
      color: keyColor,
      shadow: { softness: 2 },
    }),
    lights.directional({
      name: "fill",
      position: [-5, 3, 2.5],
      target: [0, 0.7, 0],
      intensity: fill,
      color: fillColor,
    }),
    lights.directional({
      name: "rim",
      position: [0, 4.5, -6.5],
      target: [0, 0.8, 0],
      intensity: rim,
      color: rimColor,
    }),
  ];
}

export function groundPlane(
  name = "ground",
  size = 40,
  mat: ReturnType<typeof material.pbr> = groundMat,
) {
  return primitives.plane({
    name,
    size: [size, 1, size],
    material: mat,
    receiveShadow: true,
  });
}

function gridInstances(
  name: string,
  along: "x" | "z",
  a0: number,
  a1: number,
  b0: number,
  b1: number,
  mat: ReturnType<typeof material.pbr> = gridMat,
) {
  const transforms = [];
  const step = 1;
  if (along === "x") {
    // long lines parallel to X, distributed along Z
    for (let z = b0; z <= b1 + 1e-6; z += step) {
      transforms.push({
        position: [(a0 + a1) / 2, 0.006, z] as [number, number, number],
        scale: [a1 - a0, 1, 1] as [number, number, number],
      });
    }
    return instances.box({
      name,
      size: [1, 0.008, 0.014],
      transforms,
      material: mat,
      castShadow: false,
      receiveShadow: false,
    });
  }
  // long lines parallel to Z, distributed along X
  for (let x = b0; x <= b1 + 1e-6; x += step) {
    transforms.push({
      position: [x, 0.006, (a0 + a1) / 2] as [number, number, number],
      scale: [1, 1, a1 - a0] as [number, number, number],
    });
  }
  return instances.box({
    name,
    size: [0.014, 0.008, 1],
    transforms,
    material: mat,
    castShadow: false,
    receiveShadow: false,
  });
}

export function groundGrid(
  name: string,
  {
    x0 = -12,
    x1 = 12,
    z0 = -10,
    z1 = 10,
    material: mat,
  }: {
    x0?: number;
    x1?: number;
    z0?: number;
    z1?: number;
    material?: ReturnType<typeof material.pbr>;
  } = {},
) {
  const gx = gridInstances(`${name}-x`, "x", x0, x1, z0, z1, mat);
  const gz = gridInstances(`${name}-z`, "z", z0, z1, x0, x1, mat);
  return group(name, [gx, gz]).runtime({ id: name, mutable: true });
}

export function divider() {
  // A thin vertical bar behind the subjects: a slab along Z would reach the
  // camera and its bloom would flood the frame.
  return primitives.box({
    name: "divider",
    size: [0.05, 5.0, 0.05],
    position: [0, 1.9, -2.0],
    material: material.emissive({
      color: "#B9F7FF",
      emissive: COLORS.cyan,
      emissiveIntensity: 1.6,
    }),
  });
}

type V3 = [number, number, number];

function quatFromY(dir: V3): [number, number, number, number] {
  const len = Math.hypot(dir[0], dir[1], dir[2]);
  if (len < 1e-6) return [0, 0, 0, 1];
  const x = dir[0] / len;
  const y = dir[1] / len;
  const z = dir[2] / len;
  const w = 1 + y;
  if (w < 1e-6) return [1, 0, 0, 0];
  const q: [number, number, number, number] = [z, 0, -x, w];
  const n = Math.hypot(q[0], q[1], q[2], q[3]);
  return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
}

export function arrow3D(
  name: string,
  origin: V3,
  dir: V3,
  length: number,
  color: string,
  radius = 0.018,
  options: { headLength?: number; emissiveIntensity?: number } = {},
) {
  const len = Math.hypot(dir[0], dir[1], dir[2]);
  const d: V3 = [dir[0] / len, dir[1] / len, dir[2] / len];
  const headLen = options.headLength ?? Math.min(0.22, length * 0.32);
  const shaftLen = Math.max(0.001, length - headLen);
  const mid: V3 = [origin[0] + d[0] * shaftLen * 0.5, origin[1] + d[1] * shaftLen * 0.5, origin[2] + d[2] * shaftLen * 0.5];
  const headCenter: V3 = [
    origin[0] + d[0] * (length - headLen * 0.5),
    origin[1] + d[1] * (length - headLen * 0.5),
    origin[2] + d[2] * (length - headLen * 0.5),
  ];
  const mat = material.emissive({
    color,
    emissive: color,
    emissiveIntensity: options.emissiveIntensity ?? 2.2,
  });
  return group(name, [
    primitives.cylinder({
      name: `${name}-shaft`,
      size: [radius * 2, shaftLen, radius * 2],
      position: mid,
      quaternion: quatFromY(d),
      material: mat,
      params: { radialSegments: 8 },
    }),
    primitives.cone({
      name: `${name}-head`,
      size: [radius * 6, headLen, radius * 6],
      position: headCenter,
      quaternion: quatFromY(d),
      material: mat,
      params: { radialSegments: 12 },
    }),
  ]);
}

export function floorRing(
  name: string,
  p: V3,
  radius: number,
  color: string,
  thickness = 0.012,
) {
  return torusRing(name, radius, thickness, {
    position: [p[0], 0.012, p[2]],
    rotation: [Math.PI / 2, 0, 0],
    material: material.emissive({ color, emissive: color, emissiveIntensity: 2.0 }),
    radialSegments: 48,
    tubularSegments: 5,
  });
}

export function plumbLine(name: string, top: V3, bottom: V3, color: string) {
  return lines.line({
    name,
    points: [top, bottom],
    colors: [color, color],
    dashed: true,
    dashSize: 0.07,
    gapSize: 0.055,
    material: material.emissive({ color, emissive: color, emissiveIntensity: 1.8 }),
  });
}

export function dustRing(name: string, p: V3, color = "#A7B3C6") {
  return torusRing(name, 0.24, 0.018, {
    position: [p[0], 0.02, p[2]],
    rotation: [Math.PI / 2, 0, 0],
    material: material.pbr({
      color,
      roughness: 1,
      opacity: 0.55,
    }),
    radialSegments: 36,
    tubularSegments: 5,
  });
}
