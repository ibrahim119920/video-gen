# 02 — Cara Kerja: Riset → Naskah → Blender → Video

> **Status:** rencana kerja. Pipeline Blender belum dijalankan untuk scene
> produksi nyata; semua scene yang diuji sejauh ini adalah kubus/sintetis.
> Infrastruktur render (Blender headless, GPU, denoise, orkestrasi) sudah
> diverifikasi dan diukur — lihat `03-konfigurasi-final.md`.
> Angka estimasi di §7 tetap perkiraan; angka terukur ada di dokumen 03.

Dokumen ini menjelaskan bagaimana agent bekerja saat diminta membuat video
dari hasil riset, misalnya topik *"Kenapa harga tiket pesawat di Indonesia
mahal banget"*.

---

## 1. Prinsip kerja

1. **Reproducible** — semua scene dihasilkan dari kode Python (`bpy`), bukan
   klik-klik di GUI. Versi Blender, font, dan seed di-pin.
2. **Murah dulu, mahal kemudian** — preview 480p sebelum render 1080p.
   Salah timing jauh lebih murah diperbaiki di naskah daripada di render.
3. **Resumable** — render per scene, langsung di-encode, frame dihapus.
   Sesi Colab/Kaggle yang mati tidak menghapus seluruh progres.
4. **Traceable** — setiap angka di video harus berasal dari `research.md`
   dan sumbernya tampil di layar.
5. **Checkpoint manusia** — ada tiga titik persetujuan sebelum biaya besar.

---

## 2. Batas realistis

| Bisa | Tidak realistis (dalam satu sesi) |
| --- | --- |
| Motion graphics / data storytelling 60–180 detik | Animasi karakter kompleks, rigging |
| Teks 3D, grafik batang/garis, peta rute, counter angka | Simulasi fisika berat, crowd, fluid |
| Transisi kamera, lower-third, sitasi sumber | Video 10+ menit, kualitas sinematik |
| Narasi TTS Indonesia atau rekaman sendiri | Lip-sync karakter, aktor virtual |

Blender berjalan **headless** (`blender --background`); tidak ada GUI untuk
diintervensi manual di tengah render.

---

## 3. Fase kerja

### Fase 0 — Brief

Saya kunci sebelum menyentuh kode:

- durasi target
- platform & aspect ratio (16:9 YouTube / 9:16 Shorts)
- gaya visual (2–3 referensi)
- narasi: TTS atau rekaman kamu
- target kualitas (1080p / 4K)
- akun GPU: Kaggle, Colab, atau keduanya
- deadline

**Gate:** brief disetujui.

### Fase 1 — Riset → naskah & storyboard

Input: hasil risetmu (teks/PDF/link). Output:

| Artefak | Isi |
| --- | --- |
| `research.md` | klaim, angka, sumber, hal yang tidak boleh diklaim |
| `script.md` | narasi per scene + durasi + beat |
| `storyboard.md` | visual per scene, camera move, transisi |
| `assets.csv` | daftar grafik, ikon, font, musik, VO |

Format tabel scene:

| # | Durasi | Narasi (VO) | Visual | Data / sumber |
| --- | --- | --- | --- | --- |
| 1 | 0–8 s | ... | teks 3D + peta rute | harga tiket, sumber X |

**Gate:** naskah + storyboard disetujui. Revisi di sini murah.

### Fase 2 — Produksi scene

Satu modul Python per scene, memakai helper bersama:

```text
blender/
├── common/
│   ├── theme.py        # palet, font, ukuran teks
│   ├── text.py         # teks 3D & 2D, animasi masuk/keluar
│   ├── chart.py        # grafik dari data → mesh/tekstur
│   ├── camera.py       # rig kamera, easing
│   └── render.py       # setting engine, output, encode
├── scenes/
│   ├── s01_hook.py
│   ├── s02_anatomi_harga.py
│   ├── s03_perbandingan.py
│   ├── s04_struktur_pasar.py
│   └── s05_penutup.py
└── build.py            # orkestrator semua scene
```

Konvensi:

- tiap scene mengekspos `build(ctx)` dan metadata durasi
- nama file & frame deterministik
- `manifest.json` menyimpan durasi tiap scene untuk concat
- aset (font, tekstur, musik) disimpan di `assets/` dengan lisensi dicatat di
  `assets/LICENSES.md`

### Fase 3 — Animatic (preview murah)

- Render 480p, 12 fps, samples rendah.
- VO TTS ditempel.
- Saya ekstrak frame tiap ~1 detik menjadi *contact sheet* dan memeriksa
  keterbacaan teks, komposisi, dan timing.
- Revisi dilakukan di sini sampai timing dan look disetujui.

**Gate:** animatic disetujui.

### Fase 4 — Render final

- 1080p (atau 4K), 24–30 fps, samples 16–32 + denoise.
- Render per scene → encode H.264 → hapus frame.
- Checkpoint tiap scene selesai: upload ke Google Drive (Colab) atau simpan
  di `/kaggle/working` (Kaggle).
- Kalau sesi mati, lanjut dari scene terakhir yang selesai.

### Fase 5 — Assembly & QC

- concat semua scene
- mux narasi + musik + SFX
- normalisasi loudness −14 LUFS
- subtitle `.srt` (opsional burn-in)
- QC: durasi, black frame, audio clipping, sinkronisasi
- serah terima: MP4, `script.md`, `storyboard.md`, `research.md`, notebook
  reproducible, `render.log`

---

## 4. Struktur folder target

```text
video-gen/
├── README.md
├── docs/
│   ├── 01-mcp-setup.md
│   ├── 02-cara-kerja.md
│   └── 03-konfigurasi-final.md
└── projects/
    └── <slug-topik>/
        ├── research.md
        ├── script.md
        ├── storyboard.md
        ├── assets.csv
        ├── assets/            # font, tekstur, musik, VO
        ├── blender/
        │   ├── common/
        │   ├── scenes/
        │   └── build.py
        ├── out/
        │   ├── preview/
        │   └── final/
        └── notebook.ipynb
```

---

## 5. Detail teknis

### 5.1 Blender di Colab/Kaggle

**Gunakan tarball resmi Blender, bukan `pip install bpy`.**

Alasan: runtime Colab saat verifikasi memakai **Python 3.13.18**, sedangkan
wheel `bpy` resmi tertinggal di versi Python yang lebih lama. Tarball Linux
resmi berisi Python-nya sendiri sehingga tidak bergantung pada Python runtime.

Pola instalasi (pin versi LTS, sesuaikan URL dengan rilis yang dipakai):

```bash
apt-get update && apt-get install -y libgl1 libglib2.0-0 libsm6 \
  libxext6 libxrender1 libx11-6 libxi6
wget -q <URL tarball Blender LTS linux-x64>
tar -xf blender-*-linux-x64.tar.xz
./blender-*-linux-x64/blender --version
```

Cek GPU dari Blender:

```bash
./blender --background --python-expr \
  "import bpy; p=bpy.context.preferences.addons['cycles'].preferences; \
   p.compute_device_type='CUDA'; p.get_devices(); \
   print([(d.name,d.type) for d in p.devices])"
```

### 5.2 Engine & setting render

| Engine | Kapan dipakai | Catatan |
| --- | --- | --- |
| Cycles (GPU/CUDA) | default | paling aman headless; T4 mendukung CUDA |
| EEVEE | kalau terbukti stabil | butuh konteks GPU/GL; uji dengan `xvfb` dulu |
| Workbench | look flat/cepat | juga butuh konteks GL |

Untuk motion graphics, beban bisa ditekan:

- material emission / flat color, tanpa GI berat
- samples 16–32 + denoiser
- resolusi 1920×1080, 30 fps
- color management `Standard` agar warna brand tidak bergeser (AgX
  mendesaturasi)
- film transparent bila mau kompositing di ffmpeg

### 5.3 Encoding

```bash
ffmpeg -framerate 30 -i frames/%04d.png \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -movflags +faststart s01.mp4
```

Penggabungan:

```bash
ffmpeg -f concat -safe 0 -i list.txt -c copy video_noaudio.mp4
```

### 5.4 Audio & subtitle

- Narasi: TTS Indonesia atau rekaman sendiri (kualitas & lisensi menentukan).
- Musik: royalty-free dengan lisensi jelas.
- Mix + loudness:

  ```bash
  ffmpeg -i video_noaudio.mp4 -i vo.mp3 -i music.mp3 \
    -filter_complex "[2:a]volume=0.15[m];[1:a][m]amix=inputs=2:duration=first[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest mixed.mp4
  ffmpeg -i mixed.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:v copy final.mp4
  ```

- Subtitle dibuat dari `script.md` + timing per scene; ekspor `.srt`,
  opsional burn-in dengan `-vf subtitles=subtitle.srt`.

### 5.5 Penyimpanan & resume

- 1080p PNG sekitar 1,5–3 MB/frame.
- 90 detik @ 30 fps = 2.700 frame ≈ 4–8 GB.
- Karena itu: encode per scene lalu hapus frame; jangan menumpuk semua frame.
- Simpan `manifest.json` + status per scene supaya bisa lanjut setelah sesi
  mati.

---

## 6. Pembagian Colab vs Kaggle

| Aspek | Colab | Kaggle |
| --- | --- | --- |
| Akses | MCP live: edit cell, run, lihat output | batch: tulis notebook lalu jalankan |
| GPU | T4 (switch manual di UI) | T4 ×2, kuota mingguan |
| Batas sesi | dinamis, bisa putus | ±12 jam |
| Disk | `/content` sementara | `/kaggle/working` ±20 GB |
| Output | Google Drive | working dir + zip |
| Cocok untuk | iterasi scene, preview | render final, job panjang |

Rekomendasi:

1. **Colab** — bangun scene, preview, tuning look.
2. **Kaggle** — render final per scene, lalu unduh output zip.
3. **Lokal** — assembly/QC dengan ffmpeg yang sudah terpasang.

Alternatif: seluruh proses di Kaggle saja kalau GPU Colab tidak tersedia.

---

## 7. Estimasi render

Rumus: `waktu = jumlah_frame × waktu_per_frame`.

| Durasi | Frame @30 fps | 1 s/frame | 2 s/frame | 3 s/frame |
| --- | --- | --- | --- | --- |
| 60 s | 1.800 | 30 mnt | 60 mnt | 90 mnt |
| 90 s | 2.700 | 45 mnt | 90 mnt | 135 mnt |
| 180 s | 5.400 | 90 mnt | 180 mnt | 270 mnt |

Angka 1–3 detik/frame adalah asumsi untuk scene motion graphics sederhana di
T4 dengan Cycles samples rendah. Scene berat (banyak objek, volumetrik,
texture besar) bisa jauh lebih lambat. Preview 480p biasanya di bawah 10
menit untuk 90 detik.

> **Catatan (25 Nov 2026):** angka di atas hanya berlaku bila
> `cycles.denoising_use_gpu = True`. Dengan denoise di CPU — default pabrik
> Blender 4.5 — denoise saja memakan ~18 s/frame di 1080p (38× lebih lambat),
> sehingga total menjadi ~19 s/frame. Default pabrik `cycles.samples` juga
> 4096, bukan 16–32. Lihat `03-konfigurasi-final.md` §C dan §E.

---

## 8. Cara saya memverifikasi hasil

- **Frame:** ekstrak frame (mis. 1 fps) → susun contact sheet → saya periksa
  komposisi, teks terpotong, warna, dan konsistensi.
- **Gerak:** sampel frame berurutan di titik transisi; saya tidak menonton
  video secara real-time, jadi timing diverifikasi lewat durasi + frame
  kunci.
- **Audio:** `ffprobe` (durasi, codec), `volumedetect` (peak/clipping),
  cek sinkronisasi narasi vs durasi scene.
- **File:** `ffprobe` untuk resolusi/fps/durasi; `blackdetect` untuk frame
  hitam tak sengaja.
- **Log:** `render.log` menyimpan waktu per scene dan error.

---

## 9. Input yang saya butuhkan

```text
1. Topik & tujuan video:
2. Hasil riset (file/link) + angka yang boleh dipakai:
3. Durasi target:
4. Platform/aspect: YouTube 16:9 / Shorts 9:16
5. Referensi visual (2–3 link):
6. Narasi: TTS Indonesia / rekaman sendiri
7. Deadline:
8. GPU: Kaggle / Colab / keduanya
9. Hal yang harus dihindari (klaim, nada, kata terlarang):
```

Kalau brief lengkap, output pertama yang saya balikkan adalah `script.md` +
`storyboard.md` + rencana render dengan estimasi. Setelah disetujui, saya
bangun **scene 1–2 sebagai preview ±15 detik** untuk menguji look dan
kecepatan render sebelum produksi penuh.

---

## 10. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Blender headless gagal di GPU/EEVEE | render tidak jalan | uji engine dulu; fallback Cycles; `xvfb` untuk EEVEE |
| Sesi Colab/Kaggle mati | render terputus | render per scene + checkpoint + resume |
| Disk penuh | render gagal | encode per scene, hapus frame, pantau ukuran |
| Kuota GPU habis | job tertunda | cek `get_accelerator_quota`, jadwalkan render final |
| TTS Indonesia kurang natural | kualitas turun | pilihan voice, atau rekaman sendiri |
| Lisensi musik/font | video tidak bisa dimonetisasi | catat lisensi di `assets/LICENSES.md` |
| Data salah/kadaluarsa | kredibilitas turun | semua angka dari `research.md` + sitasi |
| Perubahan API MCP | tool berhenti | pin versi, catat tanggal setup di dokumen |

---

## 11. Definition of done

- [ ] MP4 1080p (atau 4K), fps dan durasi sesuai brief
- [ ] Narasi + musik ter-mix, loudness ±−14 LUFS, tanpa clipping
- [ ] Subtitle `.srt` (dan/atau burn-in) sinkron
- [ ] Semua angka punya rujukan di `research.md` dan sitasi tampil di video
- [ ] Tidak ada frame hitam/teks terpotong pada QC
- [ ] `notebook.ipynb` bisa dijalankan ulang dari nol
- [ ] Asset + lisensi tercatat
- [ ] `render.log` dan `manifest.json` tersimpan

---

## 12. Di luar cakupan

- upload ke YouTube/TikTok (video diserahkan sebagai file)
- desain thumbnail (bisa ditambahkan sebagai fase terpisah)
- animasi karakter/rigging, motion capture
- live-action, voice actor manusia
- pembelian aset berbayar tanpa persetujuan
