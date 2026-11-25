// c08 — layanan publik: lajur BRT neon + deretan bus ungu melaju di kota malam.
import * as THREE from '../vendor/three.module.js';
import {
  CSS, std, rbox, mesh, world, stageLights, makeCamera, ov, counter,
  clamp01, lerp, seg, outCubic, inOut, rng, num, glow, makeInst, setInst,
} from '../lib.js';

export const duration = 5.0;

const SUBS = [
  [0.0, 2.5, [['Rp45 triliun untuk ', null], ['layanan publik', CSS.publicDeep], ['.', null]]],
  [2.5, 5.0, [['Sekitar 87 kilometer jalur ', null], ['BRT', CSS.publicDeep], [' dan hampir ', null], ['2.000 bus', CSS.publicDeep], ['.', null]]],
];

/* ---------- skala dunia: 1 unit ~ 5,5 m ---------- */
const Z_CAR = 3.05;                 // lajur mobil (dekat kamera)
const Z_BUS = -1.45;                // lajur BRT (jauh)
const LANE_Z0 = 0.10;               // tepi dekat lajur BRT
const LANE_W = 3.10;                // lebar lajur BRT

const BUS_L = 2.30;                 // 28% lebar layar pada jarak lajur
const BUS_H = 1.00;
const BUS_W = 0.64;
const BUS_GAP = 2.45;
const BUS_N = 5;

const CAR_L = 0.86;
const CAR_H = 0.42;
const CAR_W = 0.46;
const CAR_STEP = 1.02;
const CAR_N = 6;

/* ---------- bus ungu terang ---------- */
function makeBusUngu() {
  const g = new THREE.Group();
  const bodyMat = std(0xB197FF, { rough: 0.52, em: 0x7B52E8, ei: 0.50 });
  const body = mesh(rbox(BUS_L, BUS_H, BUS_W, 0.16), bodyMat, [0, 0.66, 0]);
  g.add(body);

  // pita kaca gelap di sisi kamera
  g.add(mesh(rbox(BUS_L * 0.90, 0.34, 0.03, 0.04),
    std(0x191430, { rough: 0.30, em: 0x2A1F58, ei: 0.55 }), [0, 0.93, BUS_W / 2 + 0.005]));

  // jendela penumpang hangat
  const winMat = std(0xFFDCA6, { rough: 0.35, em: 0xFFB45E, ei: 1.55 });
  for (let k = 0; k < 5; k++) {
    const w = mesh(new THREE.BoxGeometry(0.28, 0.23, 0.02), winMat, [-0.80 + k * 0.40, 0.93, BUS_W / 2 + 0.022]);
    w.castShadow = false;
    g.add(w);
  }

  // garis krem + strip atap menyala
  g.add(mesh(rbox(BUS_L * 0.99, 0.075, BUS_W + 0.012, 0.02),
    std(0xFFEED2, { rough: 0.60 }), [0, 0.58, 0]));
  g.add(mesh(rbox(BUS_L * 0.92, 0.055, BUS_W * 0.86, 0.03),
    std(0xE6D6FF, { rough: 0.45, em: 0x9C74FF, ei: 0.85 }), [0, 1.185, 0]));

  // lampu depan (arah +x) & belakang
  const head = mesh(new THREE.BoxGeometry(0.06, 0.14, 0.34),
    std(0xFFF4CC, { em: 0xFFD070, ei: 2.6 }), [BUS_L / 2 + 0.01, 0.52, 0]);
  head.castShadow = false;
  const tail = mesh(new THREE.BoxGeometry(0.05, 0.13, 0.30),
    std(0xFF9A78, { em: 0xFF3A16, ei: 2.0 }), [-BUS_L / 2 - 0.01, 0.52, 0]);
  tail.castShadow = false;
  g.add(head, tail);

  // roda
  const wg = new THREE.CylinderGeometry(0.16, 0.16, 0.10, 10);
  const wm = std(0x18141F, { rough: 0.92 });
  for (const sx of [-0.66, 0.66]) {
    for (const sz of [-1, 1]) {
      const w = mesh(wg, wm, [sx, 0.16, sz * (BUS_W / 2 - 0.04)]);
      w.rotation.x = Math.PI / 2;
      w.castShadow = false;
      g.add(w);
    }
  }

  g.traverse((o) => { if (o.isMesh && o.castShadow !== false) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ---------- mobil abu-abu ---------- */
function makeCarGray(shade, brkMat) {
  const g = new THREE.Group();
  const bodyMat = std(shade, { rough: 0.60 });
  g.add(mesh(rbox(CAR_L, 0.26, CAR_W, 0.08), bodyMat, [0, 0.29, 0]));
  g.add(mesh(rbox(CAR_L * 0.52, 0.19, CAR_W * 0.88, 0.06), bodyMat, [-0.03, 0.44, 0]));
  g.add(mesh(rbox(CAR_L * 0.46, 0.12, CAR_W * 0.90, 0.04),
    std(0x22222E, { rough: 0.28 }), [-0.03, 0.47, 0]));

  // lampu rem di sudut belakang (terlihat dari samping)
  for (const sz of [-1, 1]) {
    const bl = mesh(new THREE.BoxGeometry(0.05, 0.10, 0.10), brkMat,
      [-CAR_L / 2 + 0.01, 0.33, sz * (CAR_W / 2 - 0.06)]);
    bl.castShadow = false;
    g.add(bl);
  }

  const wg = new THREE.CylinderGeometry(0.085, 0.085, 0.07, 9);
  const wm = std(0x15151B, { rough: 0.92 });
  for (const sx of [-0.27, 0.27]) {
    for (const sz of [-1, 1]) {
      const w = mesh(wg, wm, [sx, 0.085, sz * (CAR_W / 2 - 0.03)]);
      w.rotation.x = Math.PI / 2;
      w.castShadow = false;
      g.add(w);
    }
  }

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function build() {
  const scene = world(
    'linear-gradient(180deg, #070310 0%, #120A20 26%, #23122E 48%, #3C1E3A 68%, #5A2A3E 100%)',
    0x1A1024, 46, 150
  );
  stageLights(scene, {
    key: 1.90, amb: 0.66, sky: 0x8A6ED2, ground: 0x0A0614,
    rim: 0xFFA45A, rimI: 0.80, shadowArea: 22, sun: [-8, 14, 10], rimPos: [10, 5, 6],
  });

  const r = rng(8181);

  /* ---------- tanah + jalan ---------- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 46), std(0x130E1C, { rough: 0.96 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, -8);
  ground.receiveShadow = true;
  scene.add(ground);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(140, 12.6), std(0x211A2B, { rough: 0.93 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, 0.4);      // z: +6.7 .. -5.9
  road.receiveShadow = true;
  scene.add(road);

  // trotoar
  const curbMat = std(0x2C2238, { rough: 0.95 });
  const walkFar = mesh(rbox(140, 0.10, 1.7, 0.03), std(0x241A30, { rough: 0.97 }), [0, 0.05, -6.9], 1, null, false);
  const walkNear = mesh(rbox(140, 0.10, 1.7, 0.03), std(0x1F1729, { rough: 0.97 }), [0, 0.05, 7.4], 1, null, false);
  const edgeFar = mesh(rbox(140, 0.03, 0.14, 0.015), curbMat, [0, 0.11, -6.15], 1, null, false);
  const edgeNear = mesh(rbox(140, 0.03, 0.14, 0.015), curbMat, [0, 0.11, 6.65], 1, null, false);
  scene.add(walkFar, walkNear, edgeFar, edgeNear);

  /* ---------- marka jalan ---------- */
  const dashMat = std(0x9E93B8, { rough: 0.8, em: 0x50456A, ei: 0.10 });
  const dashGeo = new THREE.BoxGeometry(0.95, 0.012, 0.07);
  const dashMid = makeInst(dashGeo, dashMat, 34, { shadow: false });
  for (let i = 0; i < 34; i++) {
    setInst(dashMid, i, -40 + i * 2.4, 0.008, 1.42, 1, 1, 1);
  }
  dashMid.instanceMatrix.needsUpdate = true;
  scene.add(dashMid);

  /* ---------- tambalan aspal tipis ---------- */
  const patchMat = std(0x1B1426, { rough: 0.99 });
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.1 + r() * 3.0, 0.45 + r() * 1.3), patchMat);
    p.rotation.x = -Math.PI / 2;
    p.rotation.z = (r() - 0.5) * 0.10;
    p.position.set(-24 + i * 3.4 + r() * 2.2, 0.004, -4.8 + r() * 10.2);
    p.receiveShadow = true;
    scene.add(p);
  }

  /* ---------- lajur BRT neon (tumbuh dari tepi dekat) ---------- */
  const laneGeo = new THREE.PlaneGeometry(140, 1);
  laneGeo.rotateX(-Math.PI / 2);
  laneGeo.translate(0, 0, -0.5);         // origin di tepi dekat
  const laneMat = std(0x4E27B4, { rough: 0.42, em: 0x6636E6, ei: 0.12 });
  const lane = new THREE.Mesh(laneGeo, laneMat);
  lane.position.set(0, 0.02, LANE_Z0);
  lane.scale.z = 0.001;
  lane.receiveShadow = false;
  scene.add(lane);

  const laneGlowMat = new THREE.MeshBasicMaterial({
    color: 0x7A4BF0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    depthWrite: false, toneMapped: false, fog: false,
  });
  const lgGeo = new THREE.PlaneGeometry(140, 1);
  lgGeo.rotateX(-Math.PI / 2);
  lgGeo.translate(0, 0, -0.5);
  const laneGlow = new THREE.Mesh(lgGeo, laneGlowMat);
  laneGlow.position.set(0, 0.035, LANE_Z0);
  laneGlow.scale.z = 0.001;
  scene.add(laneGlow);

  const edgeMat = std(0x8A76B8, { rough: 0.35, em: 0xA57BFF, ei: 0.05 });
  const edgeA = mesh(rbox(140, 0.035, 0.10, 0.015), edgeMat, [0, 0.035, LANE_Z0 - 0.05], 1, null, false);
  const edgeB = mesh(rbox(140, 0.035, 0.10, 0.015), edgeMat, [0, 0.035, LANE_Z0 - LANE_W + 0.05], 1, null, false);
  scene.add(edgeA, edgeB);

  /* ---------- siluet kota (dua baris) ---------- */
  const winMat = std(0xFFA267, { rough: 0.42, em: 0xFF7A30, ei: 0.85 });
  const winMat2 = std(0xFFC08A, { rough: 0.42, em: 0xFF9A46, ei: 1.15 });
  const cityBody = std(0x291A38, { rough: 0.94 });

  for (let i = 0; i < 26; i++) {
    const w = 1.5 + r() * 1.9;
    const h = 1.35 + r() * 1.25;
    const x = -34 + i * 2.45 + (r() - 0.5) * 0.7;
    const z = -10.4 - r() * 2.6;
    const b = mesh(rbox(w, h, 0.7, 0.04), cityBody, [x, h / 2, z], 1, null, false);
    scene.add(b);

    // jendela oranye, hanya di bagian bawah (di bawah zona teks)
    const nc = Math.max(2, Math.floor(w / 0.42));
    const nr = Math.max(2, Math.floor(h / 0.52));
    for (let ry = 0; ry < nr; ry++) {
      const rowLit = r() < 0.66;
      for (let cx2 = 0; cx2 < nc; cx2++) {
        if (!rowLit && r() < 0.75) continue;
        if (r() < 0.12) continue;
        const wy = 0.36 + ry * 0.52;
        if (wy > h - 0.22) continue;
        const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.17), r() < 0.3 ? winMat2 : winMat);
        wm.position.set(x - w / 2 + 0.30 + cx2 * 0.42, wy, z + 0.36);
        scene.add(wm);
      }
    }
  }

  // haze kota di belakang siluet
  for (let i = 0; i < 4; i++) {
    const hz = glow(0x7A3A6A, 1, 0.30);
    hz.scale.set(26, 7.5, 1);
    hz.position.set(-18 + i * 12, 1.9, -15.5);
    scene.add(hz);
  }

  /* ---------- 6 mobil macet ---------- */
  const cars = [];
  const shades = [0xA9AEB6, 0x969BA3, 0xB4B9C0];
  for (let i = 0; i < CAR_N; i++) {
    const brkMat = new THREE.MeshStandardMaterial({
      color: 0xFF8A6A, emissive: 0xFF2A10, emissiveIntensity: 1.4, roughness: 0.4,
    });
    const c = makeCarGray(shades[i % 3], brkMat);
    c.rotation.y = Math.PI / 2;           // hadap +x
    c.position.set((i - 2.5) * CAR_STEP, 0, Z_CAR + (r() - 0.5) * 0.16);
    scene.add(c);

    const bg = glow(0xFF4526, 0.95, 0.45);
    bg.position.set(0, 0.30, 0);
    scene.add(bg);
    cars.push({ g: c, glow: bg, mat: brkMat, ph: i * 1.05, ox: (i - 2.5) * CAR_STEP });
  }

  /* ---------- 5 bus ungu ---------- */
  const buses = [];
  for (let i = 0; i < BUS_N; i++) {
    const b = makeBusUngu();
    b.visible = false;
    scene.add(b);
    const under = glow(0x9C74FF, 3.0, 0.30);
    const head = glow(0xFFD890, 1.5, 0.55);
    under.visible = false;
    head.visible = false;
    scene.add(under, head);
    buses.push({ g: b, under, head });
  }

  // kilau "pengecatan" lajur
  const runner = glow(0xC9A6FF, 2.6, 0.0);
  runner.position.set(0, 0.10, Z_BUS + 0.2);
  scene.add(runner);

  /* ---------- kamera: 3 beat, horizon lurus, tanpa roll ---------- */
  const camera = makeCamera(38);

  // bus bergerak relatif terhadap kamera (kamera mengejar)
  const busRel = (i, t) => -4.655 + i * BUS_GAP + 1.10 * Math.max(0, t - 1.30);

  function camAt(t) {
    const p1 = inOut(seg(t, 0.00, 1.30));
    const p2 = inOut(seg(t, 1.30, 3.50));
    const p3 = inOut(seg(t, 3.50, 4.50));
    return {
      x: -0.90 + 0.95 * p1 + 2.05 * p2 + 0.80 * p3,
      y: 6.90 - 1.85 * p2 + 1.30 * p3,
      z: 18.60 + 0.25 * p2 + 0.95 * p3,
      lx: 5.0 * p3,
      ly: 1.15 - 0.18 * p2 + 0.02 * p3,
      lz: -2.20 - 0.40 * p2 - 0.10 * p3,
    };
  }

  function update(t) {
    const k = camAt(t);
    camera.position.set(k.x, k.y, k.z);
    camera.lookAt(k.x + k.lx, k.ly, k.lz);

    /* --- lajur menyala dari tepi dekat --- */
    const lp = inOut(clamp01((t - 1.28) / 0.66));
    const boost = inOut(seg(t, 3.50, 4.40));
    lane.scale.z = 1;
    laneGlow.scale.z = Math.max(0.001, lp);
    edgeA.visible = lp > 0.02;
    edgeB.visible = lp > 0.02;
    laneMat.emissiveIntensity = 0.10 + lp * 0.80 + boost * 0.45;
    laneGlowMat.opacity = lp * (0.16 + boost * 0.16);
    edgeMat.emissiveIntensity = 0.04 + lp * 1.05 + boost * 0.35;

    // kilau berjalan saat lajur digambar
    const rp = clamp01((t - 1.30) / 0.70);
    const ra = rp > 0 && rp < 1 ? 1 - rp : 0;
    runner.visible = ra > 0.02;
    if (runner.visible) {
      runner.position.set(k.x - 4.6 + rp * 9.2, 0.12, Z_BUS + 0.2);
      runner.material.opacity = 0.55 * ra;
      const s = 1.6 + rp * 1.4;
      runner.scale.set(s, s * 0.55, 1);
    }

    /* --- bus --- */
    for (let i = 0; i < BUS_N; i++) {
      const b = buses[i];
      const on = t > 1.24;
      const rel = busRel(i, t);
      const vis = on && rel > -9.5 && rel < 11.0;
      b.g.visible = vis;
      b.under.visible = vis;
      b.head.visible = vis;
      if (!vis) continue;
      const bx = k.x + rel;
      const bob = 0.008 * Math.sin(t * 7.5 + i * 1.7);
      b.g.position.set(bx, bob, Z_BUS);
      b.under.position.set(bx, 0.03, Z_BUS + 0.10);
      b.under.material.opacity = (0.26 + boost * 0.10) + 0.05 * Math.sin(t * 2.8 + i);
      b.head.position.set(bx + BUS_L * 0.52, 0.42, Z_BUS + 0.30);
      b.head.material.opacity = 0.28;
      b.head.scale.set(1.15, 1.15, 1);
    }

    /* --- mobil macet melintas mundur --- */
    for (let i = 0; i < CAR_N; i++) {
      const c = cars[i];
      const cxw = k.x + c.ox;
      c.g.position.x = cxw;
      // lampu rem bergelombang
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.3 - c.ph);
      c.mat.emissiveIntensity = 0.9 + pulse * 1.9;
      c.glow.position.set(cxw - CAR_L * 0.55, 0.26, Z_CAR + 0.24);
      c.glow.material.opacity = 0.20 + pulse * 0.35;
      const s = 0.55 + pulse * 0.22;
      c.glow.scale.set(s * 1.5, s, 1);
    }

    /* --- overlay --- */
    ov.scrim('dark', 0.60);
    ov.title('PELAYANAN PUBLIK · Rp45 T', { color: '#DCC8FF', p: clamp01((t - 0.10) / 0.28) });

    if (t < 2.96) {
      const c = counter(t, 1.00, 1.45, 10, 87);
      ov.big((c.done ? '±' : '') + num(c.v) + ' km BRT', {
        color: '#C9AEFF', p: clamp01((t - 0.92) / 0.22) * clamp01((2.94 - t) / 0.08),
        size: 138, sub: 'jalur khusus, bebas macet', subColor: 'rgba(226,212,255,0.72)',
      });
    } else {
      const c = counter(t, 3.00, 1.42, 300, 1970);
      ov.big((c.done ? '±' : '') + num(c.v) + ' bus', {
        color: '#C9AEFF', p: clamp01((t - 2.98) / 0.18),
        size: 150, sub: 'melaju tiap beberapa menit', subColor: 'rgba(226,212,255,0.72)',
      });
    }

    ov.subs(t, SUBS);
  }

  return { scene, camera, update, duration };
}
