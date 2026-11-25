import * as THREE from './vendor/three.module.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('c');

const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, alpha: true, preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.setClearAlpha(0);
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xB07048, 120, 380);

const camera = new THREE.PerspectiveCamera(42, W / H, 0.5, 600);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cityRow(cfg) {
  const rnd = mulberry32(cfg.seed);
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: cfg.color, fog: true });
  let x = cfg.x0;
  while (x < cfg.x1) {
    const w = cfg.wmin + rnd() * (cfg.wmax - cfg.wmin);
    const h = cfg.hmin + rnd() * (cfg.hmax - cfg.hmin);
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(w * 0.92, h, cfg.depth);
    m.position.set(x + w * 0.5, h / 2, cfg.z + (rnd() - 0.5) * 1.2);
    scene.add(m);
    x += w + 0.4 + rnd() * 1.2;
  }
}

function build() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400),
    new THREE.MeshBasicMaterial({ color: 0x14121C, fog: true })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);

  cityRow({ z: 58, x0: -110, x1: 110, hmin: 8, hmax: 18, wmin: 7, wmax: 14, color: 0x2A2442, seed: 11, depth: 5 });
  cityRow({ z: 34, x0: -70, x1: 70, hmin: 6, hmax: 13, wmin: 5, wmax: 10, color: 0x1A1628, seed: 22, depth: 4 });
  cityRow({ z: 14, x0: -40, x1: 40, hmin: 2, hmax: 6, wmin: 3.5, wmax: 7.5, color: 0x0D0A14, seed: 33, depth: 3 });

  // matahari digambar di CSS (radial-gradient), bukan 3D: selalu tepat
  // di posisi yang sama dan tidak tertutup gedung.
}

build();

const big = document.getElementById('big');

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

window.draw = (i, n) => {
  const u = n > 1 ? i / (n - 1) : 1;
  const e = easeOutCubic(u);

  // push-in kuat: kamera maju 16 m, plus drift lateral
  camera.position.set(-1.4 + 2.8 * e, 11.0 - 0.8 * e, -36 + 16 * e);
  camera.lookAt(0, 19, 60);

  // counter 0 -> 180 pada 30% pertama
  const k = Math.min(1, u / 0.30);
  const val = Math.round(180 * easeOutCubic(k));
  big.textContent = 'Rp' + val;

  renderer.render(scene, camera);
};

window.READY = true;
window.GL_INFO = (() => {
  const gl = renderer.getContext();
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
})();
