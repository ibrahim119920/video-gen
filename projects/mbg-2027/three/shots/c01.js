// c01 — hook: 200 ompreng, Rp240 T, tanda tanya jatuh.
import * as THREE from '../vendor/three.module.js';
import {
  PAL, CSS, std, mesh, world, lights, makeCamera, Cam, ov, enterWipe,
  clamp01, lerp, seg, spring, outCubic, inOut, smooth, bump, rng, num,
} from '../lib.js';
import { TrayGrid, makeQuestionMark, makeRing } from '../props.js';

export const duration = 5.0;

const SUBS = [
  [0.0, 1.95, [['Bayangin kalau dana ', null], ['MBG', CSS.orange], [' dipangkas,', null]]],
  [1.95, 3.75, [['terus duitnya ', null], ['dialihin', CSS.orange], [' ke program lain.', null]]],
  [3.75, 5.0, [['Jadinya ', null], ['gimana?', CSS.orange]]],
];

export function build() {
  const scene = world(
    'radial-gradient(130% 90% at 50% 18%, #FFFBF2 0%, #FFF3DC 48%, #F6E2C2 100%)',
    0xF4E0C2, 55, 160
  );
  lights(scene, { shadowArea: 13, sun: [-8, 15, 10] });

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 260),
    std(0xF8E6C9, { rough: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // ---- 40 tumpukan, urutan sapuan diagonal ----
  const grid = new TrayGrid({ cols: 5, rows: 8, spacing: 1.20, seed: 41 });
  grid.addTo(scene);

  // sapuan diagonal: kiri-atas (jauh) -> kanan-bawah (dekat)
  const order = grid.stacks
    .map((s, i) => ({ i, k: s.col + s.row, tie: s.col * 0.6 + s.row * 0.13 }))
    .sort((a, b) => a.k - b.k || a.tie - b.tie);
  const tAppear = new Float32Array(grid.n);
  order.forEach((o) => {
    tAppear[o.i] = 0.02 + 1.95 * Math.pow(o.k / 11, 1.6) + o.tie * 0.012;
  });

  // ---- tanda tanya ----
  const qm = makeQuestionMark({ scale: 1.5 });
  qm.position.set(0, 1.95, 0.2);
  scene.add(qm);

  const wave = makeRing({ color: 0xE2C48E, r: 1, opacity: 0.5 });
  wave.position.y = 0.02;
  scene.add(wave);

  const cam = new Cam(makeCamera(34), { shake: 0.05 })
    .key(0.0, [0.0, 15.4, 6.2], [0.0, 0.05, 0.7], outCubic)
    .key(2.4, [0.0, 15.9, 22.2], [0.0, 0.55, 0.0], outCubic)
    .key(5.0, [0.6, 17.4, 25.2], [0.0, 0.75, 0.0], outCubic);

  const camera = cam.camera;
  const LAND = 3.6;

  function update(t) {
    enterWipe(CSS.cream, t, 0.34);
    cam.apply(t);

    // tumpukan
    grid.update((i, k, st) => {
      const t0 = tAppear[i];
      const S = spring((t - t0) / 0.42, 8.5, 6.2);
      const pk = clamp01(spring((t - t0 - 0.022 * k) / 0.20, 10, 8));
      let s = Math.max(0, S * pk);
      let dy = 0;
      let ry = 0;

      // gelombang "utuh dan banyak"
      const w = seg(t, 2.35, 2.75) * (1 - seg(t, 3.35, 3.6));
      if (w > 0) {
        const ph = st.col * 0.55 - st.row * 0.42;
        dy += 0.035 * w * Math.sin((t - 2.35) * 7.0 - ph * 2.2);
        ry += 0.05 * w * Math.sin((t - 2.35) * 6.0 - ph * 2.0);
      }

      // shockwave saat tanda tanya mendarat
      const r = Math.hypot(st.x, st.z);
      const hit = 3.62 + r * 0.035;
      if (t > hit) {
        const b = Math.exp(-9 * (t - hit)) * Math.sin(15 * (t - hit));
        dy += 0.075 * b;
        s *= 1 + 0.12 * b;
      }

      // keluar: tumpukan tetap, hanya tanda tanya yang hilang
      return { s, dy, ry };
    });

    // tanda tanya
    qm.visible = t >= 3.30;
    const fall = clamp01((t - 3.32) / 0.28);
    let qy = lerp(9.5, 1.95, fall * fall);
    let sy = 1;
    let sxz = 1;
    if (t > LAND) {
      const d = t - LAND;
      qy += 0.42 * Math.exp(-3.4 * d) * Math.abs(Math.sin(9.2 * d));
      const k = Math.exp(-13 * d);
      sy = 1 - 0.20 * k * Math.cos(9 * d);
      sxz = 1 + 0.13 * k * Math.cos(9 * d);
    }
    qm.position.y = qy;
    qm.scale.set(1.5 * sxz, 1.5 * sy, 1.5 * sxz);
    const sway = t > 3.95 ? 0.13 * Math.sin((t - 3.95) * 3.4) : 0;
    qm.rotation.z = sway;
    qm.rotation.y = 0.10 * Math.sin(t * 0.9);

    // shockwave ring
    const rp = clamp01((t - 3.58) / 0.75);
    wave.visible = rp > 0 && rp < 1;
    if (wave.visible) {
      const rr = 0.8 + outCubic(rp) * 7.5;
      wave.scale.set(rr, rr, rr);
      wave.material.opacity = 0.55 * (1 - rp);
    }

    // ---- overlay ----
    const titleP = clamp01((t - 0.12) / 0.35);
    ov.title('SIMULASI 2027 · ANGGARAN MBG', { color: 'rgba(58,42,34,0.62)', p: titleP });

    const cp = clamp01((t - 0.28) / 1.15);
    const val = 240 * outCubic(cp);
    ov.big('Rp' + num(val) + ' T', {
      color: CSS.orange,
      p: clamp01((t - 0.28) / 0.22),
      sub: 'anggaran MBG 2027',
      subColor: 'rgba(58,42,34,0.55)',
    });

    ov.subs(t, SUBS, { light: false });
  }

  return { scene, camera, update, duration };
}
