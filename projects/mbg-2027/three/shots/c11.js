// c11 — perumahan: gelombang perbaikan kampung + 10 rumah baru.
// Revisi 3: senja jenuh, drone -> orbit ke lahan baru, tanpa wipe keluar.
import * as THREE from '../vendor/three.module.js';
import {
  PAL, CSS, std, basic, mesh, world, makeCamera, Cam, ov, counter, glow, stageLights,
  clamp01, lerp, seg, spring, outCubic, outBack, inOut, rng, num,
} from '../lib.js';
import { makeHouse, makeTree, makePerson, prismGeo } from '../props.js';

export const duration = 5.0;

const SUBS = [
  [0.0, 2.5, [['Sekitar ', null], ['750 ribu', CSS.eduDeep], [' rumah tak layak huni diperbaiki,', null]]],
  [2.5, 5.0, [['dan ', null], ['200 ribu', CSS.eduDeep], [' rumah baru dibantu.', null]]],
];

const COLS = 9;
const ROWS = 9;
const SP = 1.62;
const N = COLS * ROWS;
const GX = -2.2;
const LOT_X = 9.7;

export function build() {
  const scene = world(
    'linear-gradient(180deg, #241A3C 0%, #4A2448 22%, #8C3A4A 42%, #C96A4A 58%, #F2B45C 78%, #FFE0A0 100%)',
    0x7A4A48, 34, 120
  );
  stageLights(scene, {
    key: 1.90, amb: 0.86,
    sky: 0x9AB6D8, ground: 0x2A1B18,
    tint: 0xFFD2A0, rim: 0xFF8A6A, rimI: 1.0,
    shadowArea: 30, sun: [-12, 16, 10], rimPos: [8, 6, -8],
  });

  const r = rng(1111);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), std(0x3A3026, { rough: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // ---------- backdrop langit senja ----------
  const skyCv = document.createElement('canvas');
  skyCv.width = 512; skyCv.height = 1024;
  const sk = skyCv.getContext('2d');
  const sg = sk.createLinearGradient(0, 0, 0, 1024);
  sg.addColorStop(0.0, '#161028');
  sg.addColorStop(0.35, '#311A3E');
  sg.addColorStop(0.60, '#5A2745');
  sg.addColorStop(0.78, '#A3444A');
  sg.addColorStop(0.90, '#D9784E');
  sg.addColorStop(1.0, '#FFD58C');
  sk.fillStyle = sg;
  sk.fillRect(0, 0, 512, 1024);
  const rg = sk.createRadialGradient(150, 770, 0, 150, 770, 250);
  rg.addColorStop(0, 'rgba(255,220,150,0.80)');
  rg.addColorStop(0.42, 'rgba(255,170,90,0.22)');
  rg.addColorStop(1, 'rgba(255,170,90,0)');
  sk.fillStyle = rg;
  sk.fillRect(0, 0, 512, 1024);
  const skyTex = new THREE.CanvasTexture(skyCv);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 70),
    new THREE.MeshBasicMaterial({ map: skyTex, toneMapped: false, fog: false })
  );
  sky.position.set(0, 22, -30);
  scene.add(sky);

  // bukit rendah jauh, bukan panggung raksasa
  for (let i = 0; i < 6; i++) {
    const h = new THREE.Mesh(
      new THREE.ConeGeometry(8 + r() * 5, 1.8 + r() * 1.5, 5),
      std(i % 2 ? 0x2B2032 : 0x38263A, { flat: true, rough: 1 })
    );
    h.position.set(-38 + i * 14 + r() * 4, 0.7, -24 - r() * 2);
    h.rotation.y = r() * 1.2;
    scene.add(h);
  }

  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(2.0, 26),
    new THREE.MeshBasicMaterial({ color: 0xFFD07A, transparent: true, opacity: 0.92, toneMapped: false })
  );
  sun.position.set(-14, 4.2, -29.2);
  scene.add(sun);
  const sunGlow = glow(0xFFB060, 10, 0.30);
  sunGlow.position.set(-14, 4.2, -29.0);
  scene.add(sunGlow);

  // ---------- tanah kampung, jalan, sungai, sawah ----------
  const village = new THREE.Mesh(new THREE.PlaneGeometry(18, 16), std(0x4A4432, { rough: 1 }));
  village.rotation.x = -Math.PI / 2;
  village.position.set(GX, 0.008, 0);
  village.receiveShadow = true;
  scene.add(village);

  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(16.4, 0.5), std(0x2E2820, { rough: 1 }));
    p.rotation.x = -Math.PI / 2;
    p.position.set(GX, 0.012, -4.0 + i * 4.0);
    scene.add(p);
  }
  for (let i = 0; i < 2; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 14.4), std(0x2E2820, { rough: 1 }));
    p.rotation.x = -Math.PI / 2;
    p.position.set(GX - 3.1 + i * 6.2, 0.013, 0);
    scene.add(p);
  }

  const road = new THREE.Mesh(new THREE.PlaneGeometry(30, 2.6), std(0x2C2622, { rough: 1 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, 8.2);
  road.receiveShadow = true;
  scene.add(road);
  for (let i = 0; i < 9; i++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.10), basic(0xF2D9A8, {}));
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(-13 + i * 3.2, 0.03, 8.2);
    scene.add(dash);
  }

  const lane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 4.6), std(0x6A593C, { rough: 1 }));
  lane.rotation.x = -Math.PI / 2;
  lane.position.set(LOT_X, 0.016, 5.6);
  scene.add(lane);

  const river = new THREE.Mesh(new THREE.PlaneGeometry(70, 2.0), std(0x1E6668, { rough: 0.34, metal: 0.2, em: 0x082A2C, ei: 0.4 }));
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.025, 12.2);
  scene.add(river);
  for (let i = 0; i < 2; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(80, 3.2), std(i ? 0x42543A : 0x364A32, { rough: 1 }));
    p.rotation.x = -Math.PI / 2;
    p.position.set(0, 0.006, 16.4 + i * 4.2);
    scene.add(p);
  }

  // ---------- 81 rumah lama, instanced ----------
  const wallGeo = new THREE.BoxGeometry(1.20, 0.82, 1.10);
  const roofGeo = prismGeo(1.38, 0.54, 1.30);
  const wallMat = std(0xffffff, { rough: 0.95 });
  const roofMat = std(0xffffff, { rough: 0.88, flat: true });
  const walls = new THREE.InstancedMesh(wallGeo, wallMat, N);
  const roofs = new THREE.InstancedMesh(roofGeo, roofMat, N);
  for (const m of [walls, roofs]) {
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
  }

  const winGeo = new THREE.BoxGeometry(0.22, 0.18, 0.03);
  const winMat = basic(0xffffff, {});
  const winMesh = new THREE.InstancedMesh(winGeo, winMat, N);
  winMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  winMesh.frustumCulled = false;
  scene.add(winMesh);

  const oldWall = new THREE.Color(0x9B8C78);
  const oldRoof = new THREE.Color(0x6C6056);
  const darkWin = new THREE.Color(0x1A1A22);
  const warmWin = new THREE.Color(0xFFC25A);
  const wallPalette = [0xF5E2C2, 0x83D6C0, 0xF3A07C, 0xF2D36C, 0x95BEE4];
  const roofPalette = [0xC75A44, 0x2E7C7C, 0xD6774A, 0x5D67AE];
  const wallNew = wallPalette.map((c) => new THREE.Color(c));
  const roofNew = roofPalette.map((c) => new THREE.Color(c));

  const houses = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = (col - (COLS - 1) / 2) * SP + GX + (r() - 0.5) * 0.10;
      const z = (row - (ROWS - 1) / 2) * SP + (r() - 0.5) * 0.10;
      houses.push({
        x, z,
        rot: (r() - 0.5) * 0.18,
        dist: x - GX + 0.4,
        delay: r() * 0.18,
        wallC: wallNew[Math.floor(r() * wallNew.length)],
        roofC: roofNew[Math.floor(r() * roofNew.length)],
        phase: r() * 6.28,
      });
    }
  }

  const cWall = new THREE.Color();
  const cRoof = new THREE.Color();
  const cWin = new THREE.Color();
  for (let i = 0; i < N; i++) {
    walls.setColorAt(i, oldWall);
    roofs.setColorAt(i, oldRoof);
    winMesh.setColorAt(i, darkWin);
  }
  walls.instanceColor.needsUpdate = true;
  roofs.instanceColor.needsUpdate = true;
  winMesh.instanceColor.needsUpdate = true;

  // ---------- lahan kosong + 10 rumah baru ----------
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 5.4), std(0x6A593C, { rough: 1 }));
  lot.rotation.x = -Math.PI / 2;
  lot.position.set(LOT_X, 0.018, 0.4);
  lot.receiveShadow = true;
  scene.add(lot);

  const newHouses = [];
  const newGlows = [];
  const newRoofCols = [0xC75A44, 0x3E8A8A, 0xE08A4C, 0x5566B8, 0xD8B23A];
  for (let i = 0; i < 10; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const h = makeHouse({
      w: 0.94, d: 0.88, h: 0.62, roofH: 0.50,
      wall: i % 3 === 0 ? 0xF7E9CC : 0xEADFC8,
      roof: newRoofCols[i % newRoofCols.length],
      lit: true, flag: i % 3 === 0,
    });
    h.position.set(7.30 + col * 1.18, 0.02, -1.50 + row * 3.0);
    h.rotation.y = (r() - 0.5) * 0.16;
    h.scale.setScalar(0.001);
    scene.add(h);
    newHouses.push(h);
    const gl = glow(0xFFC266, 1.2, 0.0);
    gl.position.set(h.position.x, 0.78, h.position.z + 0.50);
    scene.add(gl);
    newGlows.push(gl);
  }

  // pagar rendah + orang di depan rumah baru
  const fenceMat = std(0xEADFC8, { rough: 0.9 });
  for (let i = 0; i < 8; i++) {
    const post = mesh(new THREE.BoxGeometry(0.12, 0.52, 0.12), fenceMat, [6.55 + i * 0.90, 0.26, 3.05]);
    post.castShadow = true;
    scene.add(post);
  }
  for (const y of [0.22, 0.42]) {
    const rail = mesh(new THREE.BoxGeometry(6.5, 0.07, 0.07), fenceMat, [9.7, y, 3.05]);
    rail.castShadow = true;
    scene.add(rail);
  }

  const shirts = [PAL.infra, PAL.health, PAL.public, PAL.edu, PAL.orange, PAL.health];
  for (let i = 0; i < 6; i++) {
    const p = makePerson({ shirt: shirts[i], h: 0.52 });
    p.position.set(7.5 + i * 0.86, 0.02, 2.30 + (i % 2) * 0.28);
    p.rotation.y = Math.PI + (r() - 0.5) * 0.5;
    scene.add(p);
  }

  // pohon latar + pohon bingkai
  for (let i = 0; i < 8; i++) {
    const t = makeTree({ h: 1.5 + r() * 1.0, kind: i % 4 === 0 ? 'palm' : 'round', leaf: 0x3B5A36 });
    t.position.set(-15 + r() * 21, 0.02, -9.0 - r() * 3.2);
    scene.add(t);
  }
  for (const [tx, tz] of [[5.55, -3.4], [14.05, -2.2]]) {
    const t = makeTree({ h: 1.8, kind: 'round', leaf: 0x3F6038 });
    t.position.set(tx, 0.02, tz);
    scene.add(t);
  }

  // semak rendah
  for (let i = 0; i < 10; i++) {
    const b = mesh(new THREE.IcosahedronGeometry(0.26 + r() * 0.12, 0), std(i % 2 ? 0x3E6038 : 0x4C7040, { flat: true, rough: 1 }),
      [6.0 + r() * 8.0, 0.22, 3.7 + r() * 1.6]);
    b.castShadow = true;
    scene.add(b);
  }

  // ---------- kamera: drone lebar -> orbit ke lahan baru ----------
  const cam = new Cam(makeCamera(34), { shake: 0 })
    .key(0.0, [-17.0, 17.5, 36.0], [-1.5, 0.4, 0.0], outCubic)
    .key(1.8, [-12.0, 15.0, 32.0], [-0.5, 0.5, 0.0], inOut)
    .key(3.0, [-2.0, 12.6, 28.0], [3.0, 0.7, 0.0], inOut)
    .key(3.8, [5.5, 11.0, 25.0], [8.6, 0.8, 0.0], inOut)
    .key(4.5, [9.6, 10.2, 24.2], [9.6, 0.9, 0.0], outCubic)
    .key(5.0, [9.6, 10.2, 24.2], [9.6, 0.9, 0.0], inOut);

  const waveT = (h) => 0.42 + clamp01(h.dist / 13.0) * 1.55 + h.delay;

  function update(t) {
    cam.apply(t);

    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3(1, 1, 1);

    for (let i = 0; i < N; i++) {
      const h = houses[i];
      const tw = waveT(h);
      const lit = seg(t, tw, tw + 0.34);
      const hop = t > tw ? 0.16 * Math.exp(-7 * (t - tw)) * Math.abs(Math.sin(14 * (t - tw))) : 0;

      cWall.copy(oldWall).lerp(h.wallC, lit);
      cRoof.copy(oldRoof).lerp(h.roofC, lit);
      walls.setColorAt(i, cWall);
      roofs.setColorAt(i, cRoof);
      winMesh.setColorAt(i, cWin.copy(darkWin).lerp(warmWin, lit));

      v.set(h.x, 0.41 + hop, h.z);
      q.setFromEuler(new THREE.Euler(0, h.rot, 0));
      m4.compose(v, q, sc);
      walls.setMatrixAt(i, m4);

      v.set(h.x, 0.82 + hop, h.z);
      m4.compose(v, q, sc);
      roofs.setMatrixAt(i, m4);

      v.set(h.x + Math.sin(h.rot) * 0.56, 0.48 + hop, h.z + Math.cos(h.rot) * 0.56);
      m4.compose(v, q, sc);
      winMesh.setMatrixAt(i, m4);
    }
    walls.instanceMatrix.needsUpdate = true;
    roofs.instanceMatrix.needsUpdate = true;
    winMesh.instanceMatrix.needsUpdate = true;
    walls.instanceColor.needsUpdate = true;
    roofs.instanceColor.needsUpdate = true;
    winMesh.instanceColor.needsUpdate = true;

    // rumah baru
    for (let i = 0; i < newHouses.length; i++) {
      const h = newHouses[i];
      const u = clamp01((t - 2.95 - i * 0.075) / 0.34);
      const s = Math.max(0, spring(u, 9, 6.5));
      h.scale.setScalar(Math.max(0.001, s));
      h.position.y = 0.02 + Math.max(0, 0.12 * Math.sin(Math.PI * Math.min(1, u)));
      newGlows[i].material.opacity = 0.38 * clamp01((t - 3.10 - i * 0.075) / 0.35);
      newGlows[i].position.y = 0.78 + h.position.y;
    }

    // ---------- overlay ----------
    ov.scrim('dark', 0.38 * clamp01((t - 0.10) / 0.4));
    ov.title('PENDIDIKAN & PERUMAHAN · Rp45 T', { color: '#FFD98A', p: clamp01((t - 0.10) / 0.30) });

    if (t < 2.95) {
      const c = counter(t, 0.30, 1.45, 100, 750);
      ov.big(num(c.v) + ' ribu', {
        color: '#FFD86A', p: clamp01((t - 0.22) / 0.25), size: 150,
        sub: c.done ? 'rumah diperbaiki' : '',
        subColor: 'rgba(255,224,160,0.76)',
      });
      ov.badge('', { p: 0 });
    } else {
      const cp = clamp01((t - 2.95) / 0.28);
      ov.big('750 ribu', {
        color: '#FFD86A', p: 1, size: Math.round(lerp(150, 104, cp)),
        dy: Math.round(lerp(0, -22, cp)),
        sub: 'rumah diperbaiki',
        subColor: 'rgba(255,224,160,0.76)',
      });
      const c2 = counter(t, 3.02, 1.35, 20, 200);
      ov.badge(num(c2.v) + ' ribu rumah', {
        color: '#FFE39A', p: clamp01((t - 3.02) / 0.26),
        scale: 0.88 + 0.12 * outBack(clamp01((t - 3.02) / 0.3), 2.0),
        top: 466, size: 104, strokeW: 0,
      });
    }

    ov.subs(t, SUBS);
  }

  return { scene, camera: cam.camera, update, duration };
}
