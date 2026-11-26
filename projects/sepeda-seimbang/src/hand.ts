import { group, material, primitives } from "@aura3d/engine";
import { tube } from "./bike";

type V3 = [number, number, number];

export const handSkin = material.pbr({ color: "#D8AE86", roughness: 0.62 });
export const handDark = material.pbr({ color: "#2A3446", roughness: 0.8 });

function tip(name: string, p: V3, size: number, mat: ReturnType<typeof material.pbr>) {
  return primitives.sphere({
    name,
    size,
    position: p,
    material: mat,
    castShadow: false,
  });
}

/**
 * Stylised open palm, fingers pointing +X, wrist/sleeve entering from -X.
 * The palm top is the local y = 0 plane, so a stick can stand at [0, 0.006, 0].
 */
export function makeOpenHand({
  name = "hand",
  position = [0, 0, 0] as V3,
  rotation = [0, 0, 0] as V3,
}: { name?: string; position?: V3; rotation?: V3 } = {}) {
  const zs = [-0.057, -0.019, 0.019, 0.057];
  const fingers = zs.map((z, i) => {
    const a: V3 = [0.09, 0.004, z];
    const b: V3 = [0.2, 0.006, z * 1.03];
    const c: V3 = [0.255, -0.002, z * 1.06];
    return group(`finger-${i}`, [
      tube(`${name}-finger-${i}-a`, a, b, 0.016, handSkin, false),
      tube(`${name}-finger-${i}-b`, b, c, 0.014, handSkin, false),
      tip(`${name}-finger-${i}-tip`, c, 0.028, handSkin),
    ]);
  });

  return group(
    name,
    [
      primitives.roundedBox({
        name: `${name}-palm`,
        size: [0.22, 0.055, 0.16],
        position: [0, -0.0275, 0],
        material: handSkin,
        castShadow: true,
      }),
      ...fingers,
      tube(`${name}-thumb`, [0.015, 0.0, 0.078], [0.1, 0.012, 0.145], 0.019, handSkin, false),
      tip(`${name}-thumb-tip`, [0.105, 0.012, 0.15], 0.038, handSkin),
      tube(`${name}-wrist`, [-0.1, -0.02, 0], [-0.22, -0.075, 0], 0.052, handSkin, false),
      tube(`${name}-sleeve`, [-0.2, -0.065, 0], [-0.46, -0.23, 0], 0.058, handDark, false),
      tip(`${name}-sleeve-cap`, [-0.46, -0.23, 0], 0.116, handDark),
    ],
    { position, rotation },
  );
}

/**
 * Stylised hand gripping a saddle from the +X side. Fingers curl over the top
 * toward -X; the sleeve leaves toward +X so it reads from the camera side.
 */
export function makeGripHand({
  name = "grip",
  position = [0, 0, 0] as V3,
  rotation = [0, 0, 0] as V3,
}: { name?: string; position?: V3; rotation?: V3 } = {}) {
  const zs = [-0.06, -0.02, 0.02, 0.06];
  const fingers = zs.map((z, i) =>
    group(`grip-finger-${i}`, [
      tube(`${name}-finger-${i}-a`, [0.02, 0.015, z], [-0.02, 0.055, z], 0.014, handSkin, false),
      tube(`${name}-finger-${i}-b`, [-0.02, 0.055, z], [-0.075, 0.045, z], 0.013, handSkin, false),
      tip(`${name}-finger-${i}-tip`, [-0.078, 0.042, z], 0.026, handSkin),
    ]),
  );

  return group(
    name,
    [
      primitives.roundedBox({
        name: `${name}-palm`,
        size: [0.06, 0.1, 0.14],
        position: [0.015, -0.02, 0],
        material: handSkin,
        castShadow: true,
      }),
      ...fingers,
      tube(`${name}-thumb`, [0.02, -0.03, 0.07], [-0.02, 0.005, 0.085], 0.017, handSkin, false),
      tip(`${name}-thumb-tip`, [-0.025, 0.005, 0.087], 0.034, handSkin),
      tube(`${name}-wrist`, [0.04, -0.025, 0], [0.2, -0.055, 0], 0.05, handSkin, false),
      tube(`${name}-sleeve`, [0.17, -0.05, 0], [0.4, -0.12, 0], 0.055, handDark, false),
      tip(`${name}-sleeve-cap`, [0.4, -0.12, 0], 0.11, handDark),
    ],
    { position, rotation },
  );
}
