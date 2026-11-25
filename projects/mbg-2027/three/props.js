// props.js — aset reusable: ompreng, koin, peti, orang, rumah, bus, sekolah, dll.
import * as THREE from './vendor/three.module.js';
import {
  PAL, CSS, rbox, std, basic, mesh, group, makeInst, setInst, hideInst,
  rng, clamp01, lerp, seg, spring, outCubic, inOut,
} from './lib.js';

/* ======================= label ======================= */

export function labelTexture(text, {
  w = 512, h = 256, bg = '#FFF3DC', fg = '#3A2A22',
  font = 800, size = 0.46, border = null, radius = 40, pad = 0.06,
} = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  if (bg) {
    c.fillStyle = bg;
    c.beginPath();
    c.roundRect(pad * w, pad * h, w * (1 - pad * 2), h * (1 - pad * 2), radius);
    c.fill();
  }
  if (border) {
    c.strokeStyle = border;
    c.lineWidth = h * 0.045;
    c.beginPath();
    c.roundRect(pad * w + c.lineWidth / 2, pad * h + c.lineWidth / 2,
      w * (1 - pad * 2) - c.lineWidth, h * (1 - pad * 2) - c.lineWidth, radius);
    c.stroke();
  }
  c.fillStyle = fg;
  c.font = `${font} ${Math.round(h * size)}px Poppins, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, w / 2, h * 0.54);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function labelPlane(text, opts = {}) {
  const { w = 1.0, h = 0.4, ...rest } = opts;
  const tex = labelTexture(text, rest);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })
  );
  return m;
}

/* ======================= ompreng ======================= */

const TRAY_H = 0.15;
const TRAY_GAP = 0.014;
const TRAY_PITCH = TRAY_H + TRAY_GAP;
const TRAY_PER_STACK = 5;

export class TrayGrid {
  constructor({ cols = 5, rows = 8, spacing = 1.32, seed = 7 } = {}) {
    this.cols = cols;
    this.rows = rows;
    this.n = cols * rows;
    this.spacing = spacing;
    this.stacks = [];

    const r = rng(seed);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.stacks.push({
          x: (col - (cols - 1) / 2) * spacing + (r() - 0.5) * 0.05,
          z: (row - (rows - 1) / 2) * spacing + (r() - 0.5) * 0.05,
          rot: (r() - 0.5) * 0.2,
          phase: r() * Math.PI * 2,
          col, row,
        });
      }
    }

    const n = this.n * TRAY_PER_STACK;
    this.body = makeInst(rbox(1.04, TRAY_H, 1.04, 0.045, 2), std(PAL.orange, { rough: 0.72 }), n);
    this.fills = makeInst(rbox(0.355, 0.05, 0.355, 0.022, 2), std(0xffffff, { rough: 0.85 }), n * 4);
    this.body.receiveShadow = true;

    const cell = [PAL.trayCream, PAL.green, PAL.pink, PAL.green];
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < 4; k++) {
        c.setHex(cell[k]);
        this.fills.setColorAt(i * 4 + k, c);
      }
    }
    this.fills.instanceColor.needsUpdate = true;
  }

  addTo(scene) {
    scene.add(this.body);
    scene.add(this.fills);
    return this;
  }

  // fn(stackIndex, trayIndex, stack) -> { s, dy, dx, dz, ry }
  update(fn) {
    let bi = 0;
    let fi = 0;
    for (let i = 0; i < this.n; i++) {
      const st = this.stacks[i];
      for (let k = 0; k < TRAY_PER_STACK; k++) {
        const a = (fn && fn(i, k, st)) || {};
        const s = a.s == null ? 1 : a.s;
        const sx = a.sx == null ? s : a.sx;
        const sy = a.sy == null ? s : a.sy;
        const sz = a.sz == null ? s : a.sz;
        const y = (k * TRAY_PITCH + TRAY_H * 0.5) * sy + (a.dy || 0);
        const x = st.x + (a.dx || 0);
        const z = st.z + (a.dz || 0);
        const ry = st.rot + (a.ry || 0);
        setInst(this.body, bi++, x, y, z, sx, sy, sz, ry);
        for (let q = 0; q < 4; q++) {
          const ox = q % 2 ? 0.222 : -0.222;
          const oz = q < 2 ? -0.222 : 0.222;
          setInst(this.fills, fi++, x + ox * sx, y + 0.083 * sy, z + oz * sz, sx, sy, sz, ry);
        }
      }
    }
    this.body.instanceMatrix.needsUpdate = true;
    this.fills.instanceMatrix.needsUpdate = true;
  }
}

/* ======================= koin ======================= */

export class CoinField {
  constructor(count = 300) {
    this.n = count;
    const g = new THREE.CylinderGeometry(0.25, 0.25, 0.07, 18);
    this.mesh = makeInst(g, std(PAL.gold, {
      rough: 0.42, metal: 0.10, em: 0x3a2400, ei: 0.22,
    }), count);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;
  }

  addTo(scene) {
    scene.add(this.mesh);
    return this;
  }

  set(i, x, y, z, s = 1, rx = 0, ry = 0, rz = 0) {
    if (i < 0 || i >= this.n) return;
    setInst(this.mesh, i, x, y, z, s, s, s, ry, rx, rz);
  }

  hide(i) {
    hideInst(this.mesh, i);
  }

  flush() {
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/* ======================= peti ======================= */

export function makeChest({ w = 1.5, h = 1.0, d = 1.0, field = PAL.infra, label = '45 T', open = 0 } = {}) {
  const g = new THREE.Group();
  const bodyH = h * 0.60;
  const lidH = h * 0.34;

  const body = mesh(rbox(w, bodyH, d, 0.06), std(0xB27A4C, { rough: 0.9 }), [0, bodyH / 2, 0]);
  g.add(body);

  // pita emas vertikal
  for (const sx of [-1, 1]) {
    const band = mesh(rbox(w * 0.10, bodyH * 1.02, d + 0.02, 0.03), std(field, { rough: 0.55, em: field, ei: 0.12 }), [sx * w * 0.30, bodyH / 2, 0]);
    g.add(band);
  }

  // kunci
  const lock = mesh(rbox(w * 0.16, h * 0.16, 0.06, 0.02), std(PAL.gold, { rough: 0.4, metal: 0.2, em: 0x3a2600, ei: 0.4 }), [0, bodyH * 0.78, d / 2 + 0.02]);
  g.add(lock);

  // tutup, pivot di tepi belakang
  const lid = new THREE.Group();
  lid.position.set(0, bodyH, -d / 2);
  const lidMesh = mesh(rbox(w * 1.02, lidH, d, 0.10), std(0x8E5C36, { rough: 0.85 }), [0, lidH / 2, d / 2]);
  lid.add(lidMesh);
  for (const sx of [-1, 1]) {
    const band = mesh(rbox(w * 0.10, lidH * 1.02, d + 0.02, 0.03), std(field, { rough: 0.55, em: field, ei: 0.12 }), [sx * w * 0.30, lidH / 2, d / 2]);
    lid.add(band);
  }
  // alas emas di dalam peti, supaya bagian dalam terbaca saat tutup dibuka
  const inner = mesh(rbox(w * 0.9, 0.05, d * 0.84, 0.02), std(PAL.gold, {
    rough: 0.45, em: 0x6a4400, ei: 0.35,
  }), [0, bodyH * 0.94, 0]);
  g.add(inner);

  lid.rotation.x = -open * 1.72;
  g.add(lid);

  if (label) {
    const lp = labelPlane(label, {
      w: w * 0.52, h: h * 0.24, bg: '#FFF3DC', fg: '#' + field.toString(16).padStart(6, '0'),
      size: 0.58, radius: 30, pad: 0.10,
    });
    lp.position.set(0, bodyH * 0.42, d / 2 + 0.012);
    g.add(lp);
  }

  g.userData.lid = lid;
  g.userData.setOpen = (v) => { lid.rotation.x = -v * 1.72; };
  return g;
}

/* ======================= tanda tanya 3D ======================= */

export function makeQuestionMark({ color = PAL.gold, scale = 1 } = {}) {
  const g = new THREE.Group();
  const mat = std(color, { rough: 0.45, metal: 0.1, em: 0x6a4400, ei: 0.45 });
  const R = 0.46;
  const tube = 0.18;
  const cy = 0.60;
  const arcLen = Math.PI * 1.30;

  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(R, tube, 12, 34, arcLen),
    mat
  );
  arc.position.y = cy;
  g.add(arc);

  // ekor: dari ujung busur (kiri-bawah) turun ke tengah
  const ex = Math.cos(arcLen) * R;
  const ey = cy + Math.sin(arcLen) * R;
  const tx = 0.0;
  const ty = -0.24;
  const dx = tx - ex;
  const dy = ty - ey;
  const len = Math.hypot(dx, dy);
  const stem = new THREE.Mesh(
    new THREE.CapsuleGeometry(tube * 0.92, Math.max(0.02, len - tube * 1.84), 4, 10),
    mat
  );
  stem.position.set((ex + tx) / 2, (ey + ty) / 2, 0);
  stem.rotation.z = Math.atan2(-dx, dy);
  g.add(stem);

  const dot = new THREE.Mesh(new THREE.SphereGeometry(tube * 0.99, 16, 12), mat);
  dot.position.set(0.0, -0.58, 0);
  g.add(dot);

  g.scale.setScalar(scale);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ======================= orang ======================= */

export function makePerson({ shirt = PAL.infra, skin = PAL.skin, h = 1.0, arms = true } = {}) {
  const g = new THREE.Group();
  const s = h;
  const legMat = std(0x4a4550, { rough: 0.95 });
  const bodyMat = std(shirt, { rough: 0.9 });
  const skinMat = std(skin, { rough: 0.85 });

  for (const sx of [-1, 1]) {
    const leg = mesh(rbox(0.10 * s, 0.26 * s, 0.11 * s, 0.03), legMat, [sx * 0.07 * s, 0.13 * s, 0]);
    g.add(leg);
  }
  const body = mesh(new THREE.CapsuleGeometry(0.15 * s, 0.24 * s, 4, 10), bodyMat, [0, 0.42 * s, 0]);
  g.add(body);
  const head = mesh(new THREE.SphereGeometry(0.135 * s, 14, 10), skinMat, [0, 0.70 * s, 0]);
  g.add(head);

  if (arms) {
    for (const sx of [-1, 1]) {
      const arm = mesh(new THREE.CapsuleGeometry(0.045 * s, 0.22 * s, 3, 8), bodyMat, [sx * 0.17 * s, 0.44 * s, 0]);
      arm.rotation.z = sx * 0.22;
      g.add(arm);
    }
  }
  g.userData.head = head;
  return g;
}

// 2500 figur untuk klip 6
export class PeopleField {
  constructor({ count = 2500, cols = 50, rows = 50, spacing = 0.42, seed = 91, base = 0x9aa3a8 } = {}) {
    this.n = count;
    this.base = new THREE.Color(base);
    this.items = [];
    const r = rng(seed);
    const total = cols * rows;
    for (let i = 0; i < count; i++) {
      const cx = i % cols;
      const cz = Math.floor(i / cols) % rows;
      const jx = (r() - 0.5) * spacing * 0.55;
      const jz = (r() - 0.5) * spacing * 0.55;
      this.items.push({
        x: (cx - (cols - 1) / 2) * spacing + jx,
        z: (cz - (rows - 1) / 2) * spacing + jz,
        phase: r() * Math.PI * 2,
        delay: r() * 0.5,
      });
    }
    this.body = makeInst(new THREE.CapsuleGeometry(0.075, 0.16, 3, 6), std(0xffffff, { rough: 0.95 }), count);
    this.head = makeInst(new THREE.SphereGeometry(0.072, 8, 6), std(0xd9b08c, { rough: 0.9 }), count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.copy(this.base);
      this.body.setColorAt(i, c);
    }
    this.body.instanceColor.needsUpdate = true;
    this.body.frustumCulled = false;
    this.head.frustumCulled = false;
  }

  addTo(scene) {
    scene.add(this.body);
    scene.add(this.head);
    return this;
  }

  update(fn) {
    const c = new THREE.Color();
    for (let i = 0; i < this.n; i++) {
      const it = this.items[i];
      const a = (fn && fn(i, it)) || {};
      const s = a.s == null ? 1 : a.s;
      const y = (a.y || 0) + 0.20 * s;
      setInst(this.body, i, it.x, y, it.z, s, s, s, a.ry || 0);
      setInst(this.head, i, it.x, y + 0.255 * s, it.z, s, s, s, a.ry || 0);
      if (a.color) {
        c.copy(a.color);
        this.body.setColorAt(i, c);
      }
    }
    this.body.instanceMatrix.needsUpdate = true;
    this.head.instanceMatrix.needsUpdate = true;
    if (this.body.instanceColor) this.body.instanceColor.needsUpdate = true;
  }
}

/* ======================= pohon / bukit ======================= */

export function makeTree({ h = 1.6, kind = 'round', leaf = PAL.leaf } = {}) {
  const g = new THREE.Group();
  const trunkH = kind === 'palm' ? h * 0.82 : h * 0.42;
  const trunk = mesh(
    new THREE.CylinderGeometry(0.06 * h * 0.4, 0.09 * h * 0.4, trunkH, 7),
    std(PAL.woodDark, { rough: 0.95, flat: true }),
    [0, trunkH / 2, 0]
  );
  g.add(trunk);

  if (kind === 'palm') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const blade = mesh(new THREE.ConeGeometry(0.14 * h, h * 0.5, 4), std(leaf, { flat: true, rough: 0.9 }),
        [Math.cos(a) * h * 0.16, trunkH + h * 0.06, Math.sin(a) * h * 0.16]);
      blade.rotation.set(Math.PI * 0.34 * Math.cos(a), -a, Math.PI * 0.34 * Math.sin(a));
      g.add(blade);
    }
  } else {
    const r1 = h * 0.30;
    const c1 = mesh(new THREE.IcosahedronGeometry(r1, 0), std(leaf, { flat: true, rough: 0.9 }), [0, trunkH + r1 * 0.7, 0]);
    const c2 = mesh(new THREE.IcosahedronGeometry(r1 * 0.72, 0), std(PAL.leafDark, { flat: true, rough: 0.9 }), [r1 * 0.28, trunkH + r1 * 1.35, r1 * 0.1]);
    g.add(c1, c2);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function makeHill({ r = 4, h = 2.4, color = 0x9fb27a, seg = 7 } = {}) {
  const m = mesh(new THREE.ConeGeometry(r, h, seg), std(color, { flat: true, rough: 1 }), [0, h / 2 - 0.1, 0]);
  m.rotation.y = Math.random() * 0.1;
  return m;
}

/* ======================= rumah ======================= */

export function prismGeo(w, h, d) {
  const hw = w / 2;
  const hd = d / 2;
  const v = new Float32Array([
    -hw, 0, hd, hw, 0, hd, hw, h, 0,
    -hw, 0, hd, hw, h, 0, -hw, h, 0,
    hw, 0, -hd, -hw, 0, -hd, -hw, h, 0,
    hw, 0, -hd, -hw, h, 0, hw, h, 0,
    -hw, 0, -hd, -hw, 0, hd, -hw, h, 0,
    hw, 0, hd, hw, 0, -hd, hw, h, 0,
    -hw, 0, -hd, hw, 0, -hd, hw, 0, hd,
    -hw, 0, -hd, hw, 0, hd, -hw, 0, hd,
  ]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

export function makeHouse({
  w = 1.6, d = 1.5, h = 1.0, wall = 0xE8DCC0, roof = 0xB4553C,
  broken = false, lit = false, roofH = 0.55, flag = false,
} = {}) {
  const g = new THREE.Group();
  const body = mesh(rbox(w, h, d, 0.05), std(wall, { rough: 0.95 }), [0, h / 2, 0]);
  g.add(body);

  const rf = mesh(prismGeo(w * 1.12, roofH, d * 1.14), std(roof, { rough: 0.9, flat: true }), [0, h, 0]);
  if (broken) rf.rotation.z = 0.08;
  g.add(rf);

  // pintu + jendela
  const door = mesh(rbox(0.24, 0.44, 0.03, 0.02), std(0x6B4026, { rough: 0.9 }), [0, 0.22, d / 2 + 0.005]);
  g.add(door);
  for (const sx of [-1, 1]) {
    const win = mesh(rbox(0.22, 0.20, 0.03, 0.02),
      std(lit ? 0xFFD98A : 0x8FA7B0, { rough: 0.5, em: lit ? 0xFFB84D : 0x000000, ei: lit ? 0.7 : 0 }),
      [sx * w * 0.28, h * 0.62, d / 2 + 0.005]);
    g.add(win);
  }
  if (broken) {
    const patch = mesh(rbox(0.36, 0.05, 0.3, 0.01), std(0x3A3430, { rough: 1 }), [w * 0.18, h + roofH * 0.6, 0.1], 1, [0.1, 0.2, 0.12]);
    g.add(patch);
  }
  if (flag) {
    const pole = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), std(0xFFFFFF), [w * 0.36, h + roofH * 0.55, d * 0.3]);
    const cloth = mesh(rbox(0.16, 0.1, 0.01, 0.005), std(PAL.orange, { rough: 0.8 }), [w * 0.36 + 0.09, h + roofH * 0.55 + 0.2, d * 0.3]);
    g.add(pole, cloth);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ======================= sekolah ======================= */

export function makeSchool({ kind = 0, wall = 0xEFE3C8, roof = 0xC85A44, w = 3.4 } = {}) {
  const g = new THREE.Group();
  if (kind === 2) {
    const h1 = 1.1;
    const h2 = 1.0;
    const b1 = mesh(rbox(w, h1, 1.8, 0.05), std(wall, { rough: 0.95 }), [0, h1 / 2, 0]);
    const b2 = mesh(rbox(w * 0.72, h2, 1.5, 0.05), std(wall, { rough: 0.95 }), [w * 0.10, h1 + h2 / 2, -0.1]);
    const rf = mesh(rbox(w * 0.76, 0.12, 1.6, 0.03), std(roof, { rough: 0.9 }), [w * 0.10, h1 + h2 + 0.06, -0.1]);
    g.add(b1, b2, rf);
    for (let i = 0; i < 4; i++) {
      const win = mesh(rbox(0.34, 0.30, 0.04, 0.02), std(0x9FBFCC, { rough: 0.35, metal: 0.1 }), [-w * 0.36 + i * 0.62, h1 * 0.62, 0.91]);
      g.add(win);
      const win2 = mesh(rbox(0.30, 0.26, 0.04, 0.02), std(0x9FBFCC, { rough: 0.35, metal: 0.1 }), [-w * 0.16 + i * 0.45, h1 + h2 * 0.55, 0.66]);
      g.add(win2);
    }
  } else {
    const h = 1.25;
    const body = mesh(rbox(w, h, 1.8, 0.05), std(wall, { rough: 0.95 }), [0, h / 2, 0]);
    g.add(body);
    if (kind === 0) {
      const rf = mesh(prismGeo(w * 1.1, 0.85, 2.0), std(roof, { rough: 0.9, flat: true }), [0, h, 0]);
      g.add(rf);
    } else {
      const rf = mesh(rbox(w * 1.06, 0.14, 1.95, 0.03), std(roof, { rough: 0.9 }), [0, h + 0.07, 0]);
      g.add(rf);
    }
    for (let i = 0; i < 5; i++) {
      const win = mesh(rbox(0.32, 0.32, 0.04, 0.02), std(0x9FBFCC, { rough: 0.35, metal: 0.1 }), [-w * 0.38 + i * 0.6, h * 0.6, 0.91]);
      g.add(win);
    }
    const door = mesh(rbox(0.42, 0.7, 0.05, 0.02), std(0x7A4A2E, { rough: 0.9 }), [0, 0.35, 0.92]);
    g.add(door);
  }
  // papan nama
  const sign = labelPlane('SEKOLAH', { w: 1.1, h: 0.26, bg: '#FFF3DC', fg: '#3A6E4A', size: 0.44, radius: 20, pad: 0.08 });
  sign.position.set(0, 0.95, 0.94);
  g.add(sign);

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ======================= kendaraan ======================= */

export function makeBus({ color = PAL.public, w = 1.25, h = 1.35, len = 3.4 } = {}) {
  const g = new THREE.Group();
  const body = mesh(rbox(w, h, len, 0.16), std(color, { rough: 0.65 }), [0, h / 2 + 0.18, 0]);
  g.add(body);

  // jendela: pita gelap
  const band = mesh(rbox(w + 0.02, h * 0.34, len * 0.86, 0.10), std(0x1A2230, { rough: 0.35, em: 0x101820, ei: 0.4 }), [0, h * 0.68 + 0.18, 0]);
  g.add(band);
  // garis putih
  const stripe = mesh(rbox(w + 0.03, 0.07, len * 0.9, 0.02), std(0xFFF6E4, { rough: 0.7 }), [0, h * 0.28 + 0.18, 0]);
  g.add(stripe);

  const wheelG = new THREE.CylinderGeometry(0.20, 0.20, 0.12, 12);
  for (const sz of [-1, 1]) {
    for (const sx of [-1, 1]) {
      const wh = mesh(wheelG, std(0x24242A, { rough: 0.9 }), [sx * (w / 2 - 0.02), 0.19, sz * len * 0.31]);
      wh.rotation.z = Math.PI / 2;
      g.add(wh);
    }
  }
  // lampu
  const lamp = mesh(rbox(0.22, 0.10, 0.04, 0.02), std(0xFFF3C4, { em: 0xFFE08A, ei: 1.4 }), [0, 0.42, len / 2 + 0.01]);
  g.add(lamp);

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function makeCar({ color = 0x8E949B, brake = true } = {}) {
  const g = new THREE.Group();
  const body = mesh(rbox(1.0, 0.44, 1.9, 0.12), std(color, { rough: 0.7 }), [0, 0.42, 0]);
  const cab = mesh(rbox(0.86, 0.36, 0.9, 0.10), std(color, { rough: 0.7 }), [0, 0.74, -0.1]);
  g.add(body, cab);
  const glass = mesh(rbox(0.88, 0.22, 0.92, 0.08), std(0x2A3442, { rough: 0.3 }), [0, 0.78, -0.1]);
  g.add(glass);
  if (brake) {
    for (const sx of [-1, 1]) {
      const l = mesh(rbox(0.16, 0.09, 0.03, 0.01), std(0xFF3B24, { em: 0xFF2A10, ei: 1.6 }), [sx * 0.34, 0.48, -0.96]);
      g.add(l);
    }
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ======================= dekorasi kecil ======================= */

export function makeRing({ color = 0xFFFFFF, r = 1, opacity = 0.8, segs = 48 } = {}) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(r * 0.86, r, segs),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, toneMapped: false, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

export function sparkField(n = 60, color = PAL.gold, size = 0.07) {
  const g = new THREE.BoxGeometry(size, size, size);
  const m = makeInst(g, std(color, { rough: 0.5, em: color, ei: 0.25 }), n);
  return m;
}

export function makePin({ color = PAL.health, h = 0.8 } = {}) {
  const g = new THREE.Group();
  const cone = mesh(new THREE.ConeGeometry(0.20, 0.46, 12), std(color, { rough: 0.6 }), [0, 0.23, 0], 1, [Math.PI, 0, 0]);
  const ball = mesh(new THREE.SphereGeometry(0.24, 14, 10), std(color, { rough: 0.55 }), [0, 0.52, 0]);
  const crossA = mesh(rbox(0.30, 0.10, 0.05, 0.02), std(0xFFFFFF), [0, 0.54, 0.20]);
  const crossB = mesh(rbox(0.10, 0.30, 0.05, 0.02), std(0xFFFFFF), [0, 0.54, 0.20]);
  g.add(cone, ball, crossA, crossB);
  g.scale.setScalar(h / 0.8);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function makeHospital({ w = 1.4, h = 2.2, d = 1.4, color = 0xEFE6D2 } = {}) {
  const g = new THREE.Group();
  const body = mesh(rbox(w, h, d, 0.05), std(color, { rough: 0.9 }), [0, h / 2, 0]);
  g.add(body);
  for (let f = 0; f < 3; f++) {
    for (let i = 0; i < 3; i++) {
      const win = mesh(rbox(0.22, 0.20, 0.03, 0.01), std(0xBFD9E0, { rough: 0.3, metal: 0.15 }), [-w * 0.30 + i * w * 0.30, 0.45 + f * 0.6, d / 2 + 0.01]);
      g.add(win);
    }
  }
  const crossA = mesh(rbox(0.56, 0.16, 0.06, 0.02), std(0xE8453C, { em: 0x8a1410, ei: 0.25 }), [0, h + 0.10, 0]);
  const crossB = mesh(rbox(0.16, 0.56, 0.06, 0.02), std(0xE8453C, { em: 0x8a1410, ei: 0.25 }), [0, h + 0.10, 0]);
  g.add(crossA, crossB);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function makePuskesmas({ w = 1.0, h = 0.6, d = 0.9 } = {}) {
  const g = new THREE.Group();
  const body = mesh(rbox(w, h, d, 0.04), std(0xF2E9D6, { rough: 0.92 }), [0, h / 2, 0]);
  const roof = mesh(prismGeo(w * 1.12, 0.34, d * 1.12), std(PAL.health, { rough: 0.85, flat: true }), [0, h, 0]);
  const door = mesh(rbox(0.20, 0.30, 0.03, 0.01), std(0x8A6A4A), [0, 0.15, d / 2 + 0.01]);
  g.add(body, roof, door);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function makePedestal({ r = 1.5, h = 0.35, top = PAL.cream, side = 0xE6D2AE } = {}) {
  const g = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(r, r * 1.04, h, 40), std(side, { rough: 0.9 }), [0, h / 2, 0]);
  const disc = mesh(new THREE.CylinderGeometry(r * 0.94, r * 0.94, h * 0.28, 40), std(top, { rough: 0.9 }), [0, h + h * 0.12, 0]);
  g.add(base, disc);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ======================= ikon bidang ======================= */

export function makeFieldIcon(kind, { color = PAL.infra, s = 1 } = {}) {
  const g = new THREE.Group();
  const m = std(color, { rough: 0.6, em: color, ei: 0.18 });

  if (kind === 'road') {
    const slab = mesh(rbox(1.0, 0.10, 0.62, 0.04), std(PAL.asphalt, { rough: 0.95 }), [0, 0.05, 0]);
    g.add(slab);
    for (let i = 0; i < 3; i++) {
      const d = mesh(rbox(0.14, 0.02, 0.09, 0.01), std(0xFFF6E0, { em: 0xFFF0C8, ei: 0.3 }), [-0.30 + i * 0.30, 0.11, 0]);
      g.add(d);
    }
    for (const sx of [-1, 1]) {
      const post = mesh(rbox(0.05, 0.30, 0.05, 0.01), m, [sx * 0.52, 0.15, 0]);
      g.add(post);
    }
  } else if (kind === 'health') {
    const disc = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.10, 24), m, [0, 0.05, 0], 1, [Math.PI / 2, 0, 0]);
    g.add(disc);
    const a = mesh(rbox(0.42, 0.13, 0.06, 0.02), std(0xFFFFFF), [0, 0.35, 0.0]);
    const b = mesh(rbox(0.13, 0.42, 0.06, 0.02), std(0xFFFFFF), [0, 0.35, 0.0]);
    g.add(a, b);
  } else if (kind === 'public') {
    const body = mesh(rbox(0.86, 0.46, 0.40, 0.12), m, [0, 0.32, 0]);
    const glass = mesh(rbox(0.70, 0.20, 0.42, 0.07), std(0x241A44, { rough: 0.3 }), [0, 0.40, 0]);
    const stripe = mesh(rbox(0.88, 0.07, 0.42, 0.02), std(0xFFF6E4), [0, 0.18, 0]);
    const wheelG = new THREE.CylinderGeometry(0.09, 0.09, 0.10, 10);
    for (const sx of [-1, 1]) {
      const wh = mesh(wheelG, std(0x2A2430), [sx * 0.30, 0.09, 0.0], 1, [0, 0, Math.PI / 2]);
      g.add(wh);
    }
    const lamp = mesh(rbox(0.14, 0.06, 0.03, 0.01), std(0xFFE9A8, { em: 0xFFD060, ei: 1.2 }), [0.32, 0.28, 0.21]);
    g.add(body, glass, stripe, lamp);
  } else if (kind === 'edu') {
    const back = mesh(rbox(0.66, 0.80, 0.11, 0.03), m, [0, 0.40, -0.09]);
    const page = mesh(rbox(0.58, 0.72, 0.07, 0.02), std(0xFFF8E6), [0, 0.40, 0.005]);
    for (let i = 0; i < 3; i++) {
      const line = mesh(rbox(0.42, 0.035, 0.01, 0.005), std(0xD8CBB2), [0, 0.50 - i * 0.13, 0.045]);
      g.add(line);
    }
    const spine = mesh(rbox(0.10, 0.82, 0.15, 0.03), std(PAL.gold), [0.31, 0.40, 0.0]);
    g.add(back, page, spine);
  }
  g.scale.setScalar(s);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
