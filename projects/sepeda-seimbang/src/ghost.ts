import { group, material, primitives } from "@aura3d/engine";
import {
  BB,
  COLORS,
  FRONT_Z,
  HEAD_BOT,
  HEAD_TOP,
  REAR_Z,
  SEAT_TOP,
  WHEEL_R,
  torusRing,
  tube,
} from "./bike";

type V3 = [number, number, number];

export function ghostMaterial(color = COLORS.cyan, opacity = 0.18) {
  return material.pbr({
    color,
    emissive: color,
    emissiveIntensity: 0.15,
    opacity,
    roughness: 0.55,
    metallic: 0.1,
  });
}

export function makeGhostBike({
  name = "ghost",
  position = [0, 0, 0] as V3,
  color = COLORS.cyan,
  opacity = 0.18,
  front = true,
}: {
  name?: string;
  position?: V3;
  color?: string;
  opacity?: number;
  front?: boolean;
} = {}) {
  const mat = ghostMaterial(color, opacity);
  const rearHub: V3 = [0, WHEEL_R, REAR_Z];
  const frontHub: V3 = [0, WHEEL_R, FRONT_Z];

  return group(
    name,
    [
      torusRing(`${name}-rear`, WHEEL_R, 0.02, {
        position: rearHub,
        rotation: [0, Math.PI / 2, 0],
        material: mat,
        radialSegments: 64,
        tubularSegments: 6,
      }),
      torusRing(`${name}-front`, WHEEL_R, 0.02, {
        position: frontHub,
        rotation: [0, Math.PI / 2, 0],
        material: mat,
        radialSegments: 64,
        tubularSegments: 6,
      }),
      tube(`${name}-seat-tube`, BB, SEAT_TOP, 0.018, mat, false),
      tube(`${name}-down-tube`, BB, HEAD_BOT, 0.02, mat, false),
      tube(`${name}-top-tube`, SEAT_TOP, HEAD_TOP, 0.016, mat, false),
      tube(`${name}-head-tube`, HEAD_BOT, HEAD_TOP, 0.024, mat, false),
      tube(`${name}-chainstay-l`, [-0.055, WHEEL_R, REAR_Z], [-0.045, BB[1], BB[2]], 0.009, mat, false),
      tube(`${name}-chainstay-r`, [0.055, WHEEL_R, REAR_Z], [0.045, BB[1], BB[2]], 0.009, mat, false),
      tube(`${name}-seatstay-l`, [-0.055, WHEEL_R, REAR_Z], [-0.035, SEAT_TOP[1], SEAT_TOP[2]], 0.008, mat, false),
      tube(`${name}-seatstay-r`, [0.055, WHEEL_R, REAR_Z], [0.035, SEAT_TOP[1], SEAT_TOP[2]], 0.008, mat, false),
      ...(front
        ? [
            tube(`${name}-fork-l`, [-0.05, HEAD_BOT[1] - 0.02, HEAD_BOT[2]], [-0.05, WHEEL_R, FRONT_Z], 0.012, mat, false),
            tube(`${name}-fork-r`, [0.05, HEAD_BOT[1] - 0.02, HEAD_BOT[2]], [0.05, WHEEL_R, FRONT_Z], 0.012, mat, false),
            tube(`${name}-bar`, [-0.26, 1.03, -0.33], [0.26, 1.03, -0.33], 0.012, mat, false),
          ]
        : []),
      tube(`${name}-seatpost`, SEAT_TOP, [0, 1.01, 0.31], 0.012, mat, false),
      primitives.box({
        name: `${name}-saddle`,
        size: [0.11, 0.045, 0.27],
        position: [0, 1.025, 0.31],
        material: mat,
      }),
    ],
    { position },
  );
}
