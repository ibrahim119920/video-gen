// lib.js — fondasi bersama untuk 12 klip.
import * as THREE from './vendor/three.module.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

export const W = 1080;
export const H = 1920;

export const PAL = {
  orange: 0xF28C38,
  orangeDeep: 0xD96F20,
  cream: 0xFFF3DC,
  trayCream: 0xFFE8C2,
  green: 0x8CCB6A,
  pink: 0xF2A7A7,
  gold: 0xFFC93C,
  goldDeep: 0xE0A21E,
  infra: 0x3C6E9E,
  infraLight: 0x6D9CC4,
  health: 0x1FB5A5,
  healthLight: 0x74D9CE,
  public: 0x7B5CD6,
  publicLight: 0xA98CF0,
  edu: 0xF5C518,
  eduLight: 0xFFE066,
  broken: 0x8A8379,
  brokenDark: 0x6E675E,
  wood: 0x9A6440,
  woodDark: 0x6B4026,
  ink: 0x3A2A22,
  asphalt: 0x2B2F36,
  white: 0xFFFDF8,
  skin: 0xE8B48C,
  sky: 0xBFD8EA,
  leaf: 0x6FA84F,
  leafDark: 0x4E7F3A,
};

export const CSS = {
  orange: '#F28C38',
  orangeDeep: '#D96F20',
  cream: '#FFF3DC',
  gold: '#FFC93C',
  infra: '#3C6E9E',
  infraDeep: '#2A4F73',
  health: '#1FB5A5',
  healthDeep: '#127A70',
  public: '#7B5CD6',
  publicDeep: '#553BA8',
  edu: '#F5C518',
  eduDeep: '#B98D06',
  ink: '#3A2A22',
  white: '#FFF8EC',
  broken: '#8A8379',
};

/* ---------------- math ---------------- */

export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const clamp01 = (x) => clamp(x, 0, 1);
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp01((t - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const outCubic = (t) => 1 - Math.pow(1 - t, 3);
export const outQuint = (t) => 1 - Math.pow(1 - t, 5);
export const inCubic = (t) => t * t * t;
export const inOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const outBack = (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const spring = (t, f = 9, d = 6) => (t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(f * t));

// osilasi teredam setelah t0 (untuk hentakan/impact)
export const bump = (t, t0, amp = 1, freq = 18, decay = 7) => {
  const d = t - t0;
  if (d < 0) return 0;
  return amp * Math.exp(-decay * d) * Math.sin(freq * d);
};

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, seed) {
  const r = rng(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

export function num(n) {
  return Math.round(n).toLocaleString('id-ID');
}

// counter sesuai revisi 2: mulai dari nilai tertentu, easing out, lalu diam.
export function counter(t, t0, dur, from, to) {
  const u = clamp01((t - t0) / dur);
  return { v: from + (to - from) * outCubic(u), done: t >= t0 + dur, u };
}

/* ---------------- renderer / world ---------------- */

let _renderer = null;

export function initRenderer(canvas) {
  const r = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  r.setPixelRatio(1);
  r.setSize(W, H, false);
  r.setClearColor(0x000000, 0);
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  // Tanpa tone mapping: palet tetap seperti yang ditentukan (gaya maket matte),
  // bukan filmik. Intensitas lampu dijaga totalnya ~1.0.
  r.toneMapping = THREE.NoToneMapping;
  r.toneMappingExposure = 1.0;
  r.outputColorSpace = THREE.SRGBColorSpace;
  _renderer = r;
  return r;
}

export function renderer() {
  return _renderer;
}

export function world(cssBg, fogColor, fogNear = 40, fogFar = 160) {
  document.body.style.background = cssBg;
  const scene = new THREE.Scene();
  if (fogColor != null) scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
  return scene;
}

export function lights(
  scene,
  {
    tint = 0xfff6ea,
    key = 1.55,
    fill = 0.30,
    hemiSky = 0xffffff,
    hemiGround = 0xf0e0c6,
    hemi = 1.85,
    shadowArea = 18,
    shadowZ = 0,
    sun = [-9, 16, 9],
  } = {}
) {
  const h = new THREE.HemisphereLight(hemiSky, hemiGround, hemi);
  scene.add(h);

  const d = new THREE.DirectionalLight(tint, key);
  d.position.set(sun[0], sun[1], sun[2] + shadowZ);
  d.target.position.set(0, 0, shadowZ);
  d.castShadow = true;
  d.shadow.mapSize.set(2048, 2048);
  const s = shadowArea;
  d.shadow.camera.left = -s;
  d.shadow.camera.right = s;
  d.shadow.camera.top = s;
  d.shadow.camera.bottom = -s;
  d.shadow.camera.near = 1;
  d.shadow.camera.far = 80;
  d.shadow.bias = -0.0004;
  d.shadow.normalBias = 0.03;
  d.shadow.radius = 4;
  scene.add(d);
  scene.add(d.target);

  const f = new THREE.DirectionalLight(tint, fill);
  f.position.set(10, 7, -7);
  scene.add(f);

  return { h, d, f };
}

// Lampu dramatis untuk revisi 3: bayangan dalam, key kuat, rim dingin.
export function stageLights(
  scene,
  {
    key = 2.05,
    amb = 0.95,
    sky = 0xBFE4FF,
    ground = 0x2A1526,
    tint = 0xFFE6CC,
    rim = 0x66CCFF,
    rimI = 0.85,
    shadowArea = 18,
    shadowZ = 0,
    sun = [-9, 15, 7],
    rimPos = [9, 5, -7],
  } = {}
) {
  const L = lights(scene, {
    tint, key, fill: 0.05, hemiSky: sky, hemiGround: ground, hemi: amb,
    shadowArea, shadowZ, sun,
  });
  const r = new THREE.DirectionalLight(rim, rimI);
  r.position.set(rimPos[0], rimPos[1], rimPos[2]);
  scene.add(r);
  return { ...L, rim: r };
}

// Glow aditif untuk highlight (pengganti bloom berat).
let _glowTex = null;
export function glowTexture() {
  if (_glowTex) return _glowTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.60)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.14)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
  _glowTex = new THREE.CanvasTexture(cv);
  _glowTex.colorSpace = THREE.SRGBColorSpace;
  return _glowTex;
}

export function glow(color = 0xffffff, size = 2, opacity = 0.65) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }));
  m.scale.set(size, size, 1);
  return m;
}

/* ---------------- geometry / material ---------------- */

const gcache = new Map();
export function rbox(w, h, d, r = 0.06, segments = 2) {
  r = Math.max(0.004, Math.min(r, Math.min(w, h, d) * 0.45));
  const key = `r|${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${r.toFixed(4)}|${segments}`;
  let g = gcache.get(key);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, segments, r);
    gcache.set(key, g);
  }
  return g;
}

const mcache = new Map();
export function std(color, o = {}) {
  const {
    rough = 0.88,
    metal = 0,
    em = 0x000000,
    ei = 1,
    flat = false,
    side = THREE.FrontSide,
    transparent = false,
    opacity = 1,
    depthWrite = true,
  } = o;
  const key = `s|${color}|${rough}|${metal}|${em}|${ei}|${flat}|${side}|${transparent}|${opacity}`;
  let m = mcache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: rough,
      metalness: metal,
      emissive: em,
      emissiveIntensity: ei,
      flatShading: flat,
      side,
      transparent,
      opacity,
      depthWrite,
    });
    mcache.set(key, m);
  }
  return m;
}

export function basic(color, o = {}) {
  const { transparent = false, opacity = 1, side = THREE.FrontSide } = o;
  return new THREE.MeshBasicMaterial({ color, transparent, opacity, side, toneMapped: false });
}

export function mesh(geo, mat, p = [0, 0, 0], s = 1, r = null, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(p[0], p[1], p[2]);
  if (Array.isArray(s)) m.scale.set(s[0], s[1], s[2]);
  else m.scale.setScalar(s);
  if (r) m.rotation.set(r[0], r[1], r[2]);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return m;
}

export function group(...children) {
  const g = new THREE.Group();
  for (const c of children) if (c) g.add(c);
  return g;
}

/* ---------------- instancing ---------------- */

const _o = new THREE.Object3D();

export function makeInst(geo, mat, count, { shadow = true, receive = true } = {}) {
  const m = new THREE.InstancedMesh(geo, mat, count);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.castShadow = shadow;
  m.receiveShadow = receive;
  m.frustumCulled = false;
  m.count = count;
  return m;
}

export function setInst(m, i, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0, rx = 0, rz = 0) {
  _o.position.set(x, y, z);
  _o.rotation.set(rx, ry, rz);
  _o.scale.set(sx, sy, sz);
  _o.updateMatrix();
  m.setMatrixAt(i, _o.matrix);
}

export function hideInst(m, i) {
  setInst(m, i, 0, -9999, 0, 0.0001, 0.0001, 0.0001);
}

/* ---------------- camera ---------------- */

export class Cam {
  constructor(camera, { fov = 34, shake = 0, look = [0, 1.2, 0] } = {}) {
    this.camera = camera;
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
    // Revisi 2: tanpa handheld shake. Kamera harus tenang dan horizon lurus.
    this.shake = 0;
    this.keys = [];
    this.look0 = new THREE.Vector3(...look);
  }

  key(t, pos, look, ease = inOut) {
    this.keys.push({
      t,
      pos: new THREE.Vector3(pos[0], pos[1], pos[2]),
      look: new THREE.Vector3(look[0], look[1], look[2]),
      ease,
    });
    return this;
  }

  sample(t) {
    const k = this.keys;
    if (!k.length) return { pos: new THREE.Vector3(), look: this.look0.clone() };
    if (t <= k[0].t) return { pos: k[0].pos.clone(), look: k[0].look.clone() };
    for (let i = 0; i < k.length - 1; i++) {
      const a = k[i];
      const b = k[i + 1];
      if (t <= b.t) {
        const u = b.t > a.t ? clamp01((t - a.t) / (b.t - a.t)) : 1;
        const e = (b.ease || inOut)(u);
        return {
          pos: a.pos.clone().lerp(b.pos, e),
          look: a.look.clone().lerp(b.look, e),
        };
      }
    }
    const last = k[k.length - 1];
    return { pos: last.pos.clone(), look: last.look.clone() };
  }

  apply(t, amp = this.shake, extra = 0) {
    const { pos, look } = this.sample(t);
    const a = (amp + extra) * (1 + t * 0.05);
    pos.x += a * (Math.sin(t * 1.7 + 0.4) * 0.65 + Math.sin(t * 3.9 + 2.1) * 0.35);
    pos.y += a * (Math.sin(t * 1.3 + 1.2) * 0.55 + Math.sin(t * 4.4 + 0.3) * 0.45);
    pos.z += a * 0.5 * Math.sin(t * 2.3 + 2.7);
    this.camera.position.copy(pos);
    this.camera.lookAt(look);
    return { pos, look };
  }
}

export function makeCamera(fov = 34) {
  const c = new THREE.PerspectiveCamera(fov, W / H, 0.08, 900);
  c.position.set(0, 3, 14);
  c.lookAt(0, 1.2, 0);
  return c;
}

/* ---------------- overlay ---------------- */

const $ = (id) => document.getElementById(id);

const ovState = {
  title: '',
  big: '',
  sub: '',
  subLight: null,
  bigSize: 0,
};

function setText(el, txt) {
  if (el._t !== txt) {
    el.textContent = txt;
    el._t = txt;
  }
}

function setHTML(el, html) {
  if (el._h !== html) {
    el.innerHTML = html;
    el._h = html;
  }
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function partsHTML(parts) {
  if (typeof parts === 'string') return esc(parts).replace(/\n/g, '<br>');
  let out = '';
  for (const p of parts) {
    if (typeof p === 'string') out += esc(p).replace(/\n/g, '<br>');
    else {
      const [txt, color, extra] = p;
      const style = color ? `color:${color}` : '';
      out += `<span class="kw" style="${style};${extra || ''}">${esc(txt).replace(/\n/g, '<br>')}</span>`;
    }
  }
  return out;
}

const bigFit = new Map();

export const ov = {
  reset() {
    $('title').style.opacity = 0;
    $('big').style.opacity = 0;
    $('bigsub').style.opacity = 0;
    $('badge').style.opacity = 0;
    $('sub').style.opacity = 0;
    $('wipe').style.opacity = 0;
    $('flash').style.opacity = 0;
    $('scrim').style.opacity = 0;
    $('dbg').style.display = new URLSearchParams(location.search).has('dbg') ? 'block' : 'none';
  },

  title(text, { color = CSS.ink, p = 1, y = 0 } = {}) {
    const el = $('title');
    setText(el, text);
    el.style.color = color;
    el.style.opacity = p;
    el.style.transform = `translateY(${(1 - p) * -26 + y}px)`;
  },

  big(text, { color = CSS.orange, p = 1, size = 168, sub = '', subColor = null, dy = 0 } = {}) {
    const el = $('big');
    setText(el, text);
    el.style.color = color;
    el.style.opacity = p;
    el.style.fontSize = size + 'px';

    // auto-fit: ukur lebar natural sekali per (teks,ukuran)
    const key = text + '|' + size;
    let fit = bigFit.get(key);
    if (fit == null) {
      const w = el.offsetWidth || 0;
      fit = w > 970 ? 970 / w : 1;
      bigFit.set(key, fit);
    }
    el.style.transform = `translateY(${dy}px) scale(${fit})`;

    const s = $('bigsub');
    if (sub) {
      setText(s, sub);
      s.style.opacity = p * 0.95;
      s.style.color = subColor || color;
      s.style.transform = `translateY(${(1 - p) * 14}px)`;
    } else {
      s.style.opacity = 0;
    }
  },

  badge(text, { color = CSS.orange, p = 1, scale = 1, rot = 0, top = 560, size = 200, strokeW = 8, stroke = 'rgba(42,26,20,0.9)' } = {}) {
    const el = $('badge');
    setText(el, text);
    el.style.color = color;
    el.style.opacity = p;
    el.style.top = top + 'px';
    el.style.fontSize = size + 'px';
    el.style.transform = `rotate(${rot}deg) scale(${scale})`;
    el.style.webkitTextStroke = p > 0 ? `${strokeW}px ${stroke}` : '0';
    el.style.paintOrder = 'stroke fill';
  },

  sub(parts, { p = 1, scale = 1, dy = 0, size = 42 } = {}) {
    const el = $('sub');
    setHTML(el, partsHTML(parts));
    el.style.opacity = p;
    el.style.fontSize = size + 'px';
    el.style.transform = `translateY(${(1 - p) * 16 + dy}px) scale(${scale})`;
  },

  subs(t, beats, opts = {}) {
    let found = null;
    for (const b of beats) {
      if (t >= b[0] - 1e-6 && t <= b[1] + 1e-6) found = b;
    }
    if (!found) {
      $('sub').style.opacity = 0;
      return;
    }
    const [t0, t1, parts] = found;
    const a = clamp01((t - t0) / 0.16);
    const b = t1 >= 4.95 ? 1 : clamp01((t1 - t) / 0.1);
    const p = Math.min(a, b);
    const sc = 0.93 + 0.07 * outBack(a, 2.2);
    this.sub(parts, { ...opts, p, scale: sc });
  },

  wipe(color, p, mode = 'circle') {
    const el = $('wipe');
    if (p <= 0.002) {
      el.style.opacity = 0;
      return;
    }
    el.style.opacity = 1;
    el.style.background = color;
    let clip = 'inset(100% 0 0 0)';
    const q = clamp01(p);
    if (mode === 'circle') clip = `circle(${q * 145}% at 50% 52%)`;
    else if (mode === 'up') clip = `inset(${(1 - q) * 100}% 0 0 0)`;
    else if (mode === 'down') clip = `inset(0 0 ${(1 - q) * 100}% 0)`;
    else if (mode === 'left') clip = `inset(0 ${(1 - q) * 100}% 0 0)`;
    else if (mode === 'right') clip = `inset(0 0 0 ${(1 - q) * 100}%)`;
    else if (mode === 'diag') clip = `polygon(0 0, ${q * 130}% 0, ${q * 130 - 30}% 100%, 0 100%)`;
    el.style.clipPath = clip;
  },

  flash(color, p) {
    const el = $('flash');
    el.style.background = color;
    el.style.opacity = clamp01(p);
  },

  scrim(kind, p = 1) {
    const el = $('scrim');
    if (!kind || p <= 0.002) {
      el.style.opacity = 0;
      return;
    }
    el.style.opacity = clamp01(p);
    if (kind === 'dark') {
      el.style.background =
        'linear-gradient(180deg, rgba(6,8,20,0.78) 0%, rgba(6,8,20,0.42) 14%, rgba(6,8,20,0.10) 26%, rgba(6,8,20,0) 36%)';
    } else {
      el.style.background =
        'linear-gradient(180deg, rgba(255,247,232,0.88) 0%, rgba(255,247,232,0.50) 14%, rgba(255,247,232,0.12) 26%, rgba(255,247,232,0) 36%)';
    }
  },

  fadeAll(p) {
    for (const id of ['title', 'big', 'bigsub', 'badge', 'sub']) {
      $(id).style.opacity = clamp01(p);
    }
  },
};

// transisi masuk/keluar standar 0,38 s
export function enterWipe(color, t, dur = 0.38) {
  ov.wipe(color, 1 - clamp01(t / dur), 'circle');
}

export function exitWipe(color, t, dur = 0.38, mode = 'circle') {
  const p = clamp01((t - (5 - dur)) / dur);
  ov.wipe(color, p, mode);
  return p;
}

// helper subtitle track singkat
export function beat(t0, t1, parts) {
  return [t0, t1, parts];
}
