# Panduan shot — Three.js MBG 2027 (revisi 3)

Revisi 3 mengganti aturan v2. Klip 1–2 tetap acuan gaya dasar, tetapi klip 3–12
kini boleh ramai, sinematik, dan berkontras tinggi.

## STYLE LOCK

- 3D low-poly flat-shaded, matte, soft shadow, sudut membulat.
- Vertikal 1080×1920, 30 fps, 5,0 detik per klip.
- **Horizon lurus. Tidak ada roll, tidak ada handheld shake.** Tilt hanya boleh
  disengaja maksimal 5° saat transisi.
- **Highlight rule:** tiap beat punya satu objek highlight. Objek itu paling
  terang, paling jenuh, minimal 30% lebar layar saat beat-nya, dan satu-satunya
  yang beranimasi kompleks. Latar boleh banyak objek, tetapi lebih gelap,
  kurang jenuh, dan statis/bergerak sangat pelan.
- Safe zone teks: judul/angka **y 8–30%**; subtitle **y 78–92%**. Tidak ada objek
  penting di zona teks. Bila latar terang menabrak teks, pasang `ov.scrim('light')`
  atau `ov.scrim('dark')` 40–70%.
- Koin dekorasi maksimal 12, kecil, hilang sebelum 3 detik.
- Tidak ada teks 3D, tidak ada motion blur, tidak ada partikel berserakan.

## Menjalankan

```powershell
cd "F:\Teknologi Informasi\Self Studies\video-gen\opencode\projects\mbg-2027\three"
python render.py --clip c07 --times 1.0,3.0,4.8
```

Hasil: `stills/c07_t03.0.png`. Lihat gambarnya, jangan menebak.
PowerShell kadang exit code 1 karena stderr http.server — abaikan selama `STILL` muncul.

## Aturan keras

1. **Jangan mengubah** `index.html`, `main.js`, `lib.js`, `props.js`, `render.py`,
   atau shot klip lain. Hanya `shots/cXX.js` milikmu.
2. `update(t)` fungsi murni dari t. Tidak ada akumulasi state.
3. `export const duration = 5.0`, `export function build()` → `{ scene, camera, update, duration }`.
4. Tidak ada `requestAnimationFrame`, tidak ada `Math.random()`; pakai `rng(seed)`.
5. Teks hanya lewat `ov` (HTML overlay). Hanya teks yang tertulis di brief.

## Kamera sinematik

Gunakan 3 key: establishing → tracking/orbit/push-in → reveal. `Cam` sudah
memaksa shake = 0, jadi jangan menambahkan goyangan sendiri.

```js
const cam = new Cam(makeCamera(34), { shake: 0 })
  .key(0.0, [-6, 5.0, 16], [0, 1.2, 0], outCubic)
  .key(2.2, [-1, 3.2, 12], [1.0, 1.0, 0], inOut)
  .key(5.0, [4, 8.0, 18], [1.0, 0.8, 0], inOut);
```

- Dolly/tracking: geser posisi kamera sejajar subjek, jangan zoom saja.
- Orbit 20–40°: ubah x/z mengelilingi subjek, `lookAt` tetap ke subjek.
- Crane: naik/turun 2–5 unit sambil push-in/pull-back.
- Akhir klip: kamera tenang, highlight terlihat, mudah match-cut.

## COUNTER

Mulai dari nilai yang ditentukan (bukan 0), easing out **1,5–2 detik**, lalu
**diam minimal 1,5 detik**. Awalan "±" hanya muncul setelah angka berhenti.
Angka akhir harus sama persis dengan subtitle: 3.600, 210, 35, 51, 4.700, 87,
1.970, 7.600, 750, 200.

```js
const c = counter(t, 0.6, 1.8, 10, 87);
ov.big((c.done ? '±' : '') + num(c.v) + ' km BRT', { ... });
```

Jangan menampilkan angka antara yang bisa disalahbaca sebagai angka final
(contoh "±85" untuk 87).

## Overlay API

```js
import { ov, CSS, counter, num, stageLights, glow } from '../lib.js';

ov.scrim('dark', 0.55);                 // gradient gelap di zona judul
ov.title('KESEHATAN · Rp45 T', { color: CSS.health, p: 1 });
ov.big('±35 juta orang', {
  color: CSS.health, p: 1, size: 150,
  sub: 'iuran BPJS setahun', subColor: 'rgba(200,255,248,0.72)',
});
ov.subs(t, [
  [0.0, 2.5, [['Rp45 triliun untuk ', null], ['kesehatan', CSS.health], ['.', null]]],
  [2.5, 5.0, 'Iuran BPJS 35 juta orang bisa dibiayai setahun.'],
]);
```

Subtitle otomatis berupa pill krem 86% dengan teks gelap. Jangan mengatur warna
teks subtitle selain warna kata kunci. Untuk latar sangat gelap, pill tetap dipakai.

## Palet

```js
PAL.orange 0xF28C38   CSS.orange '#F28C38'
PAL.infra  0x3C6E9E   CSS.infra  '#3C6E9E'   CSS.infraDeep  '#2A4F73'
PAL.health 0x1FB5A5   CSS.health '#1FB5A5'   CSS.healthDeep '#127A70'
PAL.public 0x7B5CD6   CSS.public '#7B5CD6'   CSS.publicDeep '#553BA8'
PAL.edu    0xF5C518   CSS.edu    '#F5C518'   CSS.eduDeep    '#8A6A10'
PAL.cream  0xFFF3DC   PAL.broken 0x8A8379
```

## Cahaya & grading

Dua mode:

```js
// Mode terang (klip 1–2, 10, 12): tetap kalibrasi lama.
lights(scene, { shadowArea: 14, sun: [-9, 15, 9] });

// Mode dramatis v3: bayangan dalam, key kuat, rim dingin.
stageLights(scene, {
  key: 2.05, amb: 0.95,
  sky: 0xBFE4FF, ground: 0x2A1526,
  rim: 0x66CCFF, rimI: 0.85,
  shadowArea: 18,
});
```

Grading 3 lapis: bayangan dalam (L < 25%), midtone warna bidang, rim/emissive
hangat atau dingin pada highlight. Kontras tinggi; jangan pastel menyeluruh.
Gradien langit dua warna lewat CSS `world(...)`, ditambah kabut tipis. Emissive
untuk jendela/lampu/neon. Vignette sudah global di `#vig`.

Glow aditif (pengganti bloom):

```js
const g = glow(0xFFD27A, 3.2, 0.65);
g.position.set(0, 1.4, 0);
scene.add(g);
```

## Latar ramai

Boleh puluhan gedung/pohon/rumah/orang, tetapi:

- warna latar lebih gelap dan kurang jenuh dari highlight;
- animasi latar sangat pelan atau statis;
- jangan menaruh objek terang tepat di belakang teks;
- kedalaman dibangun dengan 2–3 lapis parallax (depan, tengah, jauh) + kabut.

## Transisi

- Masuk: `ov.wipe(warnaKlipSebelumnya, 1 - t/0.30, 'circle')` bila menyambung.
- Keluar: wipe mulai 4,80 dan selesai tepat 5,0.
- Frame terakhir bersih, statis 0,5 detik, highlight masih terlihat.
