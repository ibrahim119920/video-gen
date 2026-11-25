import { camera, effects, group, material, primitives, scene } from "@aura3d/engine";
import {
  COLORS,
  HEAD_CENTER,
  HEAD_TILT,
  WHEEL_R,
  steerAssembly,
  torusRing,
  tube,
} from "../bike";
import { makeGhostBike } from "../ghost";
import {
  arrow3D,
  baseLights,
  clamp,
  easeInOut,
  lerp,
  stageEnvironment,
  stageSky,
} from "../stage";
import { ov } from "../overlay";

export const duration = 10.0;

const LIFT = 0.45;

type NodeHandle = {
  setRotation: (x: number, y: number, z: number) => NodeHandle;
  setPosition: (x: number, y: number, z: number) => NodeHandle;
  setScale: (x: number, y: number, z: number) => NodeHandle;
  setVisible: (visible: boolean) => NodeHandle;
};
type AppLike = { nodes: { require: (id: string) => NodeHandle }; camera?: { setPose: (p: object) => void } };

function glowWheel(prefix: string, color: string) {
  const mat = material.pbr({
    color: "#5A3A08",
    emissive: color,
    emissiveIntensity: 0.55,
    roughness: 0.55,
    metallic: 0.2,
  });
  const spokes = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const rr = WHEEL_R - 0.06;
    return tube(
      `${prefix}-spoke-${i}`,
      [0, 0, 0],
      [0, Math.cos(a) * rr, Math.sin(a) * rr],
      0.0035,
      mat,
      false,
    );
  });
  return group(`${prefix}-wheel`, [
    torusRing(`${prefix}-tire`, WHEEL_R - 0.02, 0.009, {
      rotation: [0, Math.PI / 2, 0],
      material: mat,
      radialSegments: 72,
      tubularSegments: 6,
    }),
    ...spokes,
  ]).runtime({ id: `${prefix}-wheel`, mutable: true });
}

export function build() {
  const front = group(
    "frontRig",
    [
      group(
        "frontAxis",
        [
          // Stationary head tube around the steerer so the isolated front end reads as a fork.
          primitives.cylinder({
            name: "F-headext",
            size: [0.05, 0.23, 0.05],
            position: [0, 0.01, 0.005],
            material: material.pbr({ color: COLORS.frame, metallic: 0.3, roughness: 0.45 }),
            params: { radialSegments: 14 },
          }),
          steerAssembly("F"),
        ],
        {
          position: HEAD_CENTER,
          rotation: [HEAD_TILT, 0, 0],
        },
      ),
    ],
    { position: [0, LIFT, 0] },
  );
  const ghost = makeGhostBike({ name: "ghost", position: [0, LIFT, 0], opacity: 0.07, front: false });
  const counter = glowWheel("G", COLORS.amber).position(0.55, LIFT + WHEEL_R, -0.54);

  const hub: [number, number, number] = [0, LIFT + 0.34, -0.54];
  const lArrow = group(
    "Lgroup",
    [
      arrow3D("Larrow", [0.12, 0, 0], [1, 0, 0], 0.34, COLORS.cyan, 0.01, {
        headLength: 0.07,
        emissiveIntensity: 0.9,
      }),
      torusRing("Lring", 0.1, 0.006, {
        position: [0.3, 0, 0],
        rotation: [0, Math.PI / 2, 0],
        material: material.emissive({ color: COLORS.cyan, emissive: COLORS.cyan, emissiveIntensity: 1.0 }),
        radialSegments: 48,
        tubularSegments: 5,
      }),
    ],
    { position: hub },
  ).runtime({ id: "Lgroup", mutable: true });

  const cArrow = group(
    "Cgroup",
    [
      arrow3D("Carrow", [-0.12, 0, 0], [-1, 0, 0], 0.3, COLORS.amber, 0.009, {
        headLength: 0.065,
        emissiveIntensity: 0.9,
      }),
      torusRing("Cring", 0.09, 0.005, {
        position: [-0.26, 0, 0],
        rotation: [0, Math.PI / 2, 0],
        material: material.emissive({ color: COLORS.amber, emissive: COLORS.amber, emissiveIntensity: 1.5 }),
        radialSegments: 48,
        tubularSegments: 5,
      }),
    ],
    { position: hub },
  ).runtime({ id: "Cgroup", mutable: true });

  const floor = primitives.plane({
    name: "groundS2",
    size: [26, 1, 26],
    position: [0, -0.92, 0],
    material: material.pbr({ color: "#0A1522", roughness: 0.95 }),
    receiveShadow: true,
  });

  const sceneB = scene({ background: "#070B12" })
    .add(stageSky({ zenith: "#060B14", horizon: "#0B1626", ground: "#05080E" }))
    .add(stageEnvironment(0.45))
    .addMany(baseLights({ key: 1.6, fill: 0.45, rim: 1.8, hemi: 0.45, rimColor: COLORS.cyan }))
    .add(floor)
    .add(ghost)
    .add(front)
    .add(counter)
    .add(lArrow)
    .add(cArrow)
    .add(effects.bloom({ intensity: 0.62, threshold: 0.8, scatter: 0.55 }))
    .add(effects.vignette({ intensity: 0.36, smoothness: 0.45 }))
    .add(effects.depthOfField({ focusDistance: 3.0, fStop: 4.0, focalLength: 55, maxBlur: 8 }))
    .camera(camera.perspective({ position: [0.8, 1.38, 2.25], target: hub, fov: 35 }));

  function update(t: number, app: AppLike) {
    // Orbit across the face of the wheel, never edge-on, then pull back.
    const orbitU = easeInOut(clamp(t / 6.0));
    const pull = easeInOut(clamp((t - 6.0) / 2.8));
    const pos: [number, number, number] = [
      lerp(lerp(0.8, 2.1, orbitU), 2.4, pull),
      lerp(lerp(1.38, 1.18, orbitU), 1.65, pull),
      lerp(lerp(2.25, 1.0, orbitU), 3.4, pull),
    ];
    const target: [number, number, number] = [
      0,
      lerp(hub[1], 0.6, pull),
      lerp(hub[2], -0.1, pull),
    ];
    app.camera?.setPose({ position: pos, target, fov: 35 });

    // Hero wheel spins at ~1.2 rev/s so the spokes stay readable.
    app.nodes.require("F-front-wheel").setRotation(-2 * Math.PI * 1.2 * t, 0, 0);

    // Angular momentum arrow appears after the wheel is established.
    const lp = clamp((t - 2.2) / 0.7);
    app.nodes.require("Lgroup").setVisible(lp > 0.01).setScale(lp, lp, lp);

    // Counter-rotating second wheel slides onto the axle at 4.8 s.
    const cIn = easeInOut(clamp((t - 4.8) / 1.0));
    const cx = lerp(1.35, 0.18, cIn);
    app.nodes.require("G-wheel").setPosition(cx, LIFT + WHEEL_R, -0.54);
    app.nodes.require("G-wheel").setRotation(2 * Math.PI * 1.2 * t, 0, 0);
    const cp = clamp((t - 5.5) / 0.8);
    app.nodes.require("Cgroup").setVisible(cp > 0.01).setScale(cp, cp, cp);

    // Once both are present, collapse both arrows into "Net L ~ 0".
    const collapse = easeInOut(clamp((t - 7.6) / 1.0));
    if (collapse > 0) {
      const s = 1 - collapse * 0.75;
      app.nodes.require("Lgroup").setScale(s, s, s);
      app.nodes.require("Cgroup").setScale(s, s, s);
    }
  }

  function overlay(t: number) {
    ov.corner("MITOS GIROSKOP", clamp((t - 0.25) / 0.4) * 0.8);
    ov.divider(0);

    if (t < 4.8) {
      ov.sub(
        [["Banyak orang mengira rahasianya "], ["efek giroskop", COLORS.cyan], [" dari roda yang berputar."]],
        clamp((t - 0.7) / 0.3) * clamp((4.8 - t) / 0.2),
      );
    } else if (t < 7.4) {
      ov.sub(
        [["Padahal, sepeda yang efek giroskopnya "], ["sudah dinetralkan", COLORS.amber], [" pun tetap bisa diseimbangkan."]],
        clamp((t - 4.8) / 0.3) * clamp((7.4 - t) / 0.2),
      );
    } else {
      ov.sub(
        [["Giroskop "], ["bukan", COLORS.red], [" satu-satunya jawaban."]],
        clamp((t - 7.4) / 0.3) * clamp((9.7 - t) / 0.25),
      );
    }

    const net = clamp((t - 7.2) / 0.5);
    ov.callout("a", "Net L ≈ 0", net, 60, 1440);
    const chk = clamp((t - 7.9) / 0.4);
    ov.callout("c", "✓  tetap seimbang", chk, 60, 1540);
  }

  return { views: [{ selector: "#app", scene: sceneB, update }], overlay, duration };
}
