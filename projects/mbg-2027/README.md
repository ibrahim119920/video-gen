# MBG 2027 — explainer 60 detik (Three.js)

Video vertikal 1080×1920, 30 fps, 60 detik, **tanpa voiceover** — seluruh
informasi disampaikan lewat teks dan subtitle Indonesia.

## Hasil

| Berkas | Isi |
| --- | --- |
| `out/mbg_2027_1080x1920.mp4` | video final 60,0 detik (1.800 frame, H.264, 20,8 MB) |
| `out/c01_v3.mp4` … `out/c12_v3.mp4` | 12 klip terpisah, masing-masing 5,0 detik |

Semua klip dirender dari kode yang sama di `three/`. Tidak ada audio.

## Premis angka

- Anggaran MBG 2027: **Rp240 triliun**.
- Setelah dipangkas 75%: **Rp60 triliun**.
- Dana yang dialihkan: **Rp180 triliun**.
- Rp180 triliun dibagi rata ke empat bidang: **Rp45 triliun per bidang**.

Angka program di dalam tiap bidang adalah **seperempat** dari anggaran program
pada skenario 180 triliun di `research.md`, sehingga total tiap bidang tetap
Rp45 triliun. Contoh:

| Bidang | Program | Anggaran skenario | Skala 1/4 | Hasil yang tampil |
| --- | --- | --- | --- | --- |
| Infrastruktur | Jalan | Rp80 T → 14.388 km | Rp20 T | ±3.600 km |
| Infrastruktur | Rel | Rp50 T → 850 km | Rp12,5 T | ±210 km |
| Kesehatan | RSUD | Rp35 T → 205 RS | Rp8,75 T | ±51 RS |
| Kesehatan | Puskesmas | Rp25 T → 18.744 paket | Rp6,25 T | ±4.700 paket |
| Kesehatan | BPJS PBI | Rp70 T → 138,9 juta | Rp17,5 T | ±35 juta orang |
| Layanan publik | BRT | Rp40 T → 348 km | Rp10 T | ±87 km |
| Layanan publik | Bus | Rp10 T → 7.893 unit | Rp2,5 T | ±1.970 bus |
| Pendidikan | Sekolah | Rp50 T → 30.437 | Rp12,5 T | ±7.600 sekolah |
| Perumahan | BSPS | Rp60 T → 3 juta | Rp15 T | 750 ribu rumah |
| Perumahan | Rumah baru | Rp40 T → 800 ribu | Rp10 T | 200 ribu rumah |

Ini **target simulasi / ekuivalen biaya**, bukan janji output fisik 2027.
Lihat `research.md` §2 dan §8.

## Peta klip

| # | Berkas | Isi | Angka utama |
| --- | --- | --- | --- |
| 01 | `c01_v3.mp4` | Hook: anggaran MBG | Rp240 T |
| 02 | `c02_v3.mp4` | Pemangkasan 75% | Rp240 T → Rp60 T, −75% |
| 03 | `c03_v3.mp4` | Rp180 T dibagi empat | Rp180 T, Rp45 T × 4 |
| 04 | `c04_v3.mp4` | Infrastruktur: jalan | ±3.600 km |
| 05 | `c05_v3.mp4` | Infrastruktur: rel & jembatan | ±210 km rel |
| 06 | `c06_v3.mp4` | Kesehatan: iuran BPJS | ±35 juta orang |
| 07 | `c07_v3.mp4` | Kesehatan: RS & Puskesmas | ±51 RS, ±4.700 paket |
| 08 | `c08_v3.mp4` | Layanan publik: BRT & bus | ±87 km, ±1.970 bus |
| 09 | `c09_v3.mp4` | Layanan publik: trotoar, taman, perpustakaan | — |
| 10 | `c10_v3.mp4` | Pendidikan: revitalisasi sekolah | ±7.600 sekolah |
| 11 | `c11_v3.mp4` | Perumahan: perbaikan & rumah baru | 750 ribu, 200 ribu |
| 12 | `c12_v3.mp4` | Penutup: empat bidang vs MBG | Rp45 T × 4, Rp60 T |

## Struktur

```
three/
  index.html        kanvas 1080×1920 + layer overlay HTML
  main.js           memuat shots/<clip>.js secara dinamis
  lib.js            renderer, kamera, cahaya, overlay, counter, glow
  props.js          peti, ompreng, orang, rumah, sekolah, bus, ikon
  shots/c01–c12.js  satu berkas per klip; update(t) murni fungsi waktu
  build.py          render 150 frame + encode + concat
  render.py         render still/frame lewat Chrome headless (Playwright)
  SHOT_GUIDE.md     aturan v3: kamera, grading, teks, counter, kontinuitas
  vendor/           three.js, RoundedBoxGeometry, font Poppins
```

## Cara render

Prasyarat: Python 3.11, `playwright` dengan Chrome terpasang, dan `ffmpeg`
di `PATH`.

```powershell
cd projects/mbg-2027/three

# cek still pada detik tertentu
python render.py --clip c04 --times 0.8,2.5,4.8

# ekspor satu klip
python build.py --clips c04 --out ../out/c04_v3.mp4

# render ulang semua klip + sambung jadi video 60 detik
python build.py
```

`build.py` selalu merender ulang frame (deterministik, tanpa
`requestAnimationFrame`), lalu meng-encode tiap segmen dengan parameter yang
sama dan menyambungnya tanpa re-encode.

## Penyimpanan

Frame mentah (`three/frames/`), segmen (`three/segments/`), dan still
(`three/stills/`) adalah artefak regenerable dan tidak disimpan. `out/` hanya
berisi video final, 12 klip, dan `preview-grid.jpg` (contact sheet 12 klip).
Jalankan `python build.py` untuk membuat ulang semuanya.

## Catatan

- Gaya: diorama mainan low-poly, matte, bayangan lembut; satu objek highlight
  per beat; kamera 2–3 beat per klip; tanpa handheld shake.
- Empat bidang adalah **pembagian rata**, bukan empat paket yang dijumlahkan.
- Angka "±" hanya muncul setelah hitungan berhenti.
- Sisa yang diketahui: beberapa klip masih terasa longgar di area subtitle
  (c10), dan c11 sempat dinilai terlalu dekat pada versi awal — sudah
  diperbaiki dengan kamera yang lebih lebar.
