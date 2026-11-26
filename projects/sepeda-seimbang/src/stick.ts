import { group, material, primitives } from "@aura3d/engine";
import { COLORS, torusRing, tube } from "./bike";
import { makeOpenHand } from "./hand";
import { arrow3D } from "./stage";

type V3 = [number, number, number];

export const STICK_LEN = 0.78;

export function makeStickRig({ name = "stick", length = STICK_LEN } = {}) {
  const wood = material.pbr({ color: "#D8B27A", roughness: 0.58, metallic: 0.05 });
  const metal = material.pbr({ color: COLORS.metal, metallic: 0.9, roughness: 0.3 });
  const mass = material.emissive({ color: COLORS.yellow, emissive: COLORS.yellow, emissiveIntensity: 1.8 });

  return group(name, [
    tube(`${name}-rod`, [0, 0, 0], [0, length, 0], 0.012, wood, true),
    primitives.sphere({
      name: `${name}-ball`,
      size: 0.09,
      position: [0, length, 0],
      material: mass,
      castShadow: false,
    }),
    primitives.sphere({
      name: `${name}-cap`,
      size: 0.034,
      position: [0, 0.006, 0],
      material: metal,
      castShadow: false,
    }),
  ]).runtime({ id: name, mutable: true });
}

export function makeHandRig({
  name = "handRig",
  position = [0, 0.62, 0] as V3,
  ringColor = "#EAF6FF",
}: { name?: string; position?: V3; ringColor?: string } = {}) {
  const hand = makeOpenHand({ name: `${name}-hand` });
  const stick = makeStickRig({ name: `${name}-stick` }).position(0, 0.006, 0);

  const ring = torusRing(`${name}-ring`, 0.06, 0.004, {
    position: [0, 0.008, 0],
    rotation: [Math.PI / 2, 0, 0],
    material: material.emissive({ color: ringColor, emissive: ringColor, emissiveIntensity: 1.6 }),
    radialSegments: 48,
    tubularSegments: 5,
  }).runtime({ id: `${name}-ring`, mutable: true });

  const plumb = primitives.cylinder({
    name: `${name}-plumb`,
    size: [0.009, 1, 0.009],
    position: [0, 0.5, 0],
    material: material.emissive({ color: COLORS.yellow, emissive: COLORS.yellow, emissiveIntensity: 1.8 }),
  }).runtime({ id: `${name}-plumb`, mutable: true });

  const gravity = arrow3D(`${name}-gravity`, [0, 0, 0], [0, -1, 0], 0.32, COLORS.red, 0.012, {
    headLength: 0.075,
    emissiveIntensity: 1.2,
  }).runtime({ id: `${name}-gravity`, mutable: true });

  return group(name, [hand, stick, ring, plumb, gravity], { position }).runtime({ id: name, mutable: true });
}
