// c04 — infrastruktur: jalan rusak diperbaiki mesin pengaspal. Revisi 3:
// senja kontras, kamera drone -> tracking dolly -> crane reveal.
import * as THREE from '../vendor/three.module.js';
import {
  PAL, CSS, std, mesh, world, makeCamera, Cam, ov, counter, glow, stageLights,
  clamp01, lerp, seg, spring, outCubic, inOut, smooth, rng, num,
} from '../lib.js';
import { makeChest, makeTree } from '../props.js';

export const duration = 5.0;

const SUBS = [
  [0.0, 2.5, [['Rp45 triliun untuk ', null], ['infrastruktur', CSS.infraDeep], ['.', null]]],
  [2.5, 5.0, [['Sekitar ', null], ['3.600 kilometer', CSS.infraDeep], [' jalan rusak bisa diperbaiki.', null]]],
];

const ROAD_L = 92;
const ROAD_Z = 0;
const PAVER_T0 = 1.20;
const PAVER_T1 = 4.05;

function makePaver() {
  const g = new THREE.Group();
  const yellow = std(0xFFC21A, { rough: 0.52, em: 0x3A2600, ei: 0.55 });
  const yellowDark = std(0xE09A08, { rough: 0.62, em: 0x2A1800, ei: 0.35 });
  const metal = std(0x2C3038, { rough: 0.55, metal: 0.35 });
  const glass = std(0x16202C, { rough: 0.22, metal: 0.25, em: 0x2A4A66, ei: 0.35 });

  const body = mesh(new THREE.BoxGeometry(2.35, 0.74, 1.82), yellow, [0, 0.78, 0]);
  g.add(body);
  const hood = mesh(new THREE.BoxGeometry(0.85, 0.42, 1.72), yellowDark, [0.96, 1.16, 0]);
  g.add(hood);
  const cab = mesh(new THREE.BoxGeometry(0.92, 1.02, 1.52), yellow, [-0.68, 1.30, 0]);
  g.add(cab);
  const cabGlass = mesh(new THREE.BoxGeometry(0.04, 0.46, 1.30), glass, [0.49, 1.55, 0]);
  g.add(cabGlass);
  const sideGlass = mesh(new THREE.BoxGeometry(0.60, 0.42, 0.04), glass, [-0.72, 1.54, 0.77]);
  g.add(sideGlass);

  // hopper + screed di belakang (kiri)
  const hopper = mesh(new THREE.BoxGeometry(1.45, 0.60, 1.78), metal, [-1.28, 1.02, 0]);
  g.add(hopper);
  const screed = mesh(new THREE.BoxGeometry(1.05, 0.18, 2.10), std(0x59616C, { rough: 0.48, metal: 0.45 }), [-1.72, 0.28, 0]);
  g.add(screed);

  // roller depan
  const roller = mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.92, 16), std(0x20232A, { rough: 0.45, metal: 0.4 }), [1.42, 0.40, 0], 1, [Math.PI / 2, 0, 0]);
  g.add(roller);
  for (const sz of [-1, 1]) {
    const arm = mesh(new THREE.BoxGeometry(0.56, 0.14, 0.14), yellowDark, [1.18, 0.58, sz * 0.82]);
    g.add(arm);
  }

  // lampu depan
  for (const sz of [-1, 1]) {
    const lamp = mesh(new THREE.BoxGeometry(0.06, 0.18, 0.22), std(0xFFF2C0, { em: 0xFFC24A, ei: 2.4 }), [1.50, 0.92, sz * 0.58]);
    g.add(lamp);
    const gl = glow(0xFFC85A, 1.5, 0.55);
    gl.position.set(1.58, 0.92, sz * 0.58);
    g.add(gl);
  }

  // rotator
  const beacon = mesh(new THREE.CylinderGeometry(0.10, 0.12, 0.18, 10), std(0xFFD36A, { em: 0xFF9A10, ei: 2.2 }), [-0.50, 1.92, 0]);
  g.add(beacon);
  g.userData.beacon = beacon;
  const beaconGlow = glow(0xFFA01A, 1.4, 0.55);
  beaconGlow.position.set(-0.50, 1.96, 0);
  g.add(beaconGlow);

  // roda
  const wheelG = new THREE.CylinderGeometry(0.30, 0.30, 0.16, 12);
  for (const sx of [-0.65, 0.55]) {
    for (const sz of [-1, 1]) {
      const w = mesh(wheelG, std(0x17171C, { rough: 0.9 }), [sx, 0.30, sz * 0.92]);
      w.rotation.z = Math.PI / 2;
      g.add(w);
    }
  }

  g.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  return g;
}

export function build() {
  const scene = world(
    'linear-gradient(180deg, #141A3C 0%, #2A1D46 22%, #552A4E 40%, #8E3A48 54%, #D26A42 68%, #F6AE64 82%, #FFD89A 100%)',
    0x6A3B4A, 26, 105
  );
  stageLights(scene, {
    key: 1.75, amb: 0.88,
    sky: 0x7FA6D8, ground: 0x19141C,
    tint: 0xFFD0A8, rim: 0x74C8FF, rimI: 1.05,
    shadowArea: 22, shadowZ: -2, sun: [-12, 15, 9], rimPos: [9, 5, -9],
  });

  const r = rng(404);

  // ---------- tanah ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), std(0x2E3428, { rough: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  ground.receiveShadow = true;
  scene.add(ground);

  const verge = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_L + 12, 9.4), std(0x3B3A30, { rough: 1 }));
  verge.rotation.x = -Math.PI / 2;
  verge.position.set(0, 0.0, 0);
  verge.receiveShadow = true;
  scene.add(verge);

  // ---------- lapisan jauh: matahari, bukit + gedung ----------
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(2.4, 28),
    new THREE.MeshBasicMaterial({ color: 0xFFD08A, transparent: true, opacity: 0.95, toneMapped: false })
  );
  sun.position.set(-18, 4.6, -57);
  scene.add(sun);
  const sunGlow = glow(0xFFB060, 18, 0.42);
  sunGlow.position.set(-18, 4.6, -58);
  scene.add(sunGlow);

  for (let i = 0; i < 7; i++) {
    const h = new THREE.Mesh(
      new THREE.ConeGeometry(8 + r() * 9, 4 + r() * 6, 5),
      std(i % 2 ? 0x2C2338 : 0x3A2A42, { flat: true, rough: 1 })
    );
    h.position.set(-38 + i * 13 + r() * 4, 2.0, -64 - r() * 14);
    h.rotation.y = r() * 1.2;
    scene.add(h);
  }
  for (let i = 0; i < 8; i++) {
    const bh = 2.6 + r() * 3.6;
    const b = mesh(new THREE.BoxGeometry(2.6 + r() * 2.4, bh, 2.2), std(0x211A2C, { rough: 0.95 }), [-34 + i * 10, bh / 2, -46 - r() * 5]);
    scene.add(b);
    for (let k = 0; k < 3; k++) {
      for (let j = 0; j < 2; j++) {
        if (r() < 0.35) continue;
        const win = mesh(new THREE.BoxGeometry(0.22, 0.22, 0.03),
          std(0xFFB84D, { em: 0xFF9A2A, ei: 1.2, rough: 0.5 }),
          [b.position.x - 0.55 + j * 0.75, 0.9 + k * 0.95, b.position.z + 1.12]);
        scene.add(win);
      }
    }
  }

  // pohon gelap di tepi
  for (let i = 0; i < 9; i++) {
    const t = makeTree({ h: 1.8 + r() * 1.6, leaf: 0x34553A });
    t.position.set(-30 + i * 7 + r() * 2, 0, -8 - r() * 8);
    t.scale.setScalar(1.0);
    scene.add(t);
  }

  // tiang listrik + kabel
  const poleMat = std(0x241E22, { rough: 0.9 });
  const wirePts = [];
  for (let i = 0; i < 6; i++) {
    const x = -31 + i * 12.4;
    const pole = mesh(new THREE.CylinderGeometry(0.10, 0.14, 6.4, 6), poleMat, [x, 3.2, -11]);
    scene.add(pole);
    const cross = mesh(new THREE.BoxGeometry(1.5, 0.10, 0.10), poleMat, [x, 5.9, -11]);
    scene.add(cross);
    wirePts.push(new THREE.Vector3(x, 6.0, -11));
  }
  const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePts);
  const wire = new THREE.Line(wireGeo, new THREE.LineBasicMaterial({ color: 0x17151C, transparent: true, opacity: 0.7 }));
  scene.add(wire);

  // lampu jalan hangat
  for (let i = 0; i < 4; i++) {
    const x = -21 + i * 13;
    const p = mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.2, 6), poleMat, [x, 2.1, -5.6]);
    scene.add(p);
    const arm = mesh(new THREE.BoxGeometry(0.9, 0.07, 0.07), poleMat, [x + 0.40, 4.2, -5.6]);
    scene.add(arm);
    const lamp = mesh(new THREE.BoxGeometry(0.30, 0.10, 0.16), std(0xFFD98A, { em: 0xFFB23A, ei: 2.4 }), [x + 0.78, 4.12, -5.6]);
    scene.add(lamp);
    const gl = glow(0xFFB84A, 2.4, 0.40);
    gl.position.set(x + 0.78, 4.08, -5.55);
    scene.add(gl);
    const pl = new THREE.PointLight(0xFFA83A, 1.0, 10);
    pl.position.set(x + 0.78, 4.0, -5.0);
    scene.add(pl);
  }

  // ---------- jalan lama ----------
  const oldRoad = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_L, 7.6), std(0x5A5662, { rough: 1 }));
  oldRoad.rotation.x = -Math.PI / 2;
  oldRoad.position.set(0, 0.008, 0);
  oldRoad.receiveShadow = true;
  scene.add(oldRoad);

  // lubang besar
  const holeRim = std(0x74695E, { rough: 1 });
  const holeMat = std(0x0B0A0E, { rough: 1 });
  const holes = [
    [-16.0, -1.1, 1.10], [-13.3, 1.4, 0.95], [-9.2, -2.0, 1.30],
    [-5.4, 0.9, 0.82], [-1.0, -1.5, 1.15], [4.6, 1.8, 1.05],
    [8.9, -0.7, 1.25], [13.8, 1.2, 0.88], [18.0, -1.8, 1.35],
  ];
  for (const [x, z, s] of holes) {
    const rim = new THREE.Mesh(new THREE.CircleGeometry(1.0, 9), holeRim);
    rim.rotation.x = -Math.PI / 2;
    rim.scale.set(s * 1.30, s * 0.86, 1);
    rim.position.set(x, 0.018, z);
    scene.add(rim);
    const h = new THREE.Mesh(new THREE.CircleGeometry(1.0, 9), holeMat);
    h.rotation.x = -Math.PI / 2;
    h.scale.set(s * 1.08, s * 0.68, 1);
    h.position.set(x, 0.026, z);
    scene.add(h);
  }

  // retak
  for (let i = 0; i < 16; i++) {
    const x = -22 + i * 2.8 + r() * 1.4;
    const z = (r() - 0.5) * 6.0;
    const len = 0.6 + r() * 2.0;
    const c = mesh(new THREE.BoxGeometry(len, 0.012, 0.045), std(0x1B1920, { rough: 1 }), [x, 0.034, z]);
    c.rotation.y = (r() - 0.5) * 1.4;
    scene.add(c);
  }

  // ---------- aspal baru: satu mesh yang tumbuh ----------
  const newRoad = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.07, 6.95),
    std(0x101219, { rough: 0.30, metal: 0.32 })
  );
  newRoad.position.set(-ROAD_L / 2, 0.045, 0);
  newRoad.receiveShadow = true;
  newRoad.castShadow = false;
  scene.add(newRoad);

  const edgeGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.11, 6.85),
    std(0x78CCFF, { em: 0x56B8FF, ei: 2.6, rough: 0.3 })
  );
  edgeGlow.position.set(0, 0.10, 0);
  scene.add(edgeGlow);
  const edgeHalo = glow(0x75CCFF, 3.2, 0.55);
  edgeHalo.position.set(0, 0.35, 0);
  scene.add(edgeHalo);

  const sheen = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.006, 0.42),
    new THREE.MeshBasicMaterial({
      color: 0x4A8FC4, transparent: true, opacity: 0.22,
      depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    })
  );
  sheen.position.set(-ROAD_L / 2, 0.088, -1.55);
  scene.add(sheen);

  // marka putus-putus baru
  const dashes = [];
  for (let i = 0; i < 24; i++) {
    const d = mesh(new THREE.BoxGeometry(0.95, 0.022, 0.18),
      std(0xEAF8FF, { em: 0x9CDFFF, ei: 1.25, rough: 0.4 }),
      [-37 + i * 3.1, 0.095, 0]);
    d.receiveShadow = false;
    scene.add(d);
    dashes.push(d);
  }
  const edgeLines = [-3.05, 3.05].map((z) => {
    const l = mesh(new THREE.BoxGeometry(1, 0.022, 0.10),
      std(0xEAF8FF, { em: 0x8CD4FF, ei: 0.8, rough: 0.5 }), [-ROAD_L / 2, 0.095, z]);
    scene.add(l);
    return l;
  });

  // ---------- peti 45T jatuh di ujung kiri ----------
  const chest = makeChest({ w: 1.0, h: 0.72, d: 0.68, field: PAL.infra, label: '45 T', open: 0 });
  const CHEST_X = -12.4;
  chest.position.set(CHEST_X, 0.22, 0.4);
  chest.rotation.y = 0.35;
  scene.add(chest);
  const chestGlow = glow(0x63B8FF, 4.0, 0.5);
  chestGlow.position.set(CHEST_X, 0.8, 0.4);
  scene.add(chestGlow);
  const sparks = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const s = glow(i % 3 ? 0xFFD36A : 0x8CD8FF, 0.7, 0.6);
    s.position.set(CHEST_X, 0.7, 0.4);
    scene.add(s);
    sparks.push({ m: s, a, sp: 0.7 + (i % 4) * 0.25 });
  }

  // ---------- mesin pengaspal ----------
  const paver = makePaver();
  paver.position.set(-10, 0.02, 0);
  scene.add(paver);
  const headCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 3.4, 14, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xFFB64A, transparent: true, opacity: 0.10,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    })
  );
  headCone.rotation.z = -Math.PI / 2;
  headCone.position.set(2.8, 0.92, 0);
  paver.add(headCone);

  // truk kecil lewat di kejauhan
  const farTruck = new THREE.Group();
  farTruck.add(mesh(new THREE.BoxGeometry(1.4, 0.8, 2.4), std(0x3A2A3A, { rough: 0.9 }), [0, 0.55, 0]));
  farTruck.add(mesh(new THREE.BoxGeometry(1.2, 0.65, 0.8), std(0x4A3444, { rough: 0.9 }), [0, 1.25, 0.8]));
  farTruck.add(mesh(new THREE.BoxGeometry(0.20, 0.12, 0.03), std(0xFFD98A, { em: 0xFFB23A, ei: 1.8 }), [0, 0.8, -1.22]));
  farTruck.position.set(22, 0, -15);
  scene.add(farTruck);

  // ---------- kamera ----------
  const camera = makeCamera(34);

  const paverX = (t) => -10 + 22 * outCubic(clamp01((t - PAVER_T0) / (PAVER_T1 - PAVER_T0)));

  function update(t) {
    const px = paverX(t);
    const pOn = t >= PAVER_T0 - 0.01;
    paver.visible = pOn && t < 4.18;
    paver.position.x = px;
    paver.position.y = 0.02 + 0.015 * Math.sin(t * 15.0) * (pOn ? 1 : 0);

    // jalan baru tumbuh sampai screed
    const len = Math.max(0.001, px - 1.45 + ROAD_L / 2);
    newRoad.visible = pOn;
    edgeGlow.visible = pOn;
    edgeHalo.visible = pOn;
    newRoad.scale.x = len;
    newRoad.position.x = -ROAD_L / 2 + len / 2;
    edgeGlow.position.x = px - 1.36;
    edgeHalo.position.x = px - 1.32;
    edgeHalo.material.opacity = pOn ? 0.45 + 0.10 * Math.sin(t * 7.0) : 0;
    sheen.visible = pOn;
    sheen.scale.x = len;
    sheen.position.x = -ROAD_L / 2 + len / 2;

    for (const d of dashes) d.visible = pOn && d.position.x < px - 1.55;
    for (const l of edgeLines) {
      l.visible = pOn;
      l.scale.x = len;
      l.position.x = -ROAD_L / 2 + len / 2;
    }

    // peti: jatuh, pecah jadi cahaya
    const fall = clamp01((t - 0.04) / 0.34);
    let cy = lerp(5.4, 0.22, fall * fall);
    if (t > 0.38) cy += 0.30 * Math.exp(-9 * (t - 0.38)) * Math.abs(Math.sin(15 * (t - 0.38)));
    chest.position.y = cy;
    chest.rotation.y = 0.35 + t * 0.5;
    const shatter = clamp01((t - 0.66) / 0.30);
    chest.scale.setScalar(Math.max(0.001, 1 - shatter));
    chestGlow.position.set(CHEST_X, 0.55 + 0.15 * Math.sin(t * 5), 0.4);
    chestGlow.material.opacity = 0.55 * (1 - seg(t, 0.62, 1.22));

    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const u = clamp01((t - 0.66) / 0.70);
      s.m.visible = u > 0 && u < 1;
      if (!s.m.visible) continue;
      const rad = 0.3 + outCubic(u) * 2.4;
      s.m.position.set(
        CHEST_X + Math.cos(s.a) * rad,
        0.35 + Math.sin(u * Math.PI) * 1.8 + u * 0.4,
        0.4 + Math.sin(s.a) * rad * 0.55
      );
      s.m.scale.setScalar(0.7 * (1 - u));
      s.m.material.opacity = 0.65 * (1 - u);
    }

    // kamera: drone turun -> tracking -> crane reveal
    let cx, cyc, cz, lx, ly, lz;
    if (t < PAVER_T0) {
      const u = inOut(clamp01(t / PAVER_T0));
      cx = lerp(-20.0, -10.6, u);
      cyc = lerp(8.8, 5.5, u);
      cz = lerp(20.5, 19.0, u);
      lx = lerp(-13.4, -10.2, u);
      ly = lerp(1.2, 1.1, u);
      lz = 0;
    } else if (t < PAVER_T1) {
      const blend = inOut(clamp01((t - PAVER_T0) / 0.50));
      const trackX = px - 0.20;
      const trackY = 4.75;
      const trackZ = 20.2;
      const trackLX = px - 0.78;
      const trackLY = 1.05;
      // sambung dari posisi drone terakhir
      cx = lerp(-10.6, trackX, blend);
      cyc = lerp(5.5, trackY, blend);
      cz = lerp(19.0, trackZ, blend);
      lx = lerp(-10.2, trackLX, blend);
      ly = lerp(1.1, trackLY, blend);
      lz = 0;
    } else {
      const u = inOut(clamp01((t - PAVER_T1) / 0.50));
      const fromX = px - 0.20;
      const fromY = 4.75;
      const fromZ = 20.2;
      const fromLX = px - 0.78;
      const fromLY = 1.05;
      const toX = 11.5;
      const toY = 9.4;
      const toZ = 22.5;
      const toLX = -5.0;
      const toLY = 1.2;
      cx = lerp(fromX, toX, u);
      cyc = lerp(fromY, toY, u);
      cz = lerp(fromZ, toZ, u);
      lx = lerp(fromLX, toLX, u);
      ly = lerp(fromLY, toLY, u);
      lz = 0;
    }
    if (t > 4.50) {
      // frame akhir statis
      cx = 11.5; cyc = 9.4; cz = 22.5;
      lx = -5.0; ly = 1.2;
    }
    camera.position.set(cx, cyc, cz);
    camera.lookAt(lx, ly, lz);

    // animasi kecil mesin
    paver.userData.beacon.rotation.y = t * 8;

    // truk jauh
    farTruck.position.x = 22 - t * 5.0;
    farTruck.position.z = -15;

    // ---------- overlay ----------
    ov.scrim('dark', 0.44 * clamp01((t - 0.1) / 0.4));
    ov.title('INFRASTRUKTUR · Rp45 T', { color: '#A8D6FF', p: clamp01((t - 0.10) / 0.30) });

    const c = counter(t, 1.25, 1.80, 1200, 3600);
    ov.big((c.done ? '±' : '') + num(c.v) + ' km', {
      color: '#D8EEFF', p: clamp01((t - 1.05) / 0.28), size: 154,
      sub: c.done ? 'jalan rusak diperbaiki' : '',
      subColor: 'rgba(190,224,255,0.70)',
    });

    ov.subs(t, SUBS);
  }

  return { scene, camera, update, duration };
}
