// c09 — subsidi tiket & ruang publik. Golden hour, tiket bercahaya -> trotoar -> perpustakaan.
import * as THREE from '../vendor/three.module.js';
import {
  PAL, CSS, std, mesh, rbox, world, stageLights, glow, makeCamera, Cam, ov,
  clamp01, lerp, seg, spring, outCubic, inOut, rng,
} from '../lib.js';
import { makeTree, makePerson, makeHouse, prismGeo, makeHill } from '../props.js';

export const duration = 5.0;

const SUBS = [
  [0.0, 2.5, [['Ditambah ', null], ['subsidi tiket', CSS.public], [',', null]]],
  [2.5, 5.0, 'Trotoar, taman kota, dan perpustakaan yang bisa dipakai semua orang.'],
];

function ticketGeo() {
  const a = 0.95, b = 0.56, r = 0.09, nr = 0.10;
  const s = new THREE.Shape();
  s.moveTo(-a + r, -b);
  s.lineTo(a - r, -b);
  s.quadraticCurveTo(a, -b, a, -b + r);
  s.lineTo(a, b - r);
  s.quadraticCurveTo(a, b, a - r, b);
  s.lineTo(-a + r, b);
  s.quadraticCurveTo(-a, b, -a, b - r);
  s.lineTo(-a, nr);
  s.quadraticCurveTo(-a + nr * 1.7, 0, -a, -nr);
  s.lineTo(-a, -b + r);
  s.quadraticCurveTo(-a, -b, -a + r, -b);
  return new THREE.ExtrudeGeometry(s, {
    depth: 0.07, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02,
    bevelSegments: 2, curveSegments: 12,
  });
}

export function build() {
  const scene = world(
    'linear-gradient(180deg, #38205A 0%, #783A6E 24%, #C05A66 50%, #FF9A5E 76%, #FFC98A 100%)',
    0xBE6F7E, 18, 62
  );
  stageLights(scene, {
    key: 2.15, amb: 1.00,
    sky: 0x8E9BE8, ground: 0x34203F,
    tint: 0xFFD2A0, rim: 0x86B0FF, rimI: 0.80,
    shadowArea: 18, sun: [-12, 11, 9],
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), std(0x66743C, { rough: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const r = rng(9031);

  // ---------- latar jauh: bukit & rumah siluet ----------
  for (let i = 0; i < 7; i++) {
    const hh = makeHill({
      r: 7 + r() * 6, h: 3 + r() * 3,
      color: i % 2 ? 0x3A2A52 : 0x33264A, seg: 5 + Math.floor(r() * 3),
    });
    hh.position.set(-30 + i * 10 + r() * 4, 0, -42 - r() * 14);
    scene.add(hh);
  }
  for (let i = 0; i < 9; i++) {
    const hx = -16 + (i % 9) * 4.0 + (r() - 0.5) * 1.4;
    const hz = -26 - Math.floor(r() * 9);
    const hs = makeHouse({
      w: 1.5 + r() * 0.6, d: 1.4, h: 0.9 + r() * 0.4,
      wall: i % 2 ? 0x3B2E52 : 0x46365E, roof: 0x2C2140, lit: false,
    });
    hs.position.set(hx, 0, hz);
    hs.scale.setScalar(0.9 + r() * 0.5);
    scene.add(hs);
  }

  // ---------- trotoar: karpet terang yang tergulung ----------
  const WALK_W = 3.0;
  const WALK_L = 20.4;
  const walk = new THREE.Group();
  walk.position.set(0, 0, 7.6);
  const wg = new THREE.PlaneGeometry(WALK_W, WALK_L);
  wg.rotateX(-Math.PI / 2);
  wg.translate(0, 0, -WALK_L / 2);
  const wm = new THREE.Mesh(wg, std(0xFFE4AE, { rough: 0.8, em: 0xFF9A2A, ei: 0.22 }));
  wm.receiveShadow = true;
  walk.add(wm);
  for (const sx of [-1, 1]) {
    walk.add(mesh(rbox(0.16, 0.12, WALK_L, 0.03), std(0xFFD79A, { rough: 0.7, em: 0x3A2200, ei: 0.10 }),
      [sx * 1.58, 0.06, -WALK_L / 2]));
  }
  for (let i = 1; i < 13; i++) {
    walk.add(mesh(rbox(2.9, 0.014, 0.06, 0.006), std(0xE9C88E, { rough: 0.9 }), [0, 0.010, -i * 1.65]));
  }
  walk.scale.z = 0.001;
  scene.add(walk);

  const roll = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16), std(0xFFD79A, { rough: 0.7, em: 0x3A2200, ei: 0.10 }));
  roll.rotation.z = Math.PI / 2;
  roll.castShadow = true;
  scene.add(roll);

  // ---------- 4 pohon (2 kiri, 2 kanan) ----------
  const TP = [
    [-2.35, -5.9, 2.25], [-2.60, -8.4, 2.55], [-2.40, -10.9, 2.30],
    [2.50, -7.4, 2.35],
  ];
  const trees = TP.map(([x, z, h]) => {
    const tr = makeTree({ h, kind: 'round', leaf: 0x7FD63C });
    tr.position.set(x, 0, z);
    tr.scale.setScalar(0.001);
    scene.add(tr);
    return tr;
  });

  // ---------- taman kecil: bangku + bunga warna-warni ----------
  const park = new THREE.Group();
  park.position.set(-2.05, 0, -7.35);
  const wood = std(0x9A5E34, { rough: 0.9 });
  park.add(mesh(rbox(0.95, 0.10, 0.34, 0.04), wood, [0, 0.42, 0]));
  park.add(mesh(rbox(0.95, 0.34, 0.09, 0.04), wood, [0, 0.60, -0.13]));
  for (const sx of [-1, 1]) {
    park.add(mesh(rbox(0.08, 0.42, 0.30, 0.02), std(0x5E3B22, { rough: 0.95 }), [sx * 0.36, 0.21, 0]));
  }
  park.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  park.scale.setScalar(0.001);
  scene.add(park);

  const blooms = new THREE.Group();
  const FLOW = [0xFFE04A, 0xFF7AA8, 0xA98CF0, 0xFFF4E0, 0xFF9A3C];
  for (let i = 0; i < 16; i++) {
    const bx = -1.95 - r() * 1.15;
    const bz = -5.5 - r() * 3.4;
    blooms.add(mesh(new THREE.IcosahedronGeometry(0.085 + r() * 0.03, 0), std(0x4E8A2A, { flat: true, rough: 0.95 }),
      [bx, 0.10, bz], [1, 0.8, 1]));
    blooms.add(mesh(new THREE.SphereGeometry(0.065, 6, 5), std(FLOW[i % 5], { rough: 0.7, em: FLOW[i % 5], ei: 0.18 }),
      [bx, 0.20, bz]));
  }
  blooms.scale.setScalar(0.001);
  scene.add(blooms);

  // ---------- perpustakaan (highlight reveal) ----------
  const lib = new THREE.Group();
  const LW = 3.0, LH = 2.9, LD = 2.1;
  lib.position.set(-1.55, -4.45, -13.6);
  lib.add(mesh(rbox(LW, LH, LD, 0.07), std(0xFFE2B0, { rough: 0.92 }), [0, LH / 2, 0]));
  lib.add(mesh(prismGeo(LW * 1.12, 0.85, LD * 1.12), std(0xD2543A, { rough: 0.85, flat: true }), [0, LH, 0]));
  // pintu & jendela menyala
  lib.add(mesh(rbox(0.62, 1.30, 0.07, 0.03), std(0x6B3E22, { rough: 0.9 }), [0, 0.65, LD / 2 + 0.02]));
  lib.add(mesh(rbox(0.34, 0.52, 0.04, 0.02), std(0xFFC46B, { em: 0xFFA030, ei: 1.5, rough: 0.5 }), [0, 0.95, LD / 2 + 0.06]));
  for (const sx of [-0.98, 0.98]) {
    lib.add(mesh(rbox(0.62, 0.74, 0.05, 0.03), std(0xFFCE84, { em: 0xFF9E2E, ei: 1.25, rough: 0.5 }), [sx, 1.80, LD / 2 + 0.03]));
    lib.add(mesh(rbox(0.72, 0.10, 0.09, 0.02), std(0xFFF0CF, { rough: 0.9 }), [sx, 1.40, LD / 2 + 0.03]));
  }
  for (const sx of [-0.58, 0.58]) {
    lib.add(mesh(rbox(0.28, 0.58, 0.05, 0.02), std(0x6B3E22, { rough: 0.9 }), [sx, 0.70, LD / 2 + 0.03]));
  }
  // tangga
  lib.add(mesh(rbox(1.4, 0.14, 0.40, 0.03), std(0xE8C894, { rough: 0.95 }), [0, 0.07, LD / 2 + 0.22]));
  lib.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(lib);

  const libGlow = glow(0xFFC46B, 4.4, 0.55);
  libGlow.position.set(-1.55, 1.2, -12.4);
  scene.add(libGlow);

  // ---------- lapangan olahraga ----------
  const court = new THREE.Group();
  court.position.set(1.45, 0, -12.3);
  const CL = 2.3;
  const cg = new THREE.PlaneGeometry(2.4, CL);
  cg.rotateX(-Math.PI / 2);
  cg.translate(0, 0, -CL / 2);
  const cf = new THREE.Mesh(cg, std(0x2E8F82, { rough: 0.95 }));
  cf.receiveShadow = true;
  court.add(cf);
  const lineM = std(0xFFEFD0, { rough: 0.8, em: 0x3A2E10, ei: 0.10 });
  court.add(mesh(rbox(2.4, 0.02, 0.06, 0.005), lineM, [0, 0.014, -0.04]));
  court.add(mesh(rbox(2.4, 0.02, 0.06, 0.005), lineM, [0, 0.014, -CL + 0.04]));
  for (const sx of [-1, 1]) {
    court.add(mesh(rbox(0.06, 0.02, CL, 0.005), lineM, [sx * 1.17, 0.014, -CL / 2]));
  }
  const cc = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.40, 28), lineM);
  cc.rotation.x = -Math.PI / 2;
  cc.position.set(0, 0.016, -CL / 2);
  court.add(cc);
  // ring
  const hoop = new THREE.Group();
  hoop.position.set(0, 0, 0.18);
  hoop.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.3, 8), std(0x4E4A46, { rough: 0.6 }), [0, 1.15, -0.14]));
  hoop.add(mesh(rbox(0.86, 0.58, 0.08, 0.03), std(0xFFF7E8, { rough: 0.6, em: 0x2A2418, ei: 0.10 }), [0, 2.16, -0.09]));
  hoop.add(mesh(rbox(0.80, 0.035, 0.10, 0.01), std(0xE2453C, { rough: 0.6 }), [0, 1.95, -0.03]));
  hoop.add(mesh(rbox(0.035, 0.36, 0.10, 0.01), std(0xE2453C, { rough: 0.6 }), [0, 2.07, -0.03]));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.028, 8, 20), std(0xF07A2A, { rough: 0.45, metal: 0.25 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 1.72, 0.14);
  hoop.add(rim);
  hoop.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  court.add(hoop);
  court.scale.z = 0.001;
  scene.add(court);

  // ---------- lampu taman ----------
  const lampPos = [[-2.35, -9.6], [2.55, -10.2]];
  const lampGlows = [];
  const lamps = lampPos.map(([x, z]) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.5, 8), std(0x3E3A40, { rough: 0.8 }), [0, 1.25, 0]));
    g.add(mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.30, 8), std(0xFFD98A, { em: 0xFFB43C, ei: 1.8, rough: 0.5 }), [0, 2.62, 0]));
    g.add(mesh(new THREE.ConeGeometry(0.30, 0.16, 8), std(0x3E3A40, { rough: 0.8 }), [0, 2.84, 0]));
    scene.add(g);
    const gl = glow(0xFFC86B, 1.9, 0.0);
    gl.position.set(x, 2.66, z);
    scene.add(gl);
    lampGlows.push(gl);
    g.scale.setScalar(0.001);
    return g;
  });

  // ---------- 3 orang kecil ----------
  const PPL = [
    { x: -0.85, z: -11.3, h: 1.0, col: 0xE7C46A, t0: 3.75 },
    { x: 0.15, z: -11.9, h: 1.05, col: 0xC85A8A, t0: 3.9 },
    { x: 1.15, z: -10.8, h: 0.95, col: 0x6FA8D8, t0: 4.05 },
  ];
  const people = PPL.map((p) => {
    const g = makePerson({ shirt: p.col, h: p.h });
    g.position.set(p.x, 0, p.z);
    g.rotation.y = -0.35 + r() * 0.5;
    g.scale.setScalar(0.001);
    scene.add(g);
    return g;
  });

  // ---------- tiket (highlight beat 1) ----------
  const ticket = new THREE.Group();
  ticket.position.set(0, 1.72, 0);
  const card = new THREE.Mesh(ticketGeo(), std(0xF6EEFF, { rough: 0.72, em: 0x8A5AE0, ei: 0.26 }));
  ticket.add(card);

  ticket.add(mesh(rbox(1.32, 0.14, 0.04, 0.03), std(0x7B5CD6, { rough: 0.6, em: 0x4A22B0, ei: 0.55 }),
    [-0.06, 0.40, 0.088]));
  // blok harga lama
  const price = new THREE.Group();
  price.position.set(-0.14, 0.00, 0.088);
  price.add(mesh(rbox(0.92, 0.24, 0.05, 0.03), std(0x3E3350, { rough: 0.8 }), [0, 0.04, 0]));
  price.add(mesh(rbox(0.48, 0.08, 0.05, 0.02), std(0x7A6E90, { rough: 0.8 }), [-0.20, -0.21, 0]));
  ticket.add(price);
  // coret merah
  const strikeG = new THREE.Group();
  strikeG.position.set(-0.60, 0.03, 0.118);
  strikeG.add(mesh(rbox(1.00, 0.06, 0.04, 0.02), std(0xE2453C, { rough: 0.5, em: 0x8A1008, ei: 0.5 }), [0.50, 0, 0]));
  strikeG.scale.x = 0.001;
  ticket.add(strikeG);
  // panah turun hijau menyala
  const arrow = new THREE.Group();
  arrow.position.set(-0.14, -0.02, 0.12);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.07, 26),
    std(0x7B5CD6, { rough: 0.5, em: 0x4A22B0, ei: 0.6 }));
  disc.rotation.x = Math.PI / 2;
  arrow.add(disc);
  arrow.add(mesh(rbox(0.10, 0.25, 0.05, 0.02), std(0x2FD07A, { em: 0x18B860, ei: 1.2, rough: 0.4 }), [0, 0.06, 0.05]));
  arrow.add(mesh(new THREE.ConeGeometry(0.18, 0.24, 4), std(0x2FD07A, { em: 0x18B860, ei: 1.2, rough: 0.4 }),
    [0, -0.13, 0.05], 1, [0, Math.PI / 4, Math.PI]));
  arrow.scale.setScalar(0.001);
  ticket.add(arrow);
  const arrowGlow = glow(0x4AFF9E, 1.5, 0.0);
  arrowGlow.position.set(0, 0, 0.3);
  arrow.add(arrowGlow);
  // perforasi
  for (let i = 0; i < 7; i++) {
    ticket.add(mesh(rbox(0.02, 0.06, 0.03, 0.008), std(0xC9B8E4, { rough: 0.9 }), [0.60, 0.39 - i * 0.13, 0.088]));
  }
  const ticketGlow = glow(0xB98CFF, 3.6, 0.45);
  ticketGlow.position.set(0, 0, -0.5);
  ticket.add(ticketGlow);
  ticket.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  ticket.scale.setScalar(0.001);
  scene.add(ticket);

  // ---------- kamera: push-in -> tracking -> crane+orbit ----------
  const cam = new Cam(makeCamera(34), { shake: 0 })
    .key(0.00, [0.00, 1.74, 11.6], [0.00, 1.72, 0.0], outCubic)
    .key(1.20, [0.00, 1.70, 8.9], [0.00, 1.70, 0.0], inOut)
    .key(1.60, [0.00, 1.46, 8.4], [0.00, 1.32, -3.0], inOut)
    .key(3.50, [0.10, 1.04, 4.4], [0.05, 1.06, -7.0], inOut)
    .key(3.95, [0.90, 1.88, 6.8], [-0.20, 1.36, -10.6], inOut)
    .key(4.40, [1.80, 2.60, 8.6], [-0.20, 1.60, -13.0], inOut)
    .key(5.00, [1.80, 2.60, 8.6], [-0.20, 1.60, -13.0], inOut);

  function update(t) {
    cam.apply(t);

    // ---- trotoar tergulung ----
    const up = clamp01((t - 1.22) / 0.85);
    const ue = outCubic(up);
    walk.visible = up > 0.001;
    walk.scale.z = Math.max(0.001, ue);
    const lead = 7.6 - WALK_L * ue;
    roll.visible = up > 0.004 && up < 0.996;
    const rr = Math.max(0.02, 0.17 * (1 - 0.62 * ue));
    roll.position.set(0, rr, lead);
    roll.scale.set(rr, WALK_W, rr);

    // ---- pohon pop ----
    for (let i = 0; i < trees.length; i++) {
      const s = Math.max(0.001, spring(clamp01((t - 2.02 - i * 0.14) / 0.48), 8, 6));
      trees[i].scale.setScalar(s);
    }

    // ---- taman mekar ----
    park.scale.setScalar(Math.max(0.001, spring(clamp01((t - 2.42) / 0.5), 7, 5)));
    blooms.scale.setScalar(Math.max(0.001, spring(clamp01((t - 2.55) / 0.55), 8, 6)));

    // ---- lapangan & perpustakaan ----
    const cp = clamp01((t - 3.10) / 0.75);
    court.scale.z = Math.max(0.001, outCubic(cp));
    court.visible = cp > 0.001;
    const lp = clamp01((t - 3.30) / 0.95);
    lib.position.y = lerp(-4.45, 0, spring(lp, 6.0, 5.2) * 0.55 + outCubic(lp) * 0.45);
    libGlow.material.opacity = 0.55 * outCubic(clamp01((t - 3.9) / 0.5));

    const lk = clamp01((t - 3.55) / 0.55);
    for (let i = 0; i < lamps.length; i++) {
      lamps[i].scale.setScalar(Math.max(0.001, spring(clamp01((t - 3.55 - i * 0.1) / 0.5), 7, 5)));
      lampGlows[i].material.opacity = 0.75 * clamp01((t - 3.62 - i * 0.1) / 0.4);
    }

    // ---- orang ----
    for (let i = 0; i < people.length; i++) {
      const p = PPL[i];
      const s = Math.max(0.001, spring(clamp01((t - p.t0) / 0.35), 9, 6));
      people[i].scale.setScalar(s);
    }

    // ---- tiket ----
    const inU = clamp01(t / 0.28);
    let scl = Math.max(0.001, spring(inU, 9, 6));
    const toCorner = clamp01((t - 1.18) / 0.62);
    const ce = outCubic(toCorner);
    const fade = 1 - clamp01((t - 1.86) / 0.30);
    const tx = lerp(0, -0.95, ce);
    const ty = lerp(1.72, 2.78, ce);
    const tz = lerp(0, -0.2, ce);
    scl *= lerp(1, 0.20, ce);
    ticket.visible = fade > 0.02;
    ticket.scale.setScalar(Math.max(0.001, scl * fade));
    ticket.position.set(tx, ty, tz);
    ticket.rotation.set(0.10, -0.16 - 0.5 * ce, 0);

    const ps = Math.max(0.001, spring(clamp01((t - 0.14) / 0.28), 10, 7));
    const shrink = 1 - clamp01((t - 0.62) / 0.20);
    price.scale.setScalar(Math.max(0.001, ps * shrink));
    strikeG.scale.x = Math.max(0.001, outCubic(clamp01((t - 0.30) / 0.24)));
    strikeG.visible = t > 0.28 && t < 0.72;
    const ap = Math.max(0.001, spring(clamp01((t - 0.58) / 0.30), 10, 6));
    arrow.scale.setScalar(Math.max(0.001, ap));
    arrowGlow.material.opacity = 0.85 * ap * (0.75 + 0.25 * Math.sin(t * 6.0));

    // ---- overlay ----
    ov.scrim('dark', 0.42);
    ov.title('PELAYANAN PUBLIK · Rp45 T', { color: '#FFE9C4', p: clamp01((t - 0.10) / 0.28) });
    ov.big('', { p: 0 });
    ov.subs(t, SUBS);
  }

  return { scene, camera: cam.camera, update, duration };
}
