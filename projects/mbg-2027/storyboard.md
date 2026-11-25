# Storyboard — "Rp180 Triliun: Empat Kemungkinan"

Basis visual: tiga referensi pengguna — low-poly 3D, langit bergradasi, bayangan
lembut, teks besar, label HUD kecil ber-tracking lebar, dan satu kalimat serif
miring sebagai penutup komposisi.

---

## 0. Sistem visual

| Unsur | Ketentuan |
| --- | --- |
| Geometri | hanya kotak, silinder, dan limas. Tanpa tekstur, tanpa displacement |
| Material | diffuse kasar + emission untuk teks dan sumber cahaya |
| Sudut | bevel 0,02–0,04 pada semua kotak agar tepi menangkap cahaya |
| Langit | gradasi dua warna lewat ColorRamp pada sumbu Z dunia |
| Kabut | palsu: material makin terang dan desaturasi makin jauh dari kamera |
| Bayangan | satu sun, sudut 4–6° (lembut), tanpa lampu lain kecuali fill emission |
| Teks | selalu rata tengah secara vertikal terhadap kotak teksnya |
| Gerak | push-in 3–6% per scene, tanpa cut di dalam scene |
| Transisi | potongan keras antar scene; tidak ada fade (menjaga tempo) |

### Palet per scene

| Scene | Langit atas | Langit horizon | Aksen |
| --- | --- | --- | --- |
| S01 | `#070A14` | `#E8934E` | `#F0A44F` |
| S02 | `#1F4F7A` | `#DDEFF5` | `#C25A0A` (tinta gelap `#12203A`) |
| S03 | `#12233A` | `#F0B47A` | `#F0A44F` |
| S04 | `#123A46` | `#C9E6E0` | `#7FD1C1` |
| S05 | `#1B2A55` | `#F5C48A` | `#E8A03C` |
| S06 | `#2A2340` | `#F3D2A8` | `#D9A05B` |
| S07 | `#070A14` | `#3A3350` | `#F0A44F` |

---

## S01 — Hook (301 frame = 10,03 s)

- **Set:** skyline tiga lapis di atas bidang tanah gelap. Lapis jauh `#2A2B44`
  (y≈30), tengah `#1B1C2E` (y≈16), dekat `#0D0E16` (y≈6). Tinggi 2–22 m.
- **Langit:** malam ke arah jingga; piringan matahari terbenam di belakang
  skyline, emission 1,6.
- **Kamera:** 35 mm, tinggi 4 m, jarak 18 m, sedikit menengadah.
  Push-in 2,8 m sepanjang 240 frame (dolly murni, rotasi tetap).
- **Teks:** semua menempel di kamera (billboard), jadi tidak ikut parallax.
  - HUD kiri-atas, 30 px, `#C9B7A4`, tracking 1,35
  - "Rp180" 220 px, `#FFE9CF`, di y +0,10
  - "triliun" 86 px, `#F0A44F`, tracking 1,6, di y +0,005
  - Dua baris serif miring 58 px, `#D9C7B4`, di y −0,10 dan −0,145
- **Gerak teks:** muncul statis; hanya kamera yang bergerak.

## S02 — Empat kemungkinan (268 frame = 8,93 s)

- **Set:** empat panggung heksagonal bertumpuk vertikal di ruang kosong,
  latar tiga balok raksasa yang diburamkan warna (bukan DOF).
- **Prop per panggung:** jembatan, rumah sakit berpalang, bus, rumah.
- **Kamera:** 50 mm, tegak lurus bidang teks (tidak ada distorsi perspektif
  pada huruf), drift lateral 0,3 m.
- **Teks:** di dunia, bukan billboard, karena kamera menghadap lurus.
  Teks diputar 90° pada X supaya normalnya menghadap kamera.
  - Judul "Empat kemungkinan" 64 px, tinta gelap, di z 2,95
  - Subtitle serif miring 40 px di z 2,52
  - Label 44 px kiri (x −0,28), panggung di x −1,05
  - Penutup "Kita tidak menjumlahkannya." 40 px di z −2,56
- **Kontras:** tinta gelap di langit terang. Angka besar tidak diulang empat
  kali; nominal Rp180 triliun ada di subtitle.
- **Gerak:** seluruh rig berputar 2° pada sumbu Z; teks tidak ikut.

## S03 — Infrastruktur (269 frame = 8,97 s)

- **Set:** jalan layang rendah melintang, pilar beton, siluet gedung di belakang.
- **Warna:** senja keemasan, aspal `#2A2A32`, beton `#B8AFA0`.
- **Teks:** HUD "INFRASTRUKTUR · Rp80 T"; angka "14.388 km" 150 px;
  sub "jalan nasional & daerah · setara biaya IJD" 40 px; baris kedua
  "Rp50 T rel · 850 km ekuivalen" 44 px.

## S04 — Kesehatan (258 frame = 8,60 s)

- **Set:** blok rumah sakit putih-hijau, deret jendela, satu palang merah
  emission di fasad. Kamera lebih rendah agar gedung terasa besar.
- **Warna:** pagi sejuk, `#C9E6E0` → `#123A46`.
- **Teks:** "138,9 juta" 150 px; sub "orang-tahun iuran PBI · Rp504.000/orang";
  baris kedua "Rp35 T rumah sakit · 205 unit setara".

## S05 — Transportasi (247 frame = 8,23 s)

- **Set:** jalan dua lajur, tiga bus oranye berbaris, halte, tiang lampu.
- **Warna:** siang cerah, aspal gelap, bus `#E8A03C`.
- **Teks:** "348 km" 150 px; sub "jalur khusus BRT · pembanding Trans Semarang";
  baris kedua "Rp10 T armada · 7.893 bus medium".

## S06 — Pendidikan & perumahan (205 frame = 6,83 s)

- **Set:** deret rumah kecil ber atap limas dan satu gedung sekolah di ujung.
- **Warna:** sore hangat, `#F3D2A8` → `#2A2340`.
- **Teks:** "3 juta" 150 px; sub "rumah tidak layak huni · Rp20 juta/unit";
  baris kedua "Rp50 T sekolah · 30.437 satuan".

## S07 — Batas klaim (194 frame = 6,47 s)

- **Set:** kembaran S01 tetapi lebih gelap, skyline lebih rendah, tanpa
  matahari. Kamera statis.
- **Teks:** "SIMULASI BIAYA SATUAN" 40 px HUD; tiga baris 54 px:
  "Bukan janji output 2027." / "Butuh multiyears, lahan," /
  "dan biaya pemeliharaan." Baris pertama aksen.

---

## Legenda sumber di layar

| Scene | Tag |
| --- | --- |
| S03 | Bina Marga · IJD 2025–2026 · Dephub |
| S04 | BPJS Kesehatan · Kemenkes |
| S05 | Antara · DAMRI 2024 |
| S06 | PKP · BSPS · Kemendikdasmen 2025 |

Tag 26 px, `#8C8C96`, di 6% bawah frame, hanya muncul 3 detik terakhir scene.
