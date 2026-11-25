// c10 — pendidikan: kuas raksasa mengecat ulang deret sekolah, pagi cerah.
import * as THREE from '../vendor/three.module.js';
import {
  PAL, CSS, std, mesh, rbox, world, lights, glow, makeCamera, Cam, ov, counter, num, setInst,
  clamp01, lerp, spring, outCubic, inOut, rng,
} from '../lib.js';
import { makeTree, makeHouse, makePerson, prismGeo } from '../props.js';

export const duration = 5.0;

const SUBS = [
  [0.0, 2.5, [['Rp45 triliun untuk ', null], ['pendidikan dan perumahan', CSS.eduDeep], ['.', null]]],
  [2.5, 5.0, [['Sekitar ', null], ['7.600 sekolah', CSS.eduDeep], [' bisa direvitalisasi.', null]]],
];

const SXP = [-1.85, 0.0, 1.85];
const SW = 1.55;
const SH = 1.80;
const ROOF_H = 0.62;

const NEWWALL = [0xFFC93C, 0x2F8FD8, 0xFFC93C];
const OLDWALL = 0x8B8983;
const OLDROOF = 0x6A6058;
const NEWROOF = 0xD2452F;
const OLDWIN = 0x39383A;
const NEWWIN = 0xA8E2F4;

export function build() {
  const scene = world(
    'linear-gradient(180deg, #1B539A 0%, #2F76B8 10%, #6FB6D8 20%, #F7E3B4 27%, #FFC47C 33%, #FF9E58 41%, #FF9550 100%)',
    0xF2CE96, 26, 88
  );
  lights(scene, {
    shadowArea: 24, sun: [-9, 14, 11],
    key: 1.75, hemi: 1.50, tint: 0xFFE8C4,
    hemiSky: 0xFFF6E2, hemiGround: 0xBFAE84,
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), std(0xA8C46E, { rough: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // jalan kecil di depan
  const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 9.0), std(0xDED0AC, { rough: 1 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.01, 7.2);
  road.receiveShadow = true;
  scene.add(road);

  const r = rng(1013);

  // ---------- latar: rumah & pohon ----------
  for (let i = 0; i < 10; i++) {
    const hx = -12 + i * 2.7 + (r() - 0.5) * 1.2;
    const hz = -8.5 - r() * 5.0;
    const hs = makeHouse({
      w: 1.3 + r() * 0.5, d: 1.2, h: 0.9 + r() * 0.5,
      wall: i % 3 === 0 ? 0xD9C9AA : 0xCBBBA0,
      roof: i % 2 ? 0xA65A44 : 0x96513E,
      lit: false,
    });
    hs.position.set(hx, 0, hz);
    hs.rotation.y = (r() - 0.5) * 0.25;
    hs.scale.setScalar(0.85 + r() * 0.25);
    scene.add(hs);
  }
  const TP = [
    [-3.4, -3.2, 2.3], [3.4, -3.4, 2.2], [-0.9, -4.6, 2.0], [2.4, -5.2, 1.9],
    [-5.2, -1.6, 2.1], [5.4, -1.8, 2.0],
  ];
  for (const [x, z, h] of TP) {
    const tr = makeTree({ h, kind: 'round', leaf: 0x74B24A });
    tr.position.set(x, 0, z);
    scene.add(tr);
  }

  // ---------- pagar ----------
  const fenceM = std(0xF2E7CD, { rough: 0.92 });
  const fenceTop = std(0xE0D2AE, { rough: 0.9 });
  for (const [x0, x1] of [[-4.9, 2.38], [3.72, 5.2]]) {
    const w = x1 - x0;
    const cx = (x0 + x1) / 2;
    for (const ry of [0.17, 0.36]) {
      scene.add(mesh(rbox(w, 0.06, 0.075, 0.02), fenceM, [cx, ry, 2.55]));
    }
    for (let px = x0 + 0.12; px < x1 - 0.08; px += 0.27) {
      scene.add(mesh(rbox(0.06, 0.44, 0.06, 0.015), fenceM, [px, 0.22, 2.55]));
    }
    for (let px = x0 + 0.06; px <= x1 - 0.05; px += 1.32) {
      scene.add(mesh(rbox(0.13, 0.50, 0.15, 0.02), fenceTop, [px, 0.25, 2.55]));
      scene.add(mesh(rbox(0.18, 0.06, 0.20, 0.015), fenceM, [px, 0.53, 2.55]));
    }
  }

  // ---------- 3 gedung sekolah ----------
  const schools = SXP.map((sx, i) => {
    const g = new THREE.Group();
    g.position.set(sx, 0, 0);

    const wallM = std(OLDWALL, { rough: 0.95 }).clone();
    const roofM = std(OLDROOF, { rough: 0.9, flat: true }).clone();
    const winM = std(OLDWIN, { rough: 0.4 }).clone();
    const trimM = std(0xB9B0A2, { rough: 0.9 }).clone();

    g.add(mesh(rbox(SW, SH, 1.0, 0.05), wallM, [0, SH / 2, 0]));
    // plint
    g.add(mesh(rbox(SW * 1.02, 0.16, 1.04, 0.03), trimM, [0, 0.08, 0]));
    // atap
    const roof = mesh(prismGeo(SW * 1.12, ROOF_H, 1.14), roofM, [0, SH, 0]);
    roof.rotation.z = (i % 2 ? -1 : 1) * 0.10;
    g.add(roof);
    // jendela
    for (const wx of [-0.46, 0.0, 0.46]) {
      g.add(mesh(rbox(0.28, 0.32, 0.04, 0.015), winM, [wx, 1.18, 0.51]));
      g.add(mesh(rbox(0.32, 0.36, 0.03, 0.015), trimM, [wx, 1.18, 0.495]));
    }
    // pintu
    const doorM = std(0x6B5A46, { rough: 0.9 }).clone();
    g.add(mesh(rbox(0.32, 0.60, 0.05, 0.02), doorM, [0, 0.42, 0.51]));
    g.add(mesh(rbox(0.40, 0.66, 0.03, 0.015), trimM, [0, 0.42, 0.495]));

    // kerusakan: noda bocor + retak + kaca pecah
    const dmgM = std(0x4A443E, { rough: 1 });
    const leak = new THREE.Group();
    leak.position.set(0.18, SH + 0.16, 0.62);
    leak.add(mesh(rbox(0.30, 0.30, 0.05, 0.01), dmgM, [0, 0, 0], 1, [0.25, 0, 0]));
    leak.add(mesh(rbox(0.10, 0.34, 0.04, 0.01), dmgM, [0.0, -0.34, -0.06]));
    g.add(leak);

    const cracks = [];
    for (const [cx, cy, cw, rot] of [[-0.58, 0.86, 0.34, 0.5], [0.56, 0.62, 0.28, -0.7]]) {
      const c = mesh(rbox(0.035, cw, 0.03, 0.008), dmgM, [cx, cy, 0.512], 1, [0, 0, rot]);
      g.add(c);
      cracks.push(c);
    }

    const broken = [];
    for (const wx of [-0.46, 0.46]) {
      const b = mesh(rbox(0.26, 0.30, 0.03, 0.008), std(0x2A2724, { rough: 1 }), [wx, 1.18, 0.532]);
      g.add(b);
      const cr = mesh(rbox(0.025, 0.24, 0.01, 0.004), std(0x9A948C, { rough: 0.9 }), [wx, 1.18, 0.545], 1, [0, 0, 0.7]);
      g.add(cr);
      broken.push(b, cr);
    }

    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(g);

    const gl = glow(0xFFD27A, 2.6, 0.0);
    gl.position.set(sx, 1.35, 0.9);
    scene.add(gl);

    return { g, wallM, roofM, winM, trimM, doorM, cracks, broken, leak, roof, gl };
  });

  // ---------- bendera ----------
  const poleG = new THREE.Group();
  poleG.position.set(-0.98, 0, 1.05);
  poleG.add(mesh(new THREE.CylinderGeometry(0.035, 0.045, 3.30, 8), std(0xEFE8DA, { rough: 0.5 }), [0, 1.65, 0]));
  poleG.add(mesh(new THREE.SphereGeometry(0.06, 10, 8), std(0xFFC93C, { rough: 0.4, metal: 0.3 }), [0, 3.33, 0]));
  const flag = new THREE.Group();
  flag.position.set(0.02, 0.95, 0);
  flag.add(mesh(rbox(0.52, 0.18, 0.025, 0.01), std(0xD6342E, { rough: 0.85 }), [0.28, 0.09, 0]));
  flag.add(mesh(rbox(0.52, 0.18, 0.025, 0.01), std(0xFFFDF6, { rough: 0.85 }), [0.28, -0.09, 0]));
  poleG.add(flag);
  scene.add(poleG);

  // ---------- gerbang ----------
  const gate = new THREE.Group();
  gate.position.set(3.05, 0, 2.55);
  const gM = std(0xEADFC6, { rough: 0.9 });
  const gTop = std(0xE8B94C, { rough: 0.65, em: 0x6A4400, ei: 0.18 });
  for (const gx of [-0.52, 0.52]) {
    gate.add(mesh(rbox(0.24, 0.98, 0.30, 0.04), gM, [gx, 0.49, 0]));
    gate.add(mesh(rbox(0.32, 0.09, 0.36, 0.03), gTop, [gx, 1.02, 0]));
  }
  gate.add(mesh(rbox(0.20, 0.26, 0.04, 0.015), gTop, [0.52, 0.66, 0.17]));
  gate.add(mesh(rbox(0.15, 0.19, 0.03, 0.01), std(0xFFF8E6, { rough: 0.85, em: 0x3A2A00, ei: 0.10 }), [0.52, 0.66, 0.20]));
  for (const s of [-1, 1]) {
    const leaf = new THREE.Group();
    leaf.position.set(s * 0.38, 0, 0);
    leaf.rotation.y = s * 1.05;
    leaf.add(mesh(rbox(0.56, 0.05, 0.05, 0.015), gM, [s * 0.30, 0.58, 0]));
    leaf.add(mesh(rbox(0.56, 0.05, 0.05, 0.015), gM, [s * 0.30, 0.16, 0]));
    for (const bx0 of [0.12, 0.30, 0.48]) {
      leaf.add(mesh(rbox(0.05, 0.46, 0.05, 0.012), gM, [s * bx0, 0.37, 0]));
    }
    gate.add(leaf);
  }
  gate.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(gate);

  // ---------- kuas raksasa ----------
  const brush = new THREE.Group();
  const bristleM = std(0xFFF1D4, { rough: 0.8 }).clone();
  brush.add(mesh(rbox(2.16, 0.50, 0.74, 0.10), bristleM, [0, 0.37, 0]));
  brush.add(mesh(rbox(2.02, 0.34, 0.70, 0.08), bristleM, [0, 0.18, 0]));
  brush.add(mesh(rbox(1.94, 0.22, 0.66, 0.06), std(0xFFC93C, { rough: 0.55, em: 0xE08A00, ei: 0.85 }), [0, 0.055, 0]));
  for (const gx of [-0.80, -0.40, 0, 0.40, 0.80]) {
    brush.add(mesh(rbox(0.06, 0.56, 0.02, 0.008), std(0xE0CFA8, { rough: 0.9 }), [gx, 0.36, 0.372]));
  }
  brush.add(mesh(rbox(1.76, 0.30, 0.62, 0.05), std(0xB8C0C6, { rough: 0.28, metal: 0.45 }), [0, 0.76, 0]));
  brush.add(mesh(rbox(1.84, 0.08, 0.66, 0.03), std(0x8E969C, { rough: 0.5 }), [0, 0.60, 0]));
  brush.add(mesh(new THREE.CylinderGeometry(0.11, 0.15, 2.30, 12), std(0x8A5230, { rough: 0.85 }), [0, 2.06, 0]));
  brush.add(mesh(rbox(0.30, 0.12, 0.30, 0.04), std(0x5E3A20, { rough: 0.9 }), [0, 3.24, 0]));
  brush.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  brush.visible = false;
  scene.add(brush);

  const brushGlow = glow(0xFFD98A, 3.0, 0.0);
  scene.add(brushGlow);

  // ---------- 6 murid ----------
  const KIDS = [];
  for (let i = 0; i < 6; i++) {
    KIDS.push({
      h: 0.52 + (i % 3) * 0.03,
      col: [0xE8E2D2, 0xE8E2D2, 0xDCD6C6][i % 3],
      x0: -2.55 + i * 0.55,
      z0: 1.35 + (i % 2) * 0.22,
      x1: 1.55 + (i % 3) * 0.28,
      z1: 0.95 + (i % 2) * 0.18,
      t0: 3.50 + (i % 4) * 0.07,
      sp: 2.5 + (i % 3) * 0.3,
    });
  }
  const kids = KIDS.map((k, i) => {
    const p = makePerson({ shirt: k.col, h: k.h });
    p.add(mesh(rbox(0.22 * k.h / 0.55, 0.12 * k.h / 0.55, 0.20 * k.h / 0.55, 0.03),
      std([0xD6342E, 0x2F6FBF, 0xE8B93C][i % 3], { rough: 0.9 }), [0, 0.30 * k.h / 0.55, 0]));
    p.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    p.scale.setScalar(0.001);
    scene.add(p);
    return p;
  });

  // ---------- konfeti kecil ----------
  const CONF_N = 20;
  const conf = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.055, 0.055, 0.012),
    std(0xFFC93C, { rough: 0.6, em: 0x8A5A00, ei: 0.3 }), CONF_N
  );
  conf.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  conf.frustumCulled = false;
  scene.add(conf);
  const CCOL = new THREE.Color();
  const CD = [];
  for (let i = 0; i < CONF_N; i++) {
    CD.push({
      a: (i / CONF_N) * Math.PI * 2 + r() * 0.4,
      rad: 0.15 + r() * 0.55,
      vy: 1.0 + r() * 1.1,
      sp: 5 + r() * 9,
      ph: r() * 6.28,
      d: r() * 0.25,
    });
    CCOL.setHex([0xFFC93C, 0xFFFFFF, 0xE2453C, 0x2F8FD8][i % 4]);
    conf.setColorAt(i, CCOL);
  }
  conf.instanceColor.needsUpdate = true;

  // ---------- kamera ----------
  const cam = new Cam(makeCamera(34), { shake: 0 })
    .key(0.00, [-0.55, 1.42, 17.9], [0.05, 1.30, 0], inOut)
    .key(1.20, [-0.95, 1.38, 17.1], [-0.05, 1.26, 0], inOut)
    .key(3.40, [0.85, 1.32, 16.5], [0.70, 1.20, 0], inOut)
    .key(3.95, [2.55, 1.70, 16.9], [0.95, 1.24, 0.25], inOut)
    .key(4.40, [5.30, 2.15, 18.0], [0.55, 1.32, 0.55], inOut)
    .key(5.00, [5.30, 2.15, 18.0], [0.55, 1.32, 0.55], inOut);

  function update(t) {
    cam.apply(t);

    // ---- kuas ----
    const enterU = outCubic(clamp01((t - 0.90) / 0.45));
    const sweepExit = outCubic(clamp01((t - 3.18) / 0.50));
    let bx;
    if (t < 1.35) {
      bx = lerp(-5.6, -2.60, enterU);
    } else {
      bx = lerp(-2.60, 3.55, clamp01((t - 1.35) / 1.83));
    }
    const by = 0.58 + sweepExit * 3.6;
    const bz = 1.02 - sweepExit * 0.5;
    brush.visible = t > 0.88 && sweepExit < 0.99;
    brush.position.set(bx, by, bz);
    brush.rotation.set(0.06, 0, 0.20 + 0.04 * Math.sin(t * 3.4));
    brushGlow.position.set(bx, by + 0.40, 0.90);
    brushGlow.material.opacity = 0.5 * enterU * (1 - sweepExit);

    // ---- sekolah ----
    for (let i = 0; i < 3; i++) {
      const s = schools[i];
      const left = SXP[i] - SW / 2;
      const raw = (bx - left) / SW;
      const p = clamp01(raw);

      // atap dulu, lalu dinding, lalu jendela
      const pr = clamp01(p / 0.55);
      const pw = clamp01((p - 0.20) / 0.65);
      const pn = clamp01((p - 0.50) / 0.50);

      s.roofM.color.setHex(OLDROOF).lerp(new THREE.Color(NEWROOF), pr);
      s.wallM.color.setHex(OLDWALL).lerp(new THREE.Color(NEWWALL[i]), pw);
      s.winM.color.setHex(OLDWIN).lerp(new THREE.Color(NEWWIN), pn);
      s.trimM.color.setHex(0xB9B0A2).lerp(new THREE.Color(0xFFF6E6), pw);
      s.doorM.color.setHex(0x6B5A46).lerp(new THREE.Color(0x8E5C36), pw);

      s.roof.rotation.z = (i % 2 ? -1 : 1) * 0.10 * (1 - pr);
      s.leak.scale.setScalar(Math.max(0.001, 1 - pr));
      for (const c of s.cracks) c.scale.setScalar(Math.max(0.001, 1 - pw));
      for (const b of s.broken) b.scale.setScalar(Math.max(0.001, 1 - pn));

      s.gl.material.opacity = 0.45 * pn;
    }

    // ---- bendera ----
    flag.position.y = lerp(0.90, 2.62, outCubic(clamp01((t - 2.45) / 0.85)));
    flag.rotation.y = 0.30 + 0.10 * Math.sin(Math.min(t, 4.40) * 2.4);

    // ---- murid ----
    for (let i = 0; i < 6; i++) {
      const k = KIDS[i];
      const g = kids[i];
      const dx = k.x1 - k.x0;
      const dz = k.z1 - k.z0;
      const len = Math.hypot(dx, dz);
      const dur = len / k.sp;
      const u = clamp01((t - k.t0) / dur);
      const born = clamp01((t - k.t0) / 0.22);
      const sc = Math.max(0.001, spring(born, 10, 7));
      const x = k.x0 + dx * u;
      const z = k.z0 + dz * u;
      const tf = Math.min(t, 4.35);
      const y = 0.055 * Math.abs(Math.sin(tf * 11 + i)) * (1 - u * 0.85);
      g.position.set(x, y, z);
      g.rotation.y = Math.atan2(dx, dz);
      g.scale.setScalar(sc);
    }

    // ---- konfeti (selesai sebelum 4,6) ----
    for (let i = 0; i < CONF_N; i++) {
      const c = CD[i];
      const t0 = 3.95 + c.d;
      const d = t - t0;
      if (d < 0 || d > 0.55) {
        setInst(conf, i, 0, -999, 0, 0.001, 0.001, 0.001);
        continue;
      }
      const x = 2.0 + Math.cos(c.a) * c.rad * (0.4 + d * 2.2);
      const z = 0.9 + Math.sin(c.a) * c.rad * (0.5 + d * 1.6);
      const y = 1.0 + c.vy * d - 2.2 * d * d;
      const s = Math.max(0.001, 1 - Math.max(0, d - 0.35) / 0.2);
      setInst(conf, i, x, y, z, s, s, s, c.ph + d * c.sp, d * c.sp * 0.7, d * c.sp * 0.4);
    }
    conf.instanceMatrix.needsUpdate = true;

    // ---- overlay ----
    ov.scrim('dark', 0.40);
    ov.title('PENDIDIKAN & PERUMAHAN · Rp45 T', { color: '#FFEBC2', p: clamp01((t - 0.10) / 0.28) });

    if (t < 0.42) {
      ov.big('', { p: 0 });
    } else {
      const c = counter(t, 0.50, 2.20, 1000, 7600);
      ov.big((c.done ? '±' : '') + num(c.v), {
        color: CSS.edu,
        p: clamp01((t - 0.42) / 0.22),
        size: 158,
        sub: c.done ? 'sekolah · direvitalisasi' : '',
        subColor: 'rgba(255,236,194,0.80)',
      });
    }

    ov.subs(t, SUBS);
  }

  return { scene, camera: cam.camera, update, duration };
}
