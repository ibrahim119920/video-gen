// c06 — kesehatan: malam tosca, perisai neon menyapu lautan orang.
// Revisi 3: crowd gelap, shield highlight, kamera top-down -> tracking -> crane.
import * as THREE from '../vendor/three.module.js';
import {
  PAL, CSS, std, mesh, world, makeCamera, ov, counter, glow, stageLights, enterWipe,
  clamp01, lerp, seg, spring, outCubic, inOut, smooth, rng, num,
} from '../lib.js';
import { PeopleField } from '../props.js';

export const duration = 5.0;

const SUBS = [
  [0.0, 2.5, [['Rp45 triliun untuk ', null], ['kesehatan', CSS.healthDeep], ['.', null]]],
  [2.5, 5.0, [['Iuran BPJS sekitar ', null], ['35 juta orang', CSS.healthDeep], [' bisa dibiayai setahun.', null]]],
];

function heartShape(s = 1) {
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.62 * s);
  sh.bezierCurveTo(-0.95 * s, -0.22 * s, -0.96 * s, 0.48 * s, -0.46 * s, 0.55 * s);
  sh.bezierCurveTo(-0.18 * s, 0.59 * s, 0, 0.38 * s, 0, 0.22 * s);
  sh.bezierCurveTo(0, 0.38 * s, 0.18 * s, 0.59 * s, 0.46 * s, 0.55 * s);
  sh.bezierCurveTo(0.96 * s, 0.48 * s, 0.95 * s, -0.22 * s, 0, -0.62 * s);
  return sh;
}

function shieldShape(s = 1) {
  const sh = new THREE.Shape();
  sh.moveTo(0, 1.92 * s);
  sh.quadraticCurveTo(1.35 * s, 1.24 * s, 1.38 * s, 0.12 * s);
  sh.quadraticCurveTo(1.34 * s, -1.12 * s, 0, -1.95 * s);
  sh.quadraticCurveTo(-1.34 * s, -1.12 * s, -1.38 * s, 0.12 * s);
  sh.quadraticCurveTo(-1.35 * s, 1.24 * s, 0, 1.92 * s);
  return sh;
}

function checkTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const c = cv.getContext('2d');
  c.clearRect(0, 0, 64, 64);
  c.strokeStyle = '#FFFFFF';
  c.lineWidth = 9;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(13, 35);
  c.lineTo(26, 48);
  c.lineTo(52, 17);
  c.stroke();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function build() {
  const scene = world(
    'radial-gradient(120% 100% at 50% 38%, #0D3A46 0%, #102A3E 48%, #251633 76%, #3A1434 100%)',
    0x0C2834, 25, 85
  );
  stageLights(scene, {
    key: 1.65, amb: 0.58,
    sky: 0x2E6A7A, ground: 0x0C0C18,
    tint: 0xC8F2FF, rim: 0xFF5AA8, rimI: 0.95,
    shadowArea: 22, sun: [-8, 14, 8], rimPos: [9, 5, -8],
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), std(0x0B1F27, { rough: 0.92 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(48, 48, 0x2A9E9A, 0x1A6668);
  grid.position.y = 0.012;
  grid.material.transparent = true;
  grid.material.opacity = 0.20;
  scene.add(grid);

  // ---------- kota latar: blok gelap + jendela ----------
  const r = rng(606);
  const city = [];
  for (let i = 0; i < 28; i++) {
    const x = -22 + (i % 14) * 3.4 + (r() - 0.5) * 0.8;
    const z = -16 - r() * 9;
    const h = 2.2 + r() * 5.0;
    const b = mesh(new THREE.BoxGeometry(1.8 + r() * 1.0, h, 1.6 + r() * 0.9),
      std(i % 3 ? 0x1A2032 : 0x211A30, { rough: 0.94 }), [x, h / 2, z]);
    scene.add(b);
    city.push(b);
    if (z < 0) {
      for (let k = 0; k < 3; k++) {
        if (r() < 0.30) continue;
        const win = mesh(new THREE.BoxGeometry(0.16, 0.18, 0.03),
          std(r() > 0.35 ? 0xFFB05A : 0x5FE0D0, { em: r() > 0.35 ? 0xFF8A2A : 0x2AC8B8, ei: 1.1 }),
          [x - 0.4 + (k % 2) * 0.8, 0.8 + Math.floor(k / 2) * 0.9, z + (z < 0 ? 0.86 : -0.86)]);
        scene.add(win);
      }
    }
  }

  // ---------- lautan orang ----------
  const COLS = 46;
  const ROWS = 20;
  const people = new PeopleField({
    count: COLS * ROWS, cols: COLS, rows: ROWS, spacing: 0.50, seed: 606,
    base: 0x263C4A,
  });
  people.addTo(scene);
  const darkBody = new THREE.Color(0x263C4A);
  const mintBody = new THREE.Color(0x47F0C2);

  // centang bercahaya
  const checkN = 220;
  const checkPos = new Float32Array(checkN * 3);
  const checkGeo = new THREE.BufferGeometry();
  checkGeo.setAttribute('position', new THREE.BufferAttribute(checkPos, 3));
  const checkMat = new THREE.PointsMaterial({
    map: checkTexture(), color: 0xB8FFE8, size: 0.23, transparent: true,
    opacity: 0.95, depthWrite: false, toneMapped: false, sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });
  const checks = new THREE.Points(checkGeo, checkMat);
  checks.frustumCulled = false;
  scene.add(checks);

  // ---------- perisai neon ----------
  const shieldGroup = new THREE.Group();
  shieldGroup.scale.setScalar(0.001);
  scene.add(shieldGroup);

  const shieldMat = std(0x22C9A8, {
    rough: 0.26, metal: 0.28, em: 0x1FB5A5, ei: 1.25,
  });
  const shieldGeo = new THREE.ExtrudeGeometry(shieldShape(0.72), {
    depth: 0.12, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.035, bevelThickness: 0.035,
  });
  shieldGeo.center();
  const shieldFace = new THREE.Mesh(shieldGeo, shieldMat);
  shieldFace.castShadow = true;
  shieldGroup.add(shieldFace);

  const rim = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shieldShape(0.82), {
      depth: 0.05, bevelEnabled: false,
    }),
    std(0x9BFFE0, { rough: 0.2, em: 0x4FE8C8, ei: 2.6, transparent: true, opacity: 0.30 })
  );
  rim.geometry.center();
  rim.position.z = -0.10;
  shieldGroup.add(rim);

  const heartGeo = new THREE.ShapeGeometry(heartShape(0.44));
  const heart = new THREE.Mesh(heartGeo, std(0xF4FFFA, {
    rough: 0.18, em: 0x9BFFE0, ei: 2.0, transparent: true, opacity: 0.96,
  }));
  heart.position.set(0, 0.04, 0.16);
  shieldGroup.add(heart);

  const shieldHalo = glow(0x3FE0C0, 5.8, 0.52);
  shieldHalo.position.set(0, 0, -0.25);
  shieldGroup.add(shieldHalo);

  const shieldLight = new THREE.PointLight(0x3FE0B8, 3.0, 8.5);
  shieldLight.position.set(0, 0.8, 0.4);
  shieldGroup.add(shieldLight);

  // dinding pemindai tipis
  const scanWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 2.2, 10.8),
    new THREE.MeshBasicMaterial({
      color: 0x52F0C8, transparent: true, opacity: 0.055,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    })
  );
  scanWall.position.set(0, 1.1, 0);
  scene.add(scanWall);

  const shieldX = (t) => lerp(-10.2, 12.4, outCubic(clamp01((t - 0.66) / 2.76)));

  function update(t) {
    enterWipe('#0B3A46', t, 0.28);

    const sx = shieldX(t);
    const svis = t > 0.40 && t < 4.15;

    // perisai
    shieldGroup.visible = svis;
    if (svis) {
      const pop = Math.max(0, spring(clamp01((t - 0.40) / 0.42), 8.5, 6.2));
      const fade = 1 - seg(t, 3.72, 4.15);
      shieldGroup.position.set(sx, 1.45, 0.35);
      shieldGroup.scale.setScalar(Math.max(0.001, 0.98 * pop * fade));
      // billboard ke kamera di sumbu Y
      const camera = scene.userData.camera;
      shieldGroup.rotation.y = Math.atan2(camera.position.x - sx, camera.position.z - 0.35) * 0.65;
      shieldGroup.rotation.x = -0.12;
    }
    scanWall.visible = svis;
    if (svis) {
      scanWall.position.x = sx + 0.10;
      scanWall.material.opacity = 0.055 * (1 - seg(t, 3.65, 4.15));
    }

    // orang: gelap -> mint setelah dilewati perisai
    const c = new THREE.Color();
    people.update((i, it) => {
      const lit = clamp01((sx - it.x) / 0.55);
      const bob = t < 4.35 ? 0.012 * Math.sin(t * 3.0 + it.phase) * (lit > 0 ? 1 : 0.25) : 0;
      c.copy(darkBody).lerp(mintBody, lit);
      return {
        s: 1,
        y: bob,
        ry: it.phase * 0.12,
        color: c,
      };
    });

    // centang pada sebagian orang yang sudah terlindungi
    for (let i = 0; i < checkN; i++) {
      const p = people.items[(i * 13 + 7) % people.n];
      const lit = (sx - p.x) > 0.3 && t > 0.65;
      const idx = i * 3;
      if (lit) {
        checkPos[idx] = p.x;
        checkPos[idx + 1] = 0.58;
        checkPos[idx + 2] = p.z;
      } else {
        checkPos[idx] = 0;
        checkPos[idx + 1] = -999;
        checkPos[idx + 2] = 0;
      }
    }
    checkGeo.attributes.position.needsUpdate = true;
    checkMat.opacity = 0.95 * (1 - seg(t, 3.90, 4.35));

    // kamera: top-down -> tracking perisai -> crane reveal
    let cx, cy, cz, lx, ly, lz;
    if (t < 0.85) {
      const u = inOut(clamp01(t / 0.85));
      cx = lerp(0.0, sx - 0.55, u);
      cy = lerp(23.0, 9.0, u);
      cz = lerp(3.5, 14.4, u);
      lx = lerp(0.0, sx + 0.55, u);
      ly = lerp(0.0, 0.55, u);
      lz = 0;
    } else if (t < 3.40) {
      const u = inOut(clamp01((t - 0.85) / 0.55));
      const trackX = sx - 0.55;
      const trackY = 9.0;
      const trackZ = 14.4 - 0.8 * clamp01((t - 1.4) / 2.0);
      cx = lerp(sx - 0.55, trackX, u);
      cy = 9.0;
      cz = trackZ;
      lx = sx + 0.55;
      ly = 0.55;
      lz = 0;
    } else {
      const u = inOut(clamp01((t - 3.40) / 0.95));
      const fromX = sx - 0.55;
      const fromY = 9.0;
      const fromZ = 13.8;
      const fromLX = sx + 0.55;
      const fromLY = 0.55;
      cx = lerp(fromX, 0.0, u);
      cy = lerp(fromY, 19.0, u);
      cz = lerp(fromZ, 14.0, u);
      lx = lerp(fromLX, 0.0, u);
      ly = lerp(fromLY, 0.0, u);
      lz = -1.0;
    }
    if (t > 4.35) {
      cx = 0.0; cy = 19.0; cz = 14.0;
      lx = 0.0; ly = 0.0; lz = -1.0;
    }
    const camera = scene.userData.camera;
    camera.position.set(cx, cy, cz);
    camera.lookAt(lx, ly, lz);

    // ---------- overlay ----------
    ov.scrim('dark', 0.45 * clamp01((t - 0.10) / 0.4));
    ov.title('KESEHATAN · Rp45 T', { color: '#7FE8D8', p: clamp01((t - 0.10) / 0.30) });

    const cnt = counter(t, 0.50, 1.70, 5, 35);
    ov.big((cnt.done ? '±' : '') + num(cnt.v) + ' juta' + (cnt.done ? ' orang' : ''), {
      color: '#8CFFE6', p: clamp01((t - 0.35) / 0.25), size: 150,
      sub: cnt.done ? 'iuran BPJS setahun' : '',
      subColor: 'rgba(166,255,235,0.72)',
    });

    ov.subs(t, SUBS);
  }

  // Camera harus ada saat update pertama; simpan di scene userData.
  const camera = makeCamera(34);
  scene.userData.camera = camera;

  return { scene, camera, update, duration };
}
