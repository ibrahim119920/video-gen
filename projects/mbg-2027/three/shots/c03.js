// c03 — Rp180 T dipecah jadi 4 peti 45T. Revisi 3: panggung gelap-hangat,
// satu highlight besar, kamera crane -> orbit -> pull-back.
import * as THREE from '../vendor/three.module.js';
import {
  PAL, CSS, std, world, makeCamera, Cam, ov, counter, stageLights, glow,
  clamp01, lerp, seg, spring, outCubic, inOut, rng, num,
} from '../lib.js';
import {
  makeChest, makeFieldIcon, labelPlane, CoinField, TrayGrid, makeRing,
} from '../props.js';

export const duration = 5.0;

const SUBS = [
  [0.0, 2.2, [['Ada ', null], ['Rp180 triliun', CSS.orangeDeep], [' yang bisa dialihkan.', null]]],
  [2.2, 5.0, [['Dibagi rata: ', null], ['Rp45 triliun', CSS.orangeDeep], [' untuk empat bidang.', null]]],
];

const FIELDS = [
  { kind: 'road', color: PAL.infra, css: CSS.infra, x: -1.14, z: -1.04, glow: 0x4FA6E8 },
  { kind: 'health', color: PAL.health, css: CSS.health, x: 1.14, z: -1.04, glow: 0x37E0CD },
  { kind: 'public', color: PAL.public, css: CSS.public, x: -1.14, z: 1.04, glow: 0xA98CF0 },
  { kind: 'edu', color: PAL.edu, css: CSS.edu, x: 1.14, z: 1.04, glow: 0xFFD94A },
];

const CH_W = 1.52;
const CH_H = 1.08;
const CH_D = 0.92;
const SPLIT = 1.66;
const LAND = 2.34;

function neonChest(field, w, h, d) {
  const g = makeChest({ w, h, d, field, label: '', open: 0 });
  const bandMat = std(field, { rough: 0.38, metal: 0.22, em: field, ei: 1.25 });
  const bodyH = h * 0.60;
  const lidH = h * 0.34;

  for (const sx of [-1, 1]) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.095, bodyH * 1.04, d + 0.035),
      bandMat
    );
    band.position.set(sx * w * 0.30, bodyH / 2, 0);
    g.add(band);
    const lidBand = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.095, lidH * 1.04, d + 0.035),
      bandMat
    );
    lidBand.position.set(sx * w * 0.30, bodyH + lidH / 2, 0);
    g.add(lidBand);
  }
  // garis neon tipis di bibir peti
  const lip = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.94, 0.035, 0.035),
    std(field, { em: field, ei: 2.6, rough: 0.25 })
  );
  lip.position.set(0, bodyH + 0.012, d / 2 + 0.015);
  g.add(lip);

  g.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  return g;
}

export function build() {
  const scene = world(
    'radial-gradient(120% 92% at 50% 14%, #241438 0%, #3A1A38 34%, #6A2A30 64%, #C56B38 100%)',
    0x2B1424, 22, 80
  );
  stageLights(scene, {
    key: 2.25, amb: 0.72, sky: 0x8FC8FF, ground: 0x1A0D18,
    tint: 0xFFD8B8, rim: 0x5FB8FF, rimI: 1.15,
    shadowArea: 15, sun: [-7, 14, 8], rimPos: [8, 5, -7],
  });

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 220),
    std(0x2A141C, { rough: 0.52, metal: 0.18 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // haze rendah: pita tipis yang memantulkan warna jingga
  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 10),
    new THREE.MeshBasicMaterial({
      color: 0xE78A4A, transparent: true, opacity: 0.055,
      depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    })
  );
  haze.position.set(0, 1.1, -11);
  scene.add(haze);

  // ---------- sisa 10 tumpukan dari klip 2, redup di kiri-belakang ----------
  const trayWrap = new THREE.Group();
  trayWrap.position.set(-2.90, 0.02, -2.80);
  trayWrap.rotation.y = 0.28;
  trayWrap.scale.setScalar(0.44);
  scene.add(trayWrap);
  const trays = new TrayGrid({ cols: 5, rows: 2, spacing: 0.86, seed: 41 });
  trayWrap.add(trays.body, trays.fills);
  trays.body.material = trays.body.material.clone();
  trays.body.material.color.setHex(0xB56632);
  trays.body.material.emissive.setHex(0x3A1408);
  trays.body.material.emissiveIntensity = 0.45;
  trays.fills.material = trays.fills.material.clone();
  trays.fills.material.color.setHex(0x8A7A66);
  const sixty = labelPlane('Rp60 T', {
    w: 1.22, h: 0.40, bg: '#1C1018', fg: '#E8B56A', size: 0.52, radius: 22, pad: 0.08,
  });
  sixty.position.set(-2.90, 0.42, -1.86);
  sixty.rotation.y = 0.28;
  sixty.scale.setScalar(0.58);
  scene.add(sixty);

  // ---------- koin latar di lantai (redup, tersebar) ----------
  const floorCoins = new CoinField(24);
  floorCoins.addTo(scene);
  floorCoins.mesh.material = floorCoins.mesh.material.clone();
  floorCoins.mesh.material.color.setHex(0x9A651C);
  floorCoins.mesh.material.emissive.setHex(0x3A1E00);
  floorCoins.mesh.material.emissiveIntensity = 0.9;
  const rr = rng(909);
  for (let i = 0; i < 24; i++) {
    const a = rr() * Math.PI * 2;
    const rad = 3.1 + rr() * 4.4;
    floorCoins.set(
      i, Math.cos(a) * rad, 0.03, Math.sin(a) * rad,
      0.13 + rr() * 0.17, Math.PI / 2, rr() * 6.28, 0
    );
  }
  floorCoins.flush();

  // ---------- arus koin emas: 12 koin terang, menyatu ke peti ----------
  const coins = new CoinField(12);
  coins.addTo(scene);
  const cr = rng(303);
  const flow = [];
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1;
    flow.push({
      x0: side * (3.4 + cr() * 2.0),
      z0: -2.2 + cr() * 4.4,
      y0: 0.25 + cr() * 2.5,
      t0: 0.04 + i * 0.035,
      t1: 0.62 + i * 0.045,
      ph: cr() * 6.28,
    });
  }

  // ---------- peti besar 180T ----------
  const big = neonChest(PAL.gold, 3.0, 1.68, 1.75);
  big.position.set(0, 0, 0);
  scene.add(big);

  const bigLabel = labelPlane('180 T', {
    w: 1.48, h: 0.50, bg: '#1C1018', fg: '#FFD36A', size: 0.52, radius: 24, pad: 0.08,
    border: '#FFC93C',
  });
  bigLabel.position.set(0, 0.58, 0.90);
  big.add(bigLabel);

  const bigHalo = glow(0xFFC24A, 6.4, 0.58);
  bigHalo.position.set(0, 1.1, -1.2);
  scene.add(bigHalo);

  // ---------- 4 peti hasil belahan ----------
  const chests = FIELDS.map((f) => {
    const c = neonChest(f.color, CH_W, CH_H, CH_D);
    c.visible = false;
    scene.add(c);
    return c;
  });

  const smallLabels = FIELDS.map((f, i) => {
    const lp = labelPlane('45 T', {
      w: 0.86, h: 0.34, bg: '#1A1018', fg: f.css, size: 0.54, radius: 24, pad: 0.08,
      border: f.css,
    });
    lp.position.set(0, 0.38, CH_D / 2 + 0.012);
    chests[i].add(lp);
    return lp;
  });

  const icons = FIELDS.map((f) => {
    const ic = makeFieldIcon(f.kind, { color: f.color, s: 0.66 });
    ic.visible = false;
    scene.add(ic);
    return ic;
  });

  const chestGlow = FIELDS.map((f) => {
    const s = glow(f.glow, 2.7, 0.34);
    s.visible = false;
    scene.add(s);
    return s;
  });

  const ring = makeRing({ color: 0xFFC93C, r: 1, opacity: 0.6 });
  ring.position.y = 0.04;
  scene.add(ring);

  // ---------- kamera: crane turun -> orbit 30° -> pull-back ----------
  const cam = new Cam(makeCamera(34), { shake: 0 })
    .key(0.0, [0.0, 9.2, 18.6], [0.0, 0.9, 0.0], outCubic)
    .key(1.55, [0.0, 4.35, 12.7], [0.0, 1.0, 0.0], inOut)
    .key(2.70, [7.0, 7.0, 13.8], [0.0, 1.0, 0.0], inOut)
    .key(4.50, [0.95, 12.6, 15.4], [0.0, 0.42, 0.0], outCubic)
    .key(5.0, [0.95, 12.6, 15.4], [0.0, 0.42, 0.0], inOut);

  function update(t) {
    cam.apply(t);
    sixty.visible = t < 2.55;

    // ---------- overlay awal ----------
    ov.scrim('dark', 0.40 * clamp01((t - 0.05) / 0.4));
    ov.title('RP180 T DIBAGI RATA', {
      color: '#FFE2A8', p: clamp01((t - 0.10) / 0.30),
    });

    // ---------- arus koin ----------
    for (let i = 0; i < 12; i++) {
      const c = flow[i];
      if (t < c.t0) { coins.hide(i); continue; }
      const u = clamp01((t - c.t0) / (c.t1 - c.t0));
      const e = inOut(u);
      const x = lerp(c.x0, 0, e);
      const z = lerp(c.z0, 0, e);
      const y = lerp(c.y0, 0.95, e) + Math.sin(u * Math.PI) * 0.9;
      const s = 0.46 * (1.0 - 0.58 * e);
      coins.set(i, x, y, z, Math.max(0.001, s), 1.25, c.ph + t * 6.5, 0);
    }
    coins.flush();

    // ---------- peti besar: muncul, bergetar, pecah ----------
    const pop = Math.max(0, spring(clamp01((t - 0.55) / 0.46), 8.5, 6.2));
    const shakeT = seg(t, 1.30, SPLIT);
    const shake = 0.024 * shakeT * Math.sin(t * 88);
    const gone = seg(t, SPLIT - 0.02, SPLIT + 0.13);

    big.visible = t < SPLIT + 0.13;
    big.position.set(shake, 0.10 * Math.sin(Math.PI * clamp01((t - 0.55) / 0.55)) * (t < 1.2 ? 1 : 0), 0);
    big.rotation.y = 0.06 * Math.sin(t * 1.3) * (1 - shakeT);
    big.scale.setScalar(Math.max(0.001, pop * (1 - gone)));
    bigLabel.scale.setScalar(Math.max(0.001, 1 - seg(t, SPLIT - 0.02, SPLIT + 0.08)));
    bigHalo.material.opacity = 0.58 * pop * (1 - seg(t, SPLIT - 0.10, SPLIT + 0.16));
    bigHalo.scale.setScalar(5.4 + 0.5 * Math.sin(t * 2.2));

    // pecah: empat peti meluncur ke grid 2x2
    const su = clamp01((t - SPLIT) / 0.62);
    for (let i = 0; i < 4; i++) {
      const f = FIELDS[i];
      const c = chests[i];
      const hx = f.x;
      const hz = f.z;
      const startX = (i % 2 ? 0.72 : -0.72);
      const startZ = (i < 2 ? -0.42 : 0.42);

      let x = startX;
      let z = startZ;
      let y = 0.05;
      let sy = 1;
      let rot = 0;

      if (t >= SPLIT) {
        const ee = outCubic(su);
        x = lerp(startX, hx, ee);
        z = lerp(startZ, hz, ee);
        y = 0.62 * Math.sin(Math.PI * clamp01(su * 0.92));
        rot = 0.16 * Math.sin(su * Math.PI) * (i % 2 ? 1 : -1);
        if (t > LAND) {
          const d = t - LAND;
          const sq = Math.exp(-11 * d) * Math.cos(15 * d);
          sy = 1 - 0.14 * sq;
          y = 0;
        }
      }

      c.visible = t >= SPLIT;
      c.position.set(x, y, z);
      c.rotation.y = rot;
      c.scale.set(1, sy, 1);
      smallLabels[i].scale.setScalar(Math.max(0.001, clamp01((t - LAND - 0.02) / 0.20)));

      // ikon bidang di atas peti
      const iu = clamp01((t - 3.62 - i * 0.07) / 0.36);
      const is = Math.max(0, spring(iu, 9, 7));
      icons[i].visible = iu > 0;
      icons[i].scale.setScalar(Math.max(0.001, 0.78 * is));
      icons[i].position.set(f.x, 1.68 + 0.018 * Math.sin(t * 1.5 + i * 1.4), f.z);
      icons[i].rotation.y = 0;

      chestGlow[i].visible = t >= LAND;
      chestGlow[i].position.set(f.x, 0.55, f.z);
      chestGlow[i].material.opacity = 0.30 * clamp01((t - LAND) / 0.4);
      chestGlow[i].scale.setScalar(2.3 + 0.25 * Math.sin(t * 2.0 + i));
    }

    // kilatan retak
    const fl = seg(t, SPLIT - 0.02, SPLIT + 0.07) * (1 - seg(t, SPLIT + 0.07, SPLIT + 0.34));
    ov.flash('#FFF0C8', fl * 0.72);

    // gelombang retak
    const rp = clamp01((t - SPLIT) / 0.62);
    ring.visible = rp > 0 && rp < 1;
    if (ring.visible) {
      const rr2 = 0.55 + outCubic(rp) * 4.2;
      ring.scale.set(rr2, rr2, rr2);
      ring.material.opacity = 0.55 * (1 - rp);
    }

    // ---------- angka ----------
    const c1 = counter(t, 0.10, 1.80, 113, 180);
    if (t < 2.22) {
      const final = c1.done;
      ov.big((final ? 'Rp' : '') + num(c1.v) + (final ? ' T' : ''), {
        color: '#FFC93C', p: clamp01(t / 0.20), size: 164,
        sub: final ? 'triliun siap dialihkan' : 'triliun',
        subColor: 'rgba(255,231,190,0.62)',
      });
    } else {
      ov.big('Rp45 T × 4', {
        color: '#FFC93C', p: clamp01((t - 2.22) / 0.24), size: 150,
        sub: 'infrastruktur · kesehatan · publik · pendidikan',
        subColor: 'rgba(255,231,190,0.62)',
      });
    }

    ov.subs(t, SUBS);
  }

  return { scene, camera: cam.camera, update, duration };
}
