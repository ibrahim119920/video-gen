// c05 — rel, kereta fajar, dan SATU jembatan desa. Revisi 3.
// Rel berada di foreground (z=2.5); jembatan terpisah di belakang (z=-10)
// melintang sungai dan menghubungkan dua desa.
import * as THREE from '../vendor/three.module.js';
import {
  PAL, CSS, std, mesh, world, makeCamera, Cam, ov, counter, glow, stageLights,
  clamp01, lerp, seg, spring, outCubic, inOut, smooth, rng, num,
} from '../lib.js';
import { makeHouse, makeTree } from '../props.js';

export const duration = 5.0;

const SUBS = [
  [0.0, 2.5, [['Ditambah sekitar ', null], ['210 kilometer', CSS.infraDeep], [' jalur rel,', null]]],
  [2.5, 5.0, [['dan jembatan untuk desa-desa yang ', null], ['terisolasi', CSS.infraDeep], ['.', null]]],
];

const RAIL_Z = 2.5;
const RAIL_N = 104;
const RAIL_X0 = -36;
const RAIL_GAP = 0.72;
const RIVER_Z = -10;
const RIVER_HALF = 4.7;
const WATER_Y = -0.85;
const BRIDGE_X = 8.2;
const BRIDGE_Z0 = -3.7;
const BRIDGE_Z1 = -16.3;
const PLANK_N = 17;
const PLANK_D = (BRIDGE_Z0 - BRIDGE_Z1) / PLANK_N;

function makeTrain() {
  const train = new THREE.Group();
  const blue = std(0x2D6FA8, { rough: 0.48, em: 0x0A2440, ei: 0.5 });
  const blueDark = std(0x1D4C78, { rough: 0.6 });
  const cream = std(0xF4E5C8, { rough: 0.72 });
  const windowMat = std(0xFFD57A, { em: 0xFFB23A, ei: 1.8, rough: 0.35 });
  const metal = std(0x2A2D34, { rough: 0.55, metal: 0.3 });

  for (let i = 0; i < 3; i++) {
    const car = new THREE.Group();
    const head = i === 2;
    const body = mesh(new THREE.BoxGeometry(1.50, 1.24, 1.40), head ? blue : cream, [0, 0.92, 0]);
    car.add(body);
    const lower = mesh(new THREE.BoxGeometry(1.52, 0.24, 1.42), blue, [0, 0.38, 0]);
    car.add(lower);
    const roof = mesh(new THREE.BoxGeometry(1.54, 0.16, 1.34), blueDark, [0, 1.58, 0]);
    car.add(roof);
    for (let w = 0; w < 3; w++) {
      const win = mesh(new THREE.BoxGeometry(0.26, 0.32, 0.04), windowMat, [-0.44 + w * 0.44, 1.02, 0.71]);
      car.add(win);
      const win2 = mesh(new THREE.BoxGeometry(0.26, 0.32, 0.04), windowMat, [-0.44 + w * 0.44, 1.02, -0.71]);
      car.add(win2);
    }
    if (head) {
      const nose = mesh(new THREE.BoxGeometry(0.36, 0.60, 1.26), blueDark, [0.84, 0.70, 0]);
      car.add(nose);
      const lamp = mesh(new THREE.BoxGeometry(0.06, 0.18, 0.28), std(0xFFF2C8, { em: 0xFFB23A, ei: 2.6 }), [1.04, 0.82, 0]);
      car.add(lamp);
      const gl = glow(0xFFC45A, 1.7, 0.65);
      gl.position.set(1.14, 0.82, 0);
      car.add(gl);
    }
    const wheelG = new THREE.CylinderGeometry(0.20, 0.20, 0.10, 12);
    for (const sx of [-0.46, 0.46]) {
      for (const sz of [-1, 1]) {
        const wh = mesh(wheelG, metal, [sx, 0.24, sz * 0.62]);
        wh.rotation.z = Math.PI / 2;
        car.add(wh);
      }
    }
    car.position.x = (i - 1) * 1.64;
    train.add(car);
  }
  train.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return train;
}

export function build() {
  const scene = world(
    'linear-gradient(180deg, #172A48 0%, #2E4C68 20%, #6E7F8E 38%, #C08F78 56%, #F2B878 72%, #FFE4B0 100%)',
    0xA78B80, 32, 118
  );
  stageLights(scene, {
    key: 1.85, amb: 0.92,
    sky: 0x9CC8E8, ground: 0x2A231E,
    tint: 0xFFD6A8, rim: 0x7ED8E6, rimI: 0.95,
    shadowArea: 28, shadowZ: 2, sun: [-10, 13, 10], rimPos: [8, 6, -8],
  });

  const r = rng(505);

  // ---------- tanah + sawah ----------
  const nearGround = new THREE.Mesh(new THREE.PlaneGeometry(240, 70), std(0x41583A, { rough: 1 }));
  nearGround.rotation.x = -Math.PI / 2;
  nearGround.position.set(0, -0.02, 30);
  nearGround.receiveShadow = true;
  scene.add(nearGround);

  const farGround = new THREE.Mesh(new THREE.PlaneGeometry(240, 95), std(0x3B5238, { rough: 1 }));
  farGround.rotation.x = -Math.PI / 2;
  farGround.position.set(0, -0.02, -62);
  farGround.receiveShadow = true;
  scene.add(farGround);

  // petak sawah: pita panjang, sedikit berbeda warna
  for (let i = 0; i < 10; i++) {
    const z = 8 + i * 3.1;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(92, 0.32), std(i % 2 ? 0x536B42 : 0x3E5A3A, { rough: 1 }));
    p.rotation.x = -Math.PI / 2;
    p.position.set(0, 0.005, z);
    scene.add(p);
  }
  for (let i = 0; i < 8; i++) {
    const z = -20 - i * 3.0;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(92, 0.28), std(i % 2 ? 0x4E6841 : 0x3B5836, { rough: 1 }));
    p.rotation.x = -Math.PI / 2;
    p.position.set(0, 0.005, z);
    scene.add(p);
  }

  // ---------- sungai ----------
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(240, RIVER_HALF * 2 + 0.4),
    std(0x1E7376, { rough: 0.28, metal: 0.22, em: 0x073436, ei: 0.65 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, WATER_Y, RIVER_Z);
  scene.add(water);

  // tebing
  for (const sz of [-1, 1]) {
    const wall = mesh(new THREE.BoxGeometry(240, 1.2, 0.6), std(0x6B5A42, { rough: 1 }),
      [0, -0.58, RIVER_Z + sz * (RIVER_HALF + 0.25)]);
    wall.receiveShadow = true;
    scene.add(wall);
  }

  // riak air
  const foam = [];
  for (let i = 0; i < 12; i++) {
    const f = mesh(new THREE.BoxGeometry(1.0 + r() * 2.2, 0.02, 0.07),
      std(0xC8F4EE, { em: 0x4EAAA4, ei: 0.7, rough: 0.4 }),
      [(r() - 0.5) * 34, WATER_Y + 0.025, RIVER_Z + (r() - 0.5) * 7.6]);
    scene.add(f);
    foam.push({ m: f, ph: r() * 6.28, sp: 0.5 + r() * 0.8 });
  }

  // kabut sungai
  for (let i = 0; i < 4; i++) {
    const mist = glow(0xCFECEA, 20 + i * 5, 0.10);
    mist.position.set(-18 + i * 13, 0.25 + i * 0.08, RIVER_Z - 1 + i * 0.6);
    scene.add(mist);
  }

  // ---------- rel foreground ----------
  const ballast = new THREE.Mesh(new THREE.PlaneGeometry(86, 4.4), std(0x55504A, { rough: 1 }));
  ballast.rotation.x = -Math.PI / 2;
  ballast.position.set(0, 0.012, RAIL_Z);
  ballast.receiveShadow = true;
  scene.add(ballast);

  const sleepers = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.38, 0.12, 2.00), std(0x5A3F2C, { rough: 0.95 }), RAIL_N
  );
  sleepers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  sleepers.castShadow = true;
  sleepers.receiveShadow = true;
  sleepers.frustumCulled = false;
  scene.add(sleepers);

  const railMat = std(0xA8B2BA, { rough: 0.26, metal: 0.55, em: 0x24323C, ei: 0.45 });
  for (const sz of [-0.58, 0.58]) {
    const rail = mesh(new THREE.BoxGeometry(84, 0.10, 0.10), railMat, [0, 0.20, RAIL_Z + sz]);
    scene.add(rail);
    const shine = mesh(new THREE.BoxGeometry(84, 0.015, 0.04), std(0xDCF8FF, { em: 0x9EE8FF, ei: 0.8, rough: 0.2 }), [0, 0.258, RAIL_Z + sz]);
    scene.add(shine);
  }

  // ---------- kereta ----------
  const train = makeTrain();
  train.position.set(-42, 0.10, RAIL_Z);
  scene.add(train);

  // ---------- dua desa ----------
  const houses = [];
  const nearHouses = [
    [5.2, -2.4, 0.3], [6.7, -2.8, -0.1], [9.7, -2.5, 0.15], [11.3, -2.9, -0.3],
  ];
  const farHouses = [
    [4.8, -18.2, 0.2], [6.6, -18.7, -0.2], [9.6, -18.4, 0.1], [12.0, -18.9, -0.15],
  ];
  for (const [x, z, rot] of [...nearHouses, ...farHouses]) {
    const h = makeHouse({
      w: 1.35 + r() * 0.35, d: 1.20 + r() * 0.3, h: 0.82 + r() * 0.18,
      wall: 0xE4D2B2, roof: r() > 0.5 ? 0xB4553C : 0x8C5A3C,
      lit: true, flag: false,
    });
    h.position.set(x, 0.02, z);
    h.rotation.y = rot;
    scene.add(h);
    houses.push(h);
    const warm = glow(0xFFC266, 1.1, 0.30);
    warm.position.set(x, 0.55, z + 0.72);
    scene.add(warm);
  }
  // pohon desa
  for (let i = 0; i < 10; i++) {
    const t = makeTree({ h: 1.6 + r() * 1.1, kind: i % 4 === 0 ? 'palm' : 'round', leaf: 0x416B42 });
    const near = i < 5;
    t.position.set(2.2 + r() * 13, 0.02, near ? -1.6 - r() * 2.0 : -17.0 - r() * 3.0);
    scene.add(t);
  }

  // ---------- SATU jembatan kayu ----------
  const wood = std(0x8B5C36, { rough: 0.9 });
  const wood2 = std(0x75492C, { rough: 0.92 });
  const woodDark = std(0x5B3822, { rough: 0.95 });
  const plankMesh = [];
  for (let i = 0; i < PLANK_N; i++) {
    const z = BRIDGE_Z0 - i * PLANK_D;
    const p = mesh(new THREE.BoxGeometry(2.42, 0.16, PLANK_D * 1.01), i % 2 ? wood2 : wood, [BRIDGE_X, 0.42, z]);
    p.scale.y = 0.001;
    p.castShadow = true;
    p.receiveShadow = true;
    scene.add(p);
    plankMesh.push(p);
  }

  const beams = [];
  for (const sx of [-1.24, 1.24]) {
    const b = mesh(new THREE.BoxGeometry(0.16, 0.28, BRIDGE_Z0 - BRIDGE_Z1 + 0.6), woodDark,
      [BRIDGE_X + sx, 0.34, (BRIDGE_Z0 + BRIDGE_Z1) / 2]);
    b.scale.y = 0.001;
    scene.add(b);
    beams.push(b);
  }

  const piers = [];
  for (const z of [-7.0, -10.0, -13.0]) {
    for (const sx of [-0.85, 0.85]) {
      const p = mesh(new THREE.CylinderGeometry(0.16, 0.20, 1.8, 8), woodDark,
        [BRIDGE_X + sx, -0.55, z]);
      p.scale.y = 0.001;
      scene.add(p);
      piers.push(p);
    }
  }

  const posts = [];
  for (const sx of [-1.12, 1.12]) {
    for (let i = 0; i <= 6; i++) {
      const z = BRIDGE_Z0 - i * ((BRIDGE_Z0 - BRIDGE_Z1) / 6);
      const p = mesh(new THREE.BoxGeometry(0.12, 0.82, 0.12), wood,
        [BRIDGE_X + sx, 0.42 + 0.41, z]);
      p.scale.y = 0.001;
      scene.add(p);
      posts.push(p);
    }
  }
  const rails = [];
  for (const sx of [-1.12, 1.12]) {
    const rail = mesh(new THREE.BoxGeometry(0.10, 0.10, BRIDGE_Z0 - BRIDGE_Z1),
      wood, [BRIDGE_X + sx, 1.18, (BRIDGE_Z0 + BRIDGE_Z1) / 2]);
    rail.scale.z = 0.001;
    scene.add(rail);
    rails.push(rail);
  }

  // lentera di dua ujung jembatan
  const lanternGroup = new THREE.Group();
  lanternGroup.visible = false;
  scene.add(lanternGroup);
  const lanterns = [];
  for (const z of [BRIDGE_Z0 + 0.35, BRIDGE_Z1 - 0.25]) {
    for (const sx of [-1.12, 1.12]) {
      const post = mesh(new THREE.BoxGeometry(0.10, 1.25, 0.10), woodDark, [BRIDGE_X + sx, 0.65, z]);
      lanternGroup.add(post);
      const lamp = mesh(new THREE.BoxGeometry(0.20, 0.24, 0.20), std(0xFFE2A0, { em: 0xFFB23A, ei: 2.4 }), [BRIDGE_X + sx, 1.36, z]);
      lanternGroup.add(lamp);
      const gl = glow(0xFFC266, 2.2, 0.55);
      gl.position.set(BRIDGE_X + sx, 1.36, z);
      lanternGroup.add(gl);
      lanterns.push(gl);
    }
  }

  const bridgeTipGlow = glow(0xFFC46A, 2.0, 0.6);
  bridgeTipGlow.position.set(BRIDGE_X, 0.75, BRIDGE_Z0);
  scene.add(bridgeTipGlow);

  // ---------- latar: bukit + matahari ----------
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(2.0, 26),
    new THREE.MeshBasicMaterial({ color: 0xFFDDA0, transparent: true, opacity: 0.95, toneMapped: false })
  );
  sun.position.set(-20, 4.4, -57);
  scene.add(sun);
  const sunGlow = glow(0xFFC27A, 17, 0.45);
  sunGlow.position.set(-20, 4.4, -58);
  scene.add(sunGlow);
  for (let i = 0; i < 7; i++) {
    const h = new THREE.Mesh(
      new THREE.ConeGeometry(9 + r() * 7, 4 + r() * 5, 5),
      std(i % 2 ? 0x2C3C48 : 0x34464C, { flat: true, rough: 1 })
    );
    h.position.set(-40 + i * 14 + r() * 5, 1.8, -56 - r() * 12);
    h.rotation.y = r() * 1.2;
    scene.add(h);
  }

  // tiang listrik desa
  for (let i = 0; i < 4; i++) {
    const x = 2 + i * 4.2;
    const p = mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.4, 6), woodDark, [x, 2.2, -20.2]);
    scene.add(p);
  }

  // ---------- kamera ----------
  const cam = new Cam(makeCamera(34), { shake: 0 })
    .key(0.0, [-20.0, 3.6, 22.8], [-12.0, 1.0, 2.5], outCubic)
    .key(1.0, [-10.0, 3.7, 21.8], [-3.0, 1.0, 2.5], inOut)
    .key(2.0, [-2.0, 3.9, 21.5], [1.0, 1.0, 2.5], inOut)
    .key(3.20, [12.0, 5.2, 20.0], [14.0, 1.0, 2.5], inOut)
    .key(3.45, [8.2, 7.8, 16.0], [8.2, 1.0, -7.5], inOut)
    .key(4.45, [8.2, 5.3, 13.4], [8.2, 0.9, -9.5], outCubic)
    .key(5.0, [8.2, 5.3, 13.4], [8.2, 0.9, -9.5], inOut);

  function update(t) {
    cam.apply(t);
    const tt = Math.min(t, 4.5);

    // bantalan muncul berurutan
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    for (let i = 0; i < RAIL_N; i++) {
      const t0 = 0.05 + i * 0.016;
      const u = clamp01((t - t0) / 0.18);
      const s = Math.max(0.001, spring(u, 9, 7));
      v.set(RAIL_X0 + i * RAIL_GAP, 0.06, RAIL_Z);
      sc.set(1, s, 1);
      m4.compose(v, q, sc);
      sleepers.setMatrixAt(i, m4);
    }
    sleepers.instanceMatrix.needsUpdate = true;

    // kereta
    const trainU = clamp01((t - 2.02) / 1.33);
    train.position.x = lerp(-6, 10, outCubic(trainU));
    train.visible = t > 2.0 && t < 3.45;
    train.position.y = 0.10 + 0.012 * Math.sin(t * 24);

    // jembatan: balok demi balok dari dekat ke jauh
    for (let i = 0; i < PLANK_N; i++) {
      const u = clamp01((t - 3.32 - i * 0.052) / 0.20);
      const s = Math.max(0, spring(u, 9, 7));
      plankMesh[i].scale.y = Math.max(0.001, s);
      plankMesh[i].position.y = 0.42;
    }
    for (const b of beams) b.scale.y = Math.max(0.001, spring(clamp01((t - 3.30) / 0.35), 9, 7));
    for (const p of piers) p.scale.y = Math.max(0.001, spring(clamp01((t - 3.24) / 0.38), 9, 7));
    for (const p of posts) p.scale.y = Math.max(0.001, spring(clamp01((t - 3.40) / 0.30), 9, 7));
    for (const rail of rails) rail.scale.z = Math.max(0.001, outCubic(clamp01((t - 3.56) / 0.48)));
    lanternGroup.visible = t > 3.92;
    for (const gl of lanterns) gl.material.opacity = 0.55 * clamp01((t - 4.0) / 0.35);

    const tipU = clamp01((t - 3.32) / 1.0);
    bridgeTipGlow.visible = tipU > 0 && tipU < 1;
    bridgeTipGlow.position.set(BRIDGE_X, 0.75, lerp(BRIDGE_Z0, BRIDGE_Z1, outCubic(tipU)));

    // riak
    for (let i = 0; i < foam.length; i++) {
      const f = foam[i];
      f.m.position.x = ((f.ph * 5 + tt * f.sp * 2.3) % 38) - 19;
      f.m.position.z = RIVER_Z + Math.sin(tt * 0.8 + f.ph) * 2.6;
      f.m.scale.x = 0.8 + 0.3 * Math.sin(tt * 2 + f.ph);
    }

    // ---------- overlay ----------
    ov.scrim('dark', 0.34 * clamp01((t - 0.1) / 0.4));
    ov.title('INFRASTRUKTUR · Rp45 T', { color: '#A8D6FF', p: clamp01((t - 0.10) / 0.30) });

    const c = counter(t, 0.30, 1.70, 60, 210);
    ov.big((c.done ? '±' : '') + num(c.v) + ' km rel', {
      color: '#D8EEFF', p: clamp01((t - 0.18) / 0.25), size: 144,
      sub: c.done ? 'jalur rel baru' : '',
      subColor: 'rgba(190,224,255,0.72)',
    });

    ov.subs(t, SUBS);
  }

  return { scene, camera: cam.camera, update, duration };
}
