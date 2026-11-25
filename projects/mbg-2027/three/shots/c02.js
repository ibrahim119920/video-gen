// c02 — pemangkasan 75%: 30 dari 40 tumpukan dihapus, koin menyembur.
import * as THREE from '../vendor/three.module.js';
import {
  PAL, CSS, std, world, lights, makeCamera, Cam, ov, clamp01, lerp, seg,
  spring, outCubic, outBack, inOut, smooth, rng, num, shuffle,
} from '../lib.js';
import { TrayGrid, CoinField, makeRing } from '../props.js';

export const duration = 5.0;

const SUBS = [
  [0.0, 2.0, [['Anggap aja anggaran 2027 ', null], ['Rp240 triliun', CSS.orange], [',', null]]],
  [2.0, 5.0, [['kita pangkas ', null], ['75 persen', CSS.orange], ['.', null]]],
];

export function build() {
  const scene = world(
    'radial-gradient(130% 90% at 50% 18%, #FFFBF2 0%, #FFF3DC 48%, #F6E2C2 100%)',
    0xF4E0C2, 55, 160
  );
  lights(scene, { shadowArea: 14, sun: [-8, 15, 10] });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), std(0xF8E6C9, { rough: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new TrayGrid({ cols: 5, rows: 8, spacing: 1.20, seed: 41 });
  grid.addTo(scene);

  const coins = new CoinField(12);
  coins.addTo(scene);
  coins.mesh.receiveShadow = true;

  // ---- urutan penghapusan deterministik, 30 dari 40 ----
  const order = shuffle([...Array(40).keys()], 2027);
  const removed = order.slice(0, 30);
  const remaining = [...Array(40).keys()].filter((i) => !removed.includes(i));

  const remTime = new Map();
  removed.forEach((idx, k) => {
    remTime.set(idx, 0.60 + 3.00 * Math.pow(k / 29, 0.72));
  });

  // 10 sisa -> grid 2x5 rapi di tengah-bawah
  const target = new Map();
  remaining
    .slice()
    .sort((a, b) => grid.stacks[a].z - grid.stacks[b].z || grid.stacks[a].x - grid.stacks[b].x)
    .forEach((idx, n) => {
      const col = n % 5;
      const row = Math.floor(n / 5);
      target.set(idx, {
        x: (col - 2) * 1.20,
        z: 1.35 + row * 1.18,
      });
    });

  // ---- koin dekoratif: maksimal 12, rendah, jauh dari angka ----
  const r = rng(77);
  const coinStacks = removed
    .slice()
    .sort((a, b) => grid.stacks[b].z - grid.stacks[a].z)
    .slice(0, 12);
  const coinData = [];
  for (let n = 0; n < 12; n++) {
    const idx = coinStacks[n];
    const st = grid.stacks[idx];
    const a = (n / 12) * Math.PI * 2 + r() * 0.9;
    const sp = 0.30 + r() * 0.32;
    coinData.push({
      ox: st.x + Math.cos(a) * 0.16,
      oz: st.z + Math.sin(a) * 0.16,
      vx: Math.cos(a) * sp,
      vz: Math.sin(a) * sp,
      h: 0.45 + r() * 0.45,
      tr: remTime.get(idx) + 0.05,
      phase: r() * Math.PI * 2,
      spin: 4 + r() * 5,
    });
  }

  const cam = new Cam(makeCamera(34), { shake: 0 })
    .key(0.0, [0.6, 17.4, 25.2], [0.0, 0.75, 0.0], inOut)
    .key(3.6, [0.35, 16.6, 23.2], [0.0, 0.80, 0.0], inOut)
    .key(5.0, [0.55, 14.4, 22.0], [0.0, 3.15, 0.0], inOut);

  let lastCount = 240;
  let lastChange = -9;

  function update(t) {
    cam.apply(t);

    // berapa tumpukan sudah dihapus pada waktu t
    let gone = 0;
    for (let k = 0; k < 30; k++) {
      if (t >= 0.60 + 3.00 * Math.pow(k / 29, 0.72)) gone++;
    }
    const count = 240 - gone * 6;
    if (count !== lastCount) {
      lastCount = count;
      lastChange = t;
    }
    const roll = Math.exp(-(t - lastChange) * 22) * (t >= lastChange ? 1 : 0);

    grid.update((i, k, st) => {
      const tr = remTime.get(i);

      if (tr == null) {
        // tumpukan yang bertahan: geser ke formasi rapi
        const tg = target.get(i);
        const u = clamp01(spring((t - 3.55) / 0.55, 6.5, 6.0));
        const settle = Math.max(0, 1 - u);
        return {
          s: 1,
          dx: (tg.x - st.x) * Math.max(0, u),
          dz: (tg.z - st.z) * Math.max(0, u),
          dy: 0.10 * settle * Math.abs(Math.sin(t * 9 + st.phase)),
        };
      }

      const sq = Math.exp(-Math.pow((t - tr) / 0.085, 2));
      const vanishAt = tr + 0.03 + (4 - k) * 0.030;
      const s2 = 1 - seg(t, vanishAt, vanishAt + 0.13);
      if (s2 <= 0.001) return { s: 0 };
      const sy = s2 * (1 - 0.32 * sq);
      const sxz = s2 * (1 + 0.16 * sq);
      return { sx: sxz, sy, sz: sxz };
    });

    // koin
    for (let i = 0; i < 12; i++) {
      const cd = coinData[i];
      const d = t - cd.tr;
      if (d < 0) {
        coins.hide(i);
        continue;
      }
      const p = clamp01(d / 0.85);
      const hop = cd.h * Math.sin(Math.PI * p);
      const travel = Math.min(d, 0.8);
      const x = cd.ox + cd.vx * travel;
      const z = cd.oz + cd.vz * travel;
      const y = 0.06 + hop * (1 - 0.35 * p);
      const spin = cd.phase + d * cd.spin;
      coins.set(i, x, y, z, 0.62, Math.PI * 0.5 * Math.cos(spin * 0.6), spin, Math.PI * 0.5 * Math.sin(spin * 0.8));
    }
    coins.flush();

    // ---- overlay ----
    const blink = t < 0.62 ? 0.80 + 0.20 * Math.sin(t * 22) : 1;
    ov.title('SIMULASI 2027 · ANGGARAN MBG', { color: 'rgba(58,42,34,0.62)', p: clamp01(t / 0.3) });

    const col = gone > 0 ? CSS.orange : CSS.orange;
    ov.big('Rp' + num(count) + ' T', {
      color: col,
      p: blink,
      dy: -roll * 12,
      sub: t > 3.9 ? '' : gone > 0 ? 'dari Rp240 triliun' : 'anggaran MBG 2027',
      subColor: 'rgba(58,42,34,0.55)',
    });

    // badge −75%
    const bp = seg(t, 3.98, 4.18);
    if (bp > 0) {
      const sc = 0.55 + 0.55 * outBack(bp, 2.4) + 0.035 * Math.sin((t - 4.3) * 16) * seg(t, 4.3, 4.5);
      ov.badge('−75%', {
        color: CSS.orangeDeep, p: bp, scale: sc, rot: -5, top: 620, size: 150, strokeW: 6,
      });
    } else {
      ov.badge('', { p: 0 });
    }

    ov.subs(t, SUBS, { light: false });
  }

  return { scene, camera: cam.camera, update, duration };
}
