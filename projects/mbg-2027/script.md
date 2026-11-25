# Naskah — "Rp180 Triliun: Empat Kemungkinan"

- **Durasi:** 52 detik
- **Format:** 1080×1920 (9:16), 30 fps, 1.560 frame
- **Narasi:** TTS Indonesia, `id-ID-ArdiNeural`, rate −4%
- **Nada:** tenang, informatif, tanpa retorika politik
- **Aturan angka:** setiap angka di layar harus ada di `research.md` §7

---

## 1. Timeline

| # | Mulai | Durasi | Frame | Fungsi |
| --- | --- | --- | --- | --- |
| S01 | 0:00 | 8 s | 1–240 | Hook: angka dan aritmetika |
| S02 | 0:08 | 7 s | 241–450 | Empat kemungkinan |
| S03 | 0:15 | 8 s | 451–690 | Infrastruktur |
| S04 | 0:23 | 9 s | 691–960 | Kesehatan |
| S05 | 0:32 | 7 s | 961–1.170 | Transportasi publik |
| S06 | 0:39 | 7 s | 1.171–1.380 | Pendidikan & perumahan |
| S07 | 0:46 | 6 s | 1.381–1.560 | Batas klaim |

Durasi final dihitung ulang dari panjang audio TTS hasil ukur
(`timeline.json`), dengan aturan `durasi = max(rencana, audio + 0,8 s)`.
Angka di tabel ini adalah rencana, bukan hasil ukur.

---

## 2. Narasi per scene

### S01 — Hook (8 s)

> Tahun 2027, anggaran MBG dipangkas dari Rp240 triliun menjadi Rp60 triliun.
> Rp180 triliun berpindah. Jadi apa?

Teks layar:

```
SIMULASI 2027 · ANGGARAN MBG        (HUD, 30 px, tracking lebar)
Rp180                               (220 px)
t r i l i u n                        (86 px, aksen)
dari Rp240 triliun,                 (serif italic, 58 px)
tersisa Rp60.                       (serif italic, 58 px)
```

Sumber di layar: `Premis simulasi` (bukan data eksternal).

### S02 — Empat kemungkinan (7 s)

> Empat kemungkinan. Masing-masing menyerap seluruh Rp180 triliun.
> Kita tidak menjumlahkannya.

Teks layar:

```
Empat kemungkinan

[ikon] Infrastruktur        Rp180 T
[ikon] Kesehatan            Rp180 T
[ikon] Transportasi         Rp180 T
[ikon] Pendidikan & rumah   Rp180 T

Satu anggaran, bukan empat. (aksen)
```

### S03 — Infrastruktur (8 s)

> Infrastruktur. Rp80 triliun untuk jalan, setara 14.388 kilometer.
> Rp50 triliun lagi untuk rel, setara 850 kilometer.

Teks layar:

```
INFRASTRUKTUR · Rp80 T
14.388 km
jalan nasional & daerah · setara biaya IJD

Rp50 T rel · 850 km ekuivalen
```

### S04 — Kesehatan (9 s)

> Kesehatan. Rp70 triliun untuk iuran BPJS: 138,9 juta orang selama setahun.
> Rp35 triliun untuk rumah sakit: 205 unit setara biaya.

Teks layar:

```
KESEHATAN · Rp70 T
138,9 juta
orang-tahun iuran PBI · Rp504.000/orang

Rp35 T rumah sakit · 205 unit setara
```

### S05 — Transportasi publik (7 s)

> Transportasi. Rp40 triliun untuk 348 kilometer jalur BRT.
> Rp10 triliun untuk 7.893 bus.

Teks layar:

```
TRANSPORTASI · Rp40 T
348 km
jalur khusus BRT · pembanding Trans Semarang

Rp10 T armada · 7.893 bus medium
```

### S06 — Pendidikan & perumahan (7 s)

> Pendidikan dan perumahan. Rp60 triliun memperbaiki tiga juta rumah.
> Rp50 triliun merevitalisasi 30.437 sekolah.

Teks layar:

```
PENDIDIKAN & PERUMAHAN · Rp60 T
3 juta
rumah tidak layak huni · Rp20 juta/unit

Rp50 T sekolah · 30.437 satuan
```

### S07 — Batas klaim (6 s)

> Semua ini hitungan biaya satuan. Bukan janji selesai dalam satu tahun.

Teks layar:

```
SIMULASI BIAYA SATUAN
Bukan janji output 2027.
Butuh multiyears, lahan, dan biaya pemeliharaan.
```

---

## 3. Hitungan kata dan tempo

| Scene | Kata | Target tempo |
| --- | --- | --- |
| S01 | 19 | 2,4 kata/s |
| S02 | 14 | 2,0 kata/s |
| S03 | 20 | 2,5 kata/s |
| S04 | 21 | 2,3 kata/s |
| S05 | 14 | 2,0 kata/s |
| S06 | 15 | 2,1 kata/s |
| S07 | 13 | 2,2 kata/s |
| **Total** | **116** | 2,2 kata/s |

116 kata ÷ 52 s = 2,2 kata/s. Ini tempo dokumenter lambat, sengaja, supaya
angka besar di layar punya waktu dibaca.

---

## 4. Aturan narasi

1. **Angka selalu berpasangan dengan anggarannya.** "138,9 juta" tanpa "Rp70 T"
   akan terbaca sebagai janji, bukan kapasitas.
2. **Kata "setara" wajib** setiap kali menyebut target simulasi.
3. **Tidak ada kata "akan dibangun", "dibangun", "terealisasi".** Gunakan
   "setara biaya", "ekuivalen", "kapasitas pembiayaan".
4. **Tidak ada nama partai, menteri, atau program politik.** Netral.
5. **S07 tidak boleh dipotong.** Tanpa itu, video menjadi klaim yang tidak
   bisa dipertanggungjawabkan.

---

## 5. TTS

| Item | Nilai |
| --- | --- |
| Engine | `edge-tts` (fallback `gTTS`) |
| Voice | `id-ID-ArdiNeural` |
| Rate | −4% |
| Format | MP3 24 kHz mono, lalu AAC 192 kbps saat mux |
| Per scene | satu file, `vo/s01.mp3` … `vo/s07.mp3` |
| Ukur | `ffprobe -show_entries format=duration` |
