# 03 — Konfigurasi Final: Blender di Kaggle T4×2

- **Tanggal pengukuran:** 25 November 2026
- **Blender:** 4.5.9 LTS (pin eksplisit)
- **Platform:** Kaggle Notebook, 2× Tesla T4, driver 580.178.04
- **Scene uji:** factory default (kubus 12 tris) dan sintetis (kubus + 3 teks + kamera beranimasi)
- **Status:** semua angka berasal dari scene uji. **Scene produksi belum diukur.**

> Dokumen ini menggantikan angka estimasi di `02-cara-kerja.md` §7 untuk
> konfigurasi Kaggle. Yang tidak berubah: alur naskah/storyboard dan
> pembagian kerja Colab/Kaggle.

---

## A. Lingkungan

| Item | Nilai | Justifikasi |
| --- | --- | --- |
| Blender | 4.5.9 LTS, tarball resmi `linux-x64` | Tarball membawa Python sendiri; wheel `bpy` tertinggal di Python lama (runtime Kaggle 3.13.16) |
| Waktu setup | unduh 377,9 MB dalam 1,5 s (261 MB/s) + ekstrak 22 s | Diukur. Ekstraksi `.tar.xz` mendominasi (~76% dari blok setup 29 s), jadi simpan hasil ekstrak bila sesi sering diulang |
| GPU | 2× Tesla T4 15.360 MiB, driver 580.178.04 | `nvidia-smi`; `CUDA_VISIBLE_DEVICES` tidak diset (bukan bernilai string `"None"`) |
| RAM | 32,9 GB (31,6 GB tersedia) | `/proc/meminfo` |
| Disk | `/tmp` 2,7 TB · `/kaggle/working` 20,9 GB | `shutil.disk_usage` |
| Bandwidth disk | `/tmp` ~240 MB/s (setelah tulis pertama) · `/dev/shm` ~2,4 GB/s | Diukur. Tulis pertama ke path baru hanya 11 MB/s — artefak alokasi, bukan kecepatan disk |

---

## B. `set_gpu.py` — wajib dijalankan sebelum render

Dua hal terpenting di sini **bukan** bagian dari `.blend`: `compute_device_type`/`d.use` adalah *preferences*, dan `samples` default pabrik adalah 4096.

```python
import bpy, os

sc = bpy.context.scene
p  = bpy.context.preferences.addons["cycles"].preferences

# 1) DEVICE — preferences, tidak tersimpan di .blend
p.compute_device_type = "CUDA"
p.get_devices()
for d in p.devices:
    d.use = (d.type == "CUDA")          # 2x T4; CPU dan entri OPTIX dimatikan

# 2) ENGINE + SAMPLING
sc.render.engine = "CYCLES"
sc.cycles.device = "GPU"
sc.cycles.samples = int(os.environ.get("SPP", "32"))   # default 32, bukan spp file
sc.cycles.use_adaptive_sampling = True
sc.cycles.adaptive_threshold = 0.01

# 3) DENOISE — lever terbesar (38x)
sc.cycles.use_denoising = True
sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.denoising_use_gpu = True

# 4) ANIMASI + OUTPUT
sc.render.use_persistent_data = True
im = sc.render.image_settings
im.file_format  = "PNG"
im.color_mode   = "RGB"
im.color_depth  = "8"
im.compression  = 15

print("SETUP", [(d.name, d.type, d.use) for d in p.devices],
      "spp", sc.cycles.samples, "dn_gpu", sc.cycles.denoising_use_gpu, flush=True)
```

Verifikasi wajib di log: `SETUP ... spp 32 dn_gpu True` dan `Path tracing on: Tesla T4`. Tanpa itu, semua angka di bawah tidak berlaku.

---

## C. Setelan render

| Parameter | Nilai | Justifikasi |
| --- | --- | --- |
| `samples` | **32** | 16→32 hanya +14,4% biaya untuk 2× sample; turun ke 16 menghemat 12,6% saja. Detail di §E |
| `adaptive_threshold` | 0.01 (default) | Dengan cap 32, adaptive sampling hampir tidak berpengaruh. Efeknya di 32 spp **belum diukur** |
| `denoiser` | `OPENIMAGEDENOISE` | OIDN GPU adalah satu-satunya denoiser yang **terverifikasi berjalan di GPU** di mesin ini |
| `denoising_use_gpu` | **True** | 18,17 s → 0,476 s (**38×**) di 1080p. Tanpa ini, frame menjadi ~19 s |
| `use_persistent_data` | True | BVH tidak di-sync ulang antar frame |
| `compression` | **15** | 0,309 s vs 0,229 s (comp 0), tetapi 1,43 MB vs 6,23 MB. Hemat 3,6 menit/2.700 frame di 1 GPU (1,6 menit dengan 2 proses), biaya disk +12,9 GB |
| `color_mode` / `color_depth` | RGB / 8 | Alpha tidak dipakai |

Default pabrik yang harus selalu ditimpa: `cycles.samples = 4096` dan
`cycles.denoising_use_gpu = False`. Keduanya bisa menghasilkan ~19–23 s/frame
di scene factory (lihat §I).

---

## D. Orkestrasi produksi

```bash
export SPP=32                       # eksplisit, walau skrip sudah default 32

CUDA_VISIBLE_DEVICES=0 blender -b scene.blend --python set_gpu.py \
  -o /tmp/frames/gpu0/f_#### -F PNG -s 1    -e 1350 -a &

CUDA_VISIBLE_DEVICES=1 blender -b scene.blend --python set_gpu.py \
  -o /tmp/frames/gpu1/f_#### -F PNG -s 1351 -e 2700 -a &

wait
```

| Keputusan | Justifikasi |
| --- | --- |
| 2 proses, bukan 1 proses 2 GPU | Satu frame di 2 GPU = 3,45 s; 1 GPU = 3,15 s → lebih lambat |
| 1 proses per **rentang** frame | Startup + init render ≈ 1,8 s per proses. Satu proses per frame = (0,97 + 1,8) × 2.700 ≈ **2,1 jam** |
| `CUDA_VISIBLE_DEVICES` | Terverifikasi: device list menyusut ke 1 kartu, GPU lain 0% dan 0 MB |
| Speedup nyata **1,54×** | Tiap proses melambat 1,30× (0,962 → 1,248 s/frame). Hanya ~0,07 s dari penalti itu berasal dari encoder PNG; sisanya kontensi host-side |

Kalau memakai `run_prod()` dari sel benchmark, set `outroot="/tmp/frames"`
secara eksplisit — **default fungsi itu `/kaggle/working/frames`**.

Frame di `/tmp` hilang saat sesi berakhir. Encode per scene menjadi MP4 di
`/tmp`, lalu salin MP4 (bukan ribuan PNG) ke `/kaggle/working`.

---

## E. Model biaya — hanya data terukur

### Satu frame, 1080p, 32 spp, scene sintetis

| Komponen | Detik | Cara memperoleh |
| --- | --- | --- |
| Path trace murni | 0,225 | render tanpa denoise & tanpa tulis |
| Denoise OIDN di GPU | 0,476 | `oidn_gpu_hd_2` (0,701) − path trace (0,225) |
| Tulis PNG (comp 15) | 0,309 | diukur terpisah, `/tmp` ≈ `/dev/shm` |
| Jumlah komponen | 1,010 | |
| **Median terukur** | **0,970** | 10 frame, `render_pre/post` |
| Denoise OIDN di CPU (pembanding) | 18,17 | 38× lebih lambat |

Selisih 4% antara jumlah komponen dan median ada dalam variasi antar-run
(±5–10%).

### Kurva sample (median, 10 frame, 1 GPU)

| spp | median | Δ vs sebelumnya | 2.700 frame, 1 GPU | 2.700 frame, 2 proses (÷1,54) |
| --- | --- | --- | --- | --- |
| 16 | 0,848 | — | 38,2 mnt | 24,8 mnt |
| 32 | 0,970 | +14,4% | 43,6 mnt | **28,3 mnt** |
| 64 | 1,215 | +25,3% | 54,7 mnt | 35,5 mnt |
| 128 | 1,505 | +23,9% | 67,7 mnt | 44,0 mnt |

Biaya tetap ≈ 0,75–0,79 s (denoise + tulis), marginal ≈ 4,5–7,7 ms/spp
tergantung segmen. Regresi linear `t ≈ 0,79 + 0,0058·spp` memberi R² ≈ 0,98,
tetapi residunya sampai ±5% — **jangan pakai rumus untuk keputusan, pakai
tabel di atas**.

### Kesimpulan biaya

```
2.700 frame, 32 spp, 1 GPU    = 43,6 menit
2.700 frame, 32 spp, 2 proses = 28,3 menit
```

Ini untuk scene sintetis (kubus + 3 teks). Scene produksi dengan emission,
tekstur, dan geometri lebih banyak akan lebih mahal; angka final harus dari
`.blend` asli.

---

## F. Yang dilarang, beserta alasannya

| Jangan | Kenapa |
| --- | --- |
| `denoiser = "OPTIX"` | 2,14 s di VGA, 18,75 s di 1080p (jalur CPU), dan `Failed to create OptiX denoiser` di backend OptiX. Tidak terbukti berjalan di GPU |
| EEVEE | `EGL_BAD_MATCH` → rasterizer software: 50,2 s untuk frame yang sama, utilisasi GPU 0% |
| `tile_size` kecil (256) | Cycles X memakai auto-tile (default 2048). Saran 256 berlaku untuk Blender 2.8x |
| Satu proses per frame | Startup 1,8 s + render 0,97 s ≈ 2,8 s/frame → 2,1 jam untuk 2.700 frame |
| `compression = 0` | Hemat 3,6 menit/2.700 frame di 1 GPU, tetapi file 4,4× lebih besar |
| Menaruh frame di `/kaggle/working` | Bersyarat: comp 15 ≈ 3,9 GB untuk 2.700 frame (muat), comp 0 ≈ 16,8 GB (hampir penuh dari 20,9 GB). Pakai `/tmp`, atau `/kaggle/working` hanya bila total < ~18 GB |

---

## G. Provenans angka

| Angka | Cara diperoleh | Status |
| --- | --- | --- |
| GPU dipakai tiap frame | log `Path tracing on: Tesla T4`, VRAM ~750 MB, `nvidia-smi` | terukur |
| Denoise GPU 38× | render berpasangan, denoiser di-set eksplisit tiap baris | terukur |
| `spp 4096` + `dn_gpu False` | audit scene factory | terukur |
| 0,225 / 0,476 / 0,309 | bench satu proses; `write_still=False` untuk memisahkan I/O | terukur |
| Startup 1,8 s/proses | `frame 1` vs median steady-state | terukur |
| Speedup 1,54× | 20 frame, 1 vs 2 proses, pinning terverifikasi | terukur |
| 28,3 menit | 2.700 × (0,970 × 1,30 ÷ 2) | ekstrapolasi linear |
| **Scene asli** | — | **belum diukur** |

---

## H. Yang masih terbuka

1. **`spp`, `bounces`, dan material volumetrik di `.blend` asli.** Jalankan sel
   audit 5 detik. Kalau `spp` masih 4096 atau `volume_mats` tidak kosong,
   seluruh estimasi di §E bergeser.
2. **Flicker temporal.** Uji A/B 32 vs 64 hanya membandingkan still. OIDN tidak
   sadar waktu, jadi noise sisa bisa berbeda antar frame dan terlihat berkedip
   di area gelap. Ujinya: render frame yang sama dengan dua `cycles.seed`
   berbeda, lalu diff.
3. **Biaya scene produksi.** Semua angka di atas berasal dari kubus dan teks
   sederhana.

---

## I. Riwayat klaim yang dibatalkan

Dicatat supaya tidak diulang.

| Klaim awal | Kenyataan | Bukti |
| --- | --- | --- |
| 0,144 s/sample → ~20 s/frame | Artefak: itu total dibagi jumlah sample, sementara waktu didominasi denoise | 1080p/32spp = 0,225 s path trace (~7 ms/sample) |
| "GPU menunggu ~140 ms per sample" | Salah. Sinkronisasi per sample bukan bottleneck | `spp256` = 0,111 s di VGA |
| Denoise CPU "fixed cost per proses" | Salah. Dibayar **per frame** | `second` 2,017 s vs `no_dn` 0,025 s di VGA |
| "I/O bound, disk ~11 MB/s" | Salah. 11 MB/s hanya tulis pertama; `/tmp` ≈ 240 MB/s | `/tmp` vs `/dev/shm` identik pada semua level kompresi |
| `compression = 0` lebih lambat | Salah. Justru 0,08 s lebih cepat; 1,148 vs 1,528 adalah noise | uji terisolasi, 2 putaran, ukuran dicatat |
| OptiX lebih cepat | Tidak di mesin ini; dan tidak terbukti jalan di GPU | 5,55 s vs 3,45 s; `Failed to create OptiX denoiser` |
| EEVEE 5–20× lebih cepat | Tidak tersedia headless di image Kaggle | EGL gagal, 50,2 s, GPU 0% |
| `tile_size = 256` untuk 2 GPU | Usang sejak Cycles X | auto-tile default 2048 |
| Dua GPU untuk satu frame | Lebih lambat dari satu GPU | 3,45 s vs 3,15 s |
| "20 s/frame" berasal dari T4 yang lambat | Kebetulan angkanya mirip denoise CPU; belum pernah dikaitkan ke file nyata | §E |
