# Naskah — "Rp180 Triliun: Empat Kemungkinan"

- **Durasi:** 58,07 detik (1.742 frame @ 30 fps)
- **Format:** 1080×1920 (9:16)
- **Narasi:** TTS Indonesia, `id-ID-ArdiNeural`, rate −4%
- **Nada:** tenang, informatif, tanpa retorika politik
- **Aturan angka:** setiap angka di layar harus ada di `research.md` §7

Semua durasi di bawah **terukur** dari MP3 hasil `edge-tts`
(`ffprobe -show_entries format=duration`), bukan perkiraan.
Aturan: `frame = max(150, round((vo + 1,0) × 30))`.

---

## 1. Timeline terukur

| # | Mulai | VO | Slot | Frame | Fungsi |
| --- | --- | --- | --- | --- | --- |
| S01 | 0,00 s | 9,05 s | 10,03 s | 301 | Hook: angka dan aritmetika |
| S02 | 10,03 s | 7,92 s | 8,93 s | 268 | Empat kemungkinan |
| S03 | 18,97 s | 7,97 s | 8,97 s | 269 | Infrastruktur |
| S04 | 27,93 s | 7,61 s | 8,60 s | 258 | Kesehatan |
| S05 | 36,53 s | 7,25 s | 8,23 s | 247 | Transportasi publik |
| S06 | 44,77 s | 5,83 s | 6,83 s | 205 | Pendidikan & perumahan |
| S07 | 51,60 s | 5,47 s | 6,47 s | 194 | Batas klaim |
| | | **51,10 s** | **58,07 s** | **1.742** | |

Setiap scene dirender sebagai rentang frame sendiri (1..n), bukan penomoran
global. Penyambungan dilakukan ffmpeg.

---

## 2. Narasi final

### S01 — Hook (9,05 s)

> MBG dipangkas dari 240 ke 60 triliun. 180 triliun berpindah. Jadi apa?

```
SIMULASI 2027 · ANGGARAN MBG     (HUD 30 px, tracking 1,35)
Rp180                            (210 px)
T R I L I U N                    (62 px, aksen, tracking 1,9)
dari Rp240 triliun,              (serif italic 56 px)
tersisa Rp60.                    (serif italic 56 px)
```

### S02 — Empat kemungkinan (7,92 s)

> Empat kemungkinan. Masing-masing menyerap 180 triliun. Tidak dijumlahkan.

```
Empat kemungkinan                          (64 px)
masing-masing menyerap Rp180 triliun       (serif italic 40 px)

[ikon] Infrastruktur
[ikon] Kesehatan
[ikon] Transportasi
[ikon] Pendidikan & rumah

Kita tidak menjumlahkannya.                (serif italic 40 px)
```

### S03 — Infrastruktur (7,97 s)

> Infrastruktur. 80 triliun jalan, setara 14.388 kilometer.

```
INFRASTRUKTUR · Rp80 T
14.388 km
jalan nasional & daerah, setara biaya IJD
Rp50 T rel · 850 km ekuivalen
Bina Marga · IJD 2025-2026 · Dephub
```

### S04 — Kesehatan (7,61 s)

> Kesehatan. 70 triliun BPJS, setara 138,9 juta orang.

```
KESEHATAN · Rp70 T
138,9 juta
orang-tahun iuran PBI, Rp504.000 per orang
Rp35 T rumah sakit · 205 unit setara
BPJS Kesehatan · Kemenkes
```

### S05 — Transportasi (7,25 s)

> Transportasi. 40 triliun, setara 348 kilometer BRT.

```
TRANSPORTASI · Rp40 T
348 km
jalur khusus BRT, pembanding Trans Semarang
Rp10 T armada · 7.893 bus medium
Antara · DAMRI 2024
```

### S06 — Pendidikan & perumahan (5,83 s)

> Pendidikan dan perumahan. 60 triliun, tiga juta rumah.

```
PENDIDIKAN & PERUMAHAN · Rp60 T
3 juta
rumah tidak layak huni, Rp20 juta per unit
Rp50 T sekolah · 30.437 satuan
PKP · BSPS · Kemendikdasmen 2025
```

### S07 — Batas klaim (5,47 s)

> Semua ini biaya satuan. Bukan janji selesai tahun ini.

```
SIMULASI BIAYA SATUAN
Bukan janji output 2027.
Butuh multiyears, lahan,
dan biaya pemeliharaan.
```

---

## 3. Catatan penulisan

1. **Satu angka diucapkan, angka kedua di layar.** S03 mengucapkan 14.388 km
   sementara 850 km rel hanya tampil; S05 mengucapkan 348 km, bus hanya
   tampil. Ini menjaga tempo dan mencegah dua angka besar diucapkan beruntun.
2. **Kata "setara" wajib** setiap kali target simulasi diucapkan.
3. **Tidak ada "akan dibangun" / "terealisasi".** Gunakan "setara",
   "ekuivalen", "kapasitas pembiayaan".
4. **S07 tidak boleh dipotong.**
5. Naskah versi pertama (116 kata tertulis, ~170 kata terucap) berdurasi
   75,94 s — 24 s di atas target. Angka yang ditulis penuh ("seratus tiga
   puluh delapan koma sembilan juta") memakan 7 kata untuk satu angka.

---

## 4. TTS

| Item | Nilai |
| --- | --- |
| Engine | `edge-tts` |
| Voice | `id-ID-ArdiNeural` |
| Rate | −4% |
| Laju terukur | ±2,0 kata/detik |
| Format | MP3 24 kHz mono → AAC 192 kbps saat mux |
| Per scene | `vo/s01.mp3` … `vo/s07.mp3` |
| Panjang total | 51,10 s |
