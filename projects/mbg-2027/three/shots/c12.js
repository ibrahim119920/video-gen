// c12 — penutup: empat peti 45T, 10 ompreng 60T, tanda tanya emas.
// Revisi 3: krem-hangat, orbit 40° -> push-in -> pull-back.
import * as THREE from '../vendor/three.module.js';
import {
  PAL, CSS, std, world, makeCamera, Cam, ov, glow, lights,
  clamp01, lerp, seg, spring, outCubic, outBack, inOut,
} from '../lib.js';
import {
  TrayGrid, makeChest, makeFieldIcon, makeQuestionMark, labelPlane, makeRing,
} from '../props.js';

export const duration = 5.0;

const SUBS = [
  [0.0, 2.5, [['Empat bidang, ', null], ['Rp180 triliun', CSS.orangeDeep], ['.', null]]],
  [2.5, 5.0, [['Menurutmu, ', null], ['mana yang paling dibutuhkan?', CSS.orangeDeep]]],
];

const PODS = [
  { x: -1.34, z: -1.02, color: PAL.infra, css: CSS.infra, kind: 'road' },
  { x: 1.34, z: -1.02, color: PAL.health, css: CSS.health, kind: 'health' },
  { x: -1.34, z: 1.02, color: PAL.public, css: CSS.public, kind: 'public' },
  { x: 1.34, z: 1.02, color: PAL.edu, css: CSS.edu, kind: 'edu' },
];

export function build() {
  const scene = world(
    'radial-gradient(125% 92% at 50% 26%, #FFFCF4 0%, #FFF3DC 52%, #F6DFBB 100%)',
    0xF4DFBE, 26, 90
  );
  lights(scene, { shadowArea: 10, sun: [-7, 14, 9] });
  const rim = new THREE.DirectionalLight(0xFFD7A0, 0.45);
  rim.position.set(8, 5, -8);
  scene.add(rim);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), std(0xF7E3C2, { rough: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ring = makeRing({ color: 0xE6C68C, r: 1, opacity: 0.35 });
  ring.position.y = 0.02;
  ring.scale.setScalar(3.2);
  scene.add(ring);

  // ---------- empat peti 45T ----------
  const chests = [];
  const icons = [];
  const auras = [];
  for (let i = 0; i < 4; i++) {
    const p = PODS[i];
    const c = makeChest({ w: 1.24, h: 0.92, d: 0.84, field: p.color, label: '45 T', open: 0 });
    c.position.set(p.x, 0, p.z);
    c.scale.setScalar(0.001);
    scene.add(c);
    chests.push(c);

    const ic = makeFieldIcon(p.kind, { color: p.color, s: 0.62 });
    ic.position.set(p.x, 1.80, p.z);
    ic.scale.setScalar(0.001);
    scene.add(ic);
    icons.push(ic);

    const au = glow(p.color, 2.6, 0.0);
    au.position.set(p.x, 0.45, p.z);
    scene.add(au);
    auras.push(au);
  }

  // ---------- 10 tumpuk ompreng 60T di tengah ----------
  const trayWrap = new THREE.Group();
  trayWrap.position.set(0, 0.02, 0.05);
  trayWrap.scale.setScalar(0.25);
  scene.add(trayWrap);
  const trays = new TrayGrid({ cols: 5, rows: 2, spacing: 1.18, seed: 1212 });
  trayWrap.add(trays.body, trays.fills);

  const sixty = labelPlane('Rp60 T', {
    w: 1.32, h: 0.42, bg: '#FFF6E2', fg: '#8A5A1E', size: 0.52, radius: 24, pad: 0.08,
    border: '#E2B868',
  });
  sixty.rotation.x = -Math.PI / 2.7;
  sixty.position.set(0, 0.56, 0.84);
  sixty.scale.setScalar(0.001);
  scene.add(sixty);

  // ---------- tanda tanya ----------
  const qm = makeQuestionMark({ scale: 0.88 });
  qm.position.set(0, 1.55, 0.10);
  qm.visible = false;
  scene.add(qm);
  const qmGlow = glow(0xFFC93C, 5.2, 0.0);
  qmGlow.position.set(0, 1.43, 0.0);
  scene.add(qmGlow);

  // ---------- kamera ----------
  const cam = new Cam(makeCamera(34), { shake: 0 })
    .key(0.0, [0.0, 6.4, 14.4], [0.0, 1.10, 0.0], outCubic)
    .key(2.0, [8.5, 7.5, 10.4], [0.0, 1.05, 0.0], inOut)
    .key(3.5, [1.2, 5.3, 11.3], [0.0, 1.00, 0.0], inOut)
    .key(4.45, [5.0, 6.8, 13.6], [0.0, 1.05, 0.0], outCubic)
    .key(5.0, [5.0, 6.8, 13.6], [0.0, 1.05, 0.0], inOut);

  function update(t) {
    cam.apply(t);

    // peti menyala satu per satu
    for (let i = 0; i < 4; i++) {
      const u = clamp01((t - 0.34 - i * 0.20) / 0.40);
      const s = Math.max(0, spring(u, 8.5, 6.2));
      chests[i].scale.setScalar(Math.max(0.001, s));
      chests[i].position.y = Math.max(0, 0.10 * Math.sin(Math.PI * Math.min(1, u)));
      icons[i].scale.setScalar(Math.max(0.001, 0.62 * s));
      icons[i].position.y = 1.80 + 0.018 * Math.sin(t * 1.6 + i);
      const pulse = t > 0.35 + i * 0.20 ? 0.24 + 0.10 * Math.sin((t - i * 0.2) * 3.2) : 0;
      auras[i].material.opacity = pulse * (1 - seg(t, 3.6, 4.0));
      auras[i].scale.setScalar(2.4 + 0.20 * Math.sin(t * 2.2 + i));
    }

    // ompreng
    const u = clamp01((t - 0.38) / 0.55);
    const ts = Math.max(0, spring(u, 8, 6));
    trayWrap.scale.setScalar(0.25 * Math.max(0.001, ts));
    trays.update((i, k) => {
      const a = clamp01((t - 0.42 - i * 0.025 - k * 0.012) / 0.30);
      return { s: Math.max(0, spring(a, 9, 7)) };
    });
    sixty.scale.setScalar(Math.max(0.001, 0.52 * clamp01((t - 0.95) / 0.30)));
    sixty.position.y = 0.56 + 0.02 * Math.sin(t * 2.2);

    // tanda tanya muncul dengan bloom, lalu bergoyang
    qm.visible = t > 3.44;
    qmGlow.visible = qm.visible;
    if (qm.visible) {
      const uq = clamp01((t - 3.44) / 0.32);
      const sq = Math.max(0, spring(uq, 8.5, 6.4));
      qm.position.y = 1.55;
      qm.scale.set(0.88 * sq, 0.88 * sq, 0.88 * sq);
      const tt = Math.min(t, 4.52);
      qm.rotation.z = t > 3.82 ? 0.11 * Math.sin((tt - 3.82) * 3.4) : 0;
      qm.rotation.y = 0.08 * Math.sin(tt * 1.1);
      qmGlow.position.set(0, 1.43, 0);
      qmGlow.material.opacity = 0.52 * clamp01((t - 3.52) / 0.24);
    } else {
      qmGlow.material.opacity = 0;
    }

    // ---------- overlay ----------
    ov.title('', { p: 0 });
    ov.big('Rp45 T × 4', {
      color: CSS.orange, p: clamp01((t - 0.10) / 0.30), size: 128,
    });
    ov.badge('MBG Rp60 T', {
      color: CSS.orangeDeep, p: clamp01((t - 0.34) / 0.28),
      scale: 0.94 + 0.06 * outBack(clamp01((t - 0.34) / 0.34), 2.0),
      top: 398, size: 82, strokeW: 0,
    });

    ov.subs(t, SUBS);

    ov.wipe(CSS.cream, clamp01(1 - t / 0.30), 'circle');
  }

  return { scene, camera: cam.camera, update, duration };
}
