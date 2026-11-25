# video-gen

Pipeline video: riset → naskah → Blender headless (Kaggle T4×2) → MP4.

- `docs/01-mcp-setup.md` — setup MCP Kaggle/Colab.
- `docs/02-cara-kerja.md` — alur kerja dan pembagian tugas.
- `docs/03-konfigurasi-final.md` — setelan render yang terukur, beserta provenans.
- `projects/mbg-2027/` — proyek pertama: realokasi anggaran MBG Rp180 triliun.

## Menjalankan di Kaggle

Kode tidak lagi ditempel di sel notebook. Notebook hanya melakukan:

1. unduh Blender 4.5.9 (tarball resmi),
2. `git clone` repo ini,
3. panggil `blender -b --factory-startup --python projects/mbg-2027/blender/build.py`,
4. salin PNG/MP4 ke `/kaggle/working/out`.

Isi sel ada di `projects/mbg-2027/notebook/kaggle_cells.md`.

## Struktur proyek

```text
projects/mbg-2027/
├── research.md          angka, sumber, dan yang tidak boleh diklaim
├── script.md            timeline, narasi, teks layar
├── storyboard.md        set, kamera, palet, komposisi
├── assets.csv           daftar aset + lisensi
├── blender/
│   ├── kit.py           helper scene (material, teks, kamera, render)
│   ├── build.py         orkestrator: TASKS JSON -> frame
│   └── scenes/
│       ├── s01_hook.py
│       └── s02_empat.py
└── notebook/
    └── kaggle_cells.md
```

## Reproducibility

- Setiap run mencetak `git rev-parse HEAD`; commit itu yang mendefinisikan hasil.
- Blender dipin ke 4.5.9, font dari paket sistem (lihat `assets.csv`).
- Angka di video wajib berasal dari `research.md` §7.
