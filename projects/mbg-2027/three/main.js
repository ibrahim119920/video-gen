// main.js — memuat satu klip lewat ?clip=cXX, mengekspos window.draw(t).
import { initRenderer, ov, renderer } from './lib.js';

const params = new URLSearchParams(location.search);
const name = params.get('clip') || 'c01';

// dynamic import: menambah klip baru cukup dengan file baru di shots/,
// tidak perlu menyentuh file ini (menghindari konflik antar-pekerja).
const mod = await import('./shots/' + name + '.js');

const canvas = document.getElementById('c');
initRenderer(canvas);
ov.reset();

const inst = mod.build();
window.CLIP = name;
window.DURATION = inst.duration;
window.SCENE = inst.scene;
window.CAMERA = inst.camera;

window.draw = (t) => {
  inst.update(t);
  renderer().render(inst.scene, inst.camera);
};

async function ready() {
  try {
    await Promise.all([
      document.fonts.load('800 168px Poppins'),
      document.fonts.load('600 47px Poppins'),
    ]);
    await document.fonts.ready;
  } catch (e) {
    console.warn('font', e);
  }
  window.GL_INFO = (() => {
    const gl = renderer().getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  })();
  window.draw(0);
  window.READY = true;
}

ready();
