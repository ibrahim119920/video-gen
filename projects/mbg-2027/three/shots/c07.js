// c07 — kesehatan: diorama kepulauan malam, 51 RS & ribuan paket Puskesmas.
import * as THREE from '../vendor/three.module.js';
import {
  PAL, CSS, std, rbox, mesh, world, stageLights, makeCamera, Cam, ov, counter,
  clamp01, lerp, seg, spring, outCubic, inOut, smooth, rng, num, glow,
} from '../lib.js';
import { makePin, makeHospital, makePuskesmas } from '../props.js';

export const duration = 5.0;

const SUBS = [
  [0.0, 2.5, [['Setara sekitar ', null], ['51 rumah sakit', CSS.healthDeep], [',', null]]],
  [2.5, 5.0, [['plus ribuan paket penguatan ', null], ['Puskesmas', CSS.healthDeep], [' di daerah yang kekurangan layanan.', null]]],
];

// pulau diorama (koordinat dunia) — memanjang di sumbu x
const ISLES = [
  { x: -2.90, z: 0.35, rx: 1.25, rz: 0.38, rot: -0.42, seed: 31, n: 9 },
  { x: -0.90, z: 0.80, rx: 1.20, rz: 0.24, rot: -0.06, seed: 32, n: 10 },
  { x: -0.10, z: -0.55, rx: 0.95, rz: 0.70, rot: 0.10, seed: 33, n: 9 },
  { x: 1.25, z: -0.20, rx: 0.42, rz: 0.66, rot: -0.20, seed: 34, n: 7 },
  { x: 1.05, z: 0.12, rx: 0.22, rz: 0.14, rot: 0.60, seed: 35, n: 6 },
  { x: 2.75, z: -0.50, rx: 0.85, rz: 0.58, rot: -0.05, seed: 36, n: 9 },
  { x: 0.85, z: 1.25, rx: 0.26, rz: 0.26, rot: 0.00, seed: 37, n: 7 },
  { x: 2.00, z: 1.15, rx: 0.22, rz: 0.20, rot: 0.30, seed: 38, n: 6 },
];
const SMALL = [
  { x: -2.00, z: -0.55, r: 0.18, seed: 41 },
  { x: -1.55, z: 1.20, r: 0.13, seed: 42 },
  { x: 0.55, z: 1.35, r: 0.15, seed: 43 },
  { x: 1.70, z: 0.80, r: 0.13, seed: 44 },
  { x: 3.45, z: 0.55, r: 0.17, seed: 45 },
  { x: -1.30, z: -0.62, r: 0.10, seed: 46 },
];

// 12 pin — 3 jadi RS, sisanya Puskesmas
const PINS = [
  { x: -2.75, z: 0.40 },
  { x: -1.35, z: 0.80 },
  { x: -0.55, z: 0.85 },
  { x: -0.35, z: -0.55, hosp: true },
  { x: 0.20, z: -0.25 },
  { x: 1.25, z: -0.30, hosp: true },
  { x: 1.30, z: 0.20 },
  { x: 0.85, z: 1.25 },
  { x: 1.70, z: 0.80 },
  { x: 2.60, z: -0.55, hosp: true },
  { x: 2.90, z: -0.35 },
  { x: 3.05, z: -0.70 },
];

const TOP = 0.285;     // permukaan pulau
const PS = 0.42;       // skala pin

function isleGeo(rx, rz, seed, n, depth) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 0.36;
    pts.push(new THREE.Vector2(Math.cos(a) * rx * k, Math.sin(a) * rz * k));
  }
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
    depth, bevelEnabled: true, bevelThickness: 0.055, bevelSize: 0.055,
    bevelSegments: 1, curveSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

// poligon datar: kontur pulau / garis dangkal
function flatPoly(rx, rz, seed, n, k0 = 1) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 0.36;
    pts.push(new THREE.Vector2(Math.cos(a) * rx * k * k0, Math.sin(a) * rz * k * k0));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts));
  g.rotateX(-Math.PI / 2);
  return g;
}

// ambulans kecil
function makeAmbulans() {
  const g = new THREE.Group();
  const body = mesh(rbox(0.34, 0.16, 0.18, 0.035), std(0xFFF8EC, { rough: 0.6 }), [-0.02, 0.15, 0]);
  const cab = mesh(rbox(0.13, 0.13, 0.17, 0.03), std(0xFFF8EC, { rough: 0.6 }), [0.19, 0.13, 0]);
  const stripe = mesh(rbox(0.36, 0.05, 0.186, 0.01), std(0xE8453C, { rough: 0.55 }), [-0.02, 0.125, 0]);
  const glass = mesh(rbox(0.02, 0.07, 0.13, 0.01), std(0x1E2A38, { rough: 0.25 }), [0.255, 0.155, 0]);
  g.add(body, cab, stripe, glass);
  for (const sz of [-1, 1]) {
    const a = mesh(new THREE.BoxGeometry(0.08, 0.026, 0.01), std(0xE8453C, { rough: 0.5 }), [-0.03, 0.175, sz * 0.093]);
    const b = mesh(new THREE.BoxGeometry(0.026, 0.08, 0.01), std(0xE8453C, { rough: 0.5 }), [-0.03, 0.175, sz * 0.093]);
    g.add(a, b);
  }
  const wg = new THREE.CylinderGeometry(0.04, 0.04, 0.035, 9);
  for (const sx of [-0.13, 0.17]) {
    for (const sz of [-1, 1]) {
      const w = mesh(wg, std(0x22222A, { rough: 0.9 }), [sx, 0.04, sz * 0.085]);
      w.rotation.x = Math.PI / 2;
      g.add(w);
    }
  }
  const rot = mesh(rbox(0.085, 0.035, 0.075, 0.01), std(0xFF5566, { em: 0xFF2A40, ei: 2.2 }), [0.03, 0.255, 0]);
  g.add(rot);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.rot = rot;
  return g;
}

export function build() {
  const scene = world(
    'linear-gradient(180deg, #021018 0%, #041C26 34%, #062A36 62%, #0A3C46 100%)',
    0x04212B, 26, 70
  );
  stageLights(scene, {
    key: 2.45, amb: 0.58, sky: 0x9FE4F0, ground: 0x04161C,
    rim: 0x76E4F0, rimI: 1.15, shadowArea: 10, sun: [-7, 13, 9], rimPos: [8, 5, -9],
  });

  // ---------- laut ----------
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 320),
    std(0x051C26, { rough: 0.62, em: 0x03141B, ei: 0.30 })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.02;
  sea.receiveShadow = true;
  scene.add(sea);

  const r = rng(707);
  // riak tipis
  const rippleMat = std(0x14505C, { rough: 0.65, em: 0x0A3038, ei: 0.5 });
  for (let i = 0; i < 22; i++) {
    const w = 0.22 + r() * 0.42;
    const f = mesh(new THREE.BoxGeometry(w, 0.01, 0.022), rippleMat,
      [(r() - 0.5) * 14, 0.004, (r() - 0.5) * 9], 1, null, false);
    f.rotation.y = (r() - 0.5) * 0.35;
    scene.add(f);
  }

  // ---------- pulau ----------
  const topMat = std(0x1F6B58, { rough: 0.95 });
  const sideMat = std(0x0A2D2C, { rough: 0.9, flat: true });
  const contMat = std(0x3E9670, { rough: 0.95 });
  const sh1Mat = std(0x0C4450, { rough: 0.7, em: 0x062E38, ei: 0.35 });
  const sh2Mat = std(0x0A3542, { rough: 0.7, em: 0x052430, ei: 0.30 });

  for (const d of ISLES) {
    const grp = new THREE.Group();
    grp.position.set(d.x, 0, d.z);
    grp.rotation.y = d.rot;
    // air dangkal
    const sh2 = new THREE.Mesh(flatPoly(d.rx, d.rz, d.seed, d.n, 1.26), sh2Mat);
    sh2.position.y = 0.006;
    const sh1 = new THREE.Mesh(flatPoly(d.rx, d.rz, d.seed, d.n, 1.11), sh1Mat);
    sh1.position.y = 0.012;
    // pulau
    const base = new THREE.Mesh(isleGeo(d.rx, d.rz, d.seed, d.n, 0.22), [topMat, sideMat]);
    base.castShadow = true;
    base.receiveShadow = true;
    const cont = new THREE.Mesh(flatPoly(d.rx, d.rz, d.seed + 4, d.n, 0.64), contMat);
    cont.position.y = 0.292;
    cont.receiveShadow = true;
    grp.add(sh2, sh1, base, cont);
    scene.add(grp);
  }
  for (const d of SMALL) {
    const grp = new THREE.Group();
    grp.position.set(d.x, 0, d.z);
    const sh2 = new THREE.Mesh(flatPoly(d.r, d.r * 0.85, d.seed, 6, 1.30), sh2Mat);
    sh2.position.y = 0.006;
    const sh1 = new THREE.Mesh(flatPoly(d.r, d.r * 0.85, d.seed, 6, 1.13), sh1Mat);
    sh1.position.y = 0.012;
    const base = new THREE.Mesh(isleGeo(d.r, d.r * 0.85, d.seed, 6, 0.20), [topMat, sideMat]);
    base.castShadow = true;
    base.receiveShadow = true;
    const cont = new THREE.Mesh(flatPoly(d.r, d.r * 0.85, d.seed + 2, 6, 0.62), contMat);
    cont.position.y = 0.272;
    grp.add(sh2, sh1, base, cont);
    scene.add(grp);
  }

  // ---------- pin + bangunan ----------
  const pins = PINS.map((p, i) => {
    const pin = makePin({ color: 0xF0413A, h: 0.8 });
    pin.scale.setScalar(PS);
    pin.position.set(p.x, TOP + 0.8, p.z);
    pin.visible = false;
    pin.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(pin);

    const big = glow(0xFF9A86, 0.52, 0.48);
    big.position.set(p.x, TOP + 0.24, p.z + 0.06);
    big.visible = false;
    scene.add(big);

    const burst = glow(0xFFD8C8, 1.4, 0.0);
    burst.position.set(p.x, TOP + 0.22, p.z + 0.06);
    scene.add(burst);

    let bld;
    let bldGlow;
    if (p.hosp) {
      bld = makeHospital({ w: 0.90, h: 1.75, d: 0.90, color: 0xFFF8E8 });
      // salib merah di fasad barat (menghadap kamera)
      const crMat = std(0xFF4E3A, { rough: 0.45, em: 0xD01E12, ei: 0.75 });
      const cA = mesh(new THREE.BoxGeometry(0.04, 0.15, 0.52), crMat, [-0.465, 1.08, 0]);
      const cB = mesh(new THREE.BoxGeometry(0.04, 0.52, 0.15), crMat, [-0.465, 1.08, 0]);
      cA.castShadow = false; cB.castShadow = false;
      bld.add(cA, cB);
      // jendela hangat menyala
      for (let f = 0; f < 3; f++) {
        for (const sx of [-0.28, 0.02, 0.30]) {
          const wm = mesh(new THREE.BoxGeometry(0.19, 0.19, 0.03),
            std(0xFFC27A, { rough: 0.4, em: 0xFF9A3C, ei: 1.7 }), [sx, 0.45 + f * 0.6, 0.49]);
          wm.castShadow = false;
          bld.add(wm);
        }
        for (const sz of [-0.28, 0.02, 0.30]) {
          const wm = mesh(new THREE.BoxGeometry(0.03, 0.19, 0.19),
            std(0xFFC27A, { rough: 0.4, em: 0xFF9A3C, ei: 1.7 }), [-0.465, 0.45 + f * 0.6, sz]);
          wm.castShadow = false;
          bld.add(wm);
        }
      }
      bld.scale.setScalar(0.001);
      bld.position.set(p.x, TOP, p.z);
      scene.add(bld);
      bldGlow = glow(0xFFC98A, 1.55, 0.40);
      bldGlow.position.set(p.x, TOP + 1.35, p.z + 0.15);
      bldGlow.visible = false;
      scene.add(bldGlow);
    } else {
      bld = makePuskesmas({ w: 1.0, h: 0.62, d: 0.9 });
      const win = mesh(new THREE.BoxGeometry(0.20, 0.16, 0.03),
        std(0xFFC27A, { rough: 0.4, em: 0xFF9A3C, ei: 1.5 }), [0.24, 0.36, 0.47]);
      win.castShadow = false;
      bld.add(win);
      bld.scale.setScalar(0.001);
      bld.position.set(p.x, TOP, p.z);
      scene.add(bld);
      bldGlow = glow(0x9FF0E2, 0.95, 0.30);
      bldGlow.position.set(p.x, TOP + 0.42, p.z + 0.12);
      bldGlow.visible = false;
      scene.add(bldGlow);
    }

    return {
      i, pin, bld, bldGlow, burst, big,
      x: p.x, z: p.z, hosp: !!p.hosp,
      land: 0.45 + i * 0.16,
      conv: 0,
      base: p.hosp ? 0.55 : 0.47,
    };
  });

  let hc = 0;
  let pc = 0;
  for (const p of pins) {
    if (p.hosp) {
      p.conv = Math.max(p.land + 0.26, 1.55 + hc * 0.26);
      hc++;
    } else {
      p.conv = Math.max(p.land + 0.22, 2.55 + pc * 0.10);
      pc++;
    }
  }

  // ---------- kapal feri kecil + ambulans ----------
  const ferry = new THREE.Group();
  ferry.add(mesh(rbox(1.10, 0.28, 0.56, 0.10), std(0x2C4A56, { rough: 0.7 }), [0, 0.16, 0]));
  ferry.add(mesh(rbox(1.12, 0.07, 0.58, 0.02), std(0x1E6E6A, { rough: 0.6 }), [0, 0.08, 0]));
  ferry.add(mesh(rbox(1.00, 0.06, 0.50, 0.02), std(0x5E7C82, { rough: 0.9 }), [0, 0.30, 0]));
  for (const sz of [-1, 1]) {
    ferry.add(mesh(new THREE.BoxGeometry(0.9, 0.035, 0.035), std(0xBFD8D4, { rough: 0.6 }), [0.02, 0.46, sz * 0.24]));
  }
  const fLamp = mesh(new THREE.SphereGeometry(0.06, 7, 6), std(0xFFD79A, { em: 0xFFB050, ei: 2.4 }), [-0.45, 0.40, 0]);
  ferry.add(fLamp);
  ferry.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(ferry);

  const fGlow = glow(0xFFC070, 1.0, 0.40);
  scene.add(fGlow);

  const amb = makeAmbulans();
  amb.position.set(0, 0.33, 0);
  ferry.add(amb);
  const ambLight = new THREE.PointLight(0xFF3A48, 0, 1.9, 2);
  ambLight.position.set(0, 0.55, 0);
  ferry.add(ambLight);
  const ambGlow = glow(0xFF4A5A, 0.75, 0.4);
  scene.add(ambGlow);

  // ---------- kapal kecil latar ----------
  const boats = [];
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Group();
    b.add(mesh(rbox(0.42, 0.12, 0.20, 0.04), std(0x223E48, { rough: 0.8 }), [0, 0.07, 0]));
    b.add(mesh(rbox(0.16, 0.14, 0.14, 0.03), std(0x2E5158, { rough: 0.8 }), [-0.08, 0.18, 0]));
    const l = mesh(new THREE.SphereGeometry(0.035, 6, 5), std(0xFFD79A, { em: 0xFFB050, ei: 2.2 }), [0.12, 0.20, 0]);
    b.add(l);
    b.position.set(-5.2 + i * 3.4, 0, -2.9 + i * 2.4);
    b.rotation.y = 0.4 + i * 0.7;
    scene.add(b);
    boats.push({ g: b, x0: b.position.x, z0: b.position.z, ph: i * 2.1 });
  }

  // ---------- kamera: sepanjang kepulauan ----------
  const cam = new Cam(makeCamera(33), { shake: 0 })
    .key(0.00, [-16.2, 16.6, 5.6], [-0.10, 0.15, 0.22], outCubic)
    .key(1.50, [-12.6, 14.2, 3.9], [0.00, 0.30, 0.12], inOut)
    .key(3.50, [-7.6, 10.4, 1.5], [0.70, 2.10, 0.05], inOut)
    .key(4.50, [-12.8, 14.8, 4.6], [0.45, 0.10, 0.12], inOut);

  function update(t) {
    cam.apply(t, 0);

    // ---------- pin menancap + ledakan cahaya ----------
    for (const p of pins) {
      const fall = clamp01((t - (p.land - 0.24)) / 0.24);
      const alive = t > p.land - 0.24 && t < p.conv;
      p.pin.visible = alive;
      if (alive) {
        const d = Math.max(0, t - p.land);
        const sq = t < p.land ? 0 : Math.exp(-9 * d) * Math.cos(16 * d);
        p.pin.position.y = TOP + 0.80 * (1 - fall * fall);
        const sy = PS * (1 - 0.26 * sq);
        const sxz = PS * (1 + 0.20 * sq);
        p.pin.scale.set(sxz, sy, sxz);
      }

      // titik medis menyala
      p.big.visible = t > p.land - 0.05;
      if (p.big.visible) {
        const gs = 0.55 + 0.10 * Math.sin(t * 3.1 + p.i);
        p.big.scale.set(gs, gs, 1);
        p.big.material.opacity = 0.45;
      }

      // burst
      const bd = t - p.land;
      const bs = clamp01(bd / 0.42);
      p.burst.visible = bd > 0 && bs < 1;
      if (p.burst.visible) {
        const s = 0.35 + outCubic(bs) * 1.5;
        p.burst.scale.set(s, s, 1);
        p.burst.material.opacity = 0.85 * (1 - bs);
      }

      // bangunan tumbuh
      const bu = t - p.conv;
      if (bu > 0) {
        const s = spring(clamp01(bu / 0.40), 9, 6);
        p.bld.visible = true;
        p.bld.scale.setScalar(Math.max(0.001, p.base * Math.min(1.04, Math.max(0, s))));
        p.bldGlow.visible = true;
        p.bldGlow.material.opacity = 0.32 * clamp01(bu / 0.3);
      } else {
        p.bld.visible = false;
        p.bldGlow.visible = false;
      }
    }

    // ---------- feri + ambulans ----------
    const fu = inOut(seg(t, 0.95, 4.40));
    const fx = lerp(0.28, 2.05, fu);
    ferry.position.set(fx, 0.02 * Math.sin(t * 1.9), -1.52);
    ferry.rotation.z = 0.02 * Math.sin(t * 1.6);
    fGlow.position.set(fx - 0.45, 0.42, -1.52);
    const blink = Math.max(0, Math.sin(t * 13.5));
    amb.userData.rot.material.emissiveIntensity = 0.8 + blink * 2.6;
    ambLight.intensity = 0.12 + blink * 0.75;
    ambGlow.position.set(fx + 0.03, 0.60, -1.42);
    ambGlow.material.opacity = 0.14 + blink * 0.30;

    // ---------- kapal latar pelan ----------
    for (const b of boats) {
      b.g.position.x = b.x0 + 0.22 * Math.sin(t * 0.16 + b.ph);
      b.g.position.z = b.z0 + 0.12 * Math.cos(t * 0.13 + b.ph);
      b.g.position.y = 0.015 * Math.sin(t * 1.2 + b.ph);
    }

    // ---------- overlay ----------
    ov.scrim('dark', 0.58);
    ov.title('KESEHATAN · Rp45 T', { color: CSS.health, p: clamp01((t - 0.10) / 0.28) });

    if (t < 2.44) {
      const c = counter(t, 0.50, 1.50, 10, 51);
      ov.big((c.done ? '±' : '') + num(c.v) + ' RS', {
        color: CSS.health, p: clamp01((t - 0.42) / 0.22) * clamp01((2.42 - t) / 0.10),
        size: 158, sub: 'setara rumah sakit', subColor: 'rgba(200,255,248,0.72)',
      });
    } else if (t >= 2.52) {
      const c = counter(t, 2.52, 1.30, 800, 4700);
      ov.big((c.done ? '±' : '') + num(c.v), {
        color: CSS.health, p: clamp01((t - 2.50) / 0.20),
        size: 166, sub: 'paket Puskesmas', subColor: 'rgba(200,255,248,0.72)',
      });
    } else {
      ov.big('', { p: 0 });
    }

    ov.subs(t, SUBS, { size: 36 });
  }

  return { scene, camera: cam.camera, update, duration };
}
