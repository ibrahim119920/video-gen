# Shot list — MBG Rp180 Triliun

Shot list ini menggantikan `storyboard.md` yang lama (7 shot × 8 detik).
Shot baru: **2–3 detik per shot**, 20–24 shot untuk total 50–60 detik.

Alasannya terukur: pada 7 shot × 8 detik, kamera hanya bergerak 12% jarak
dalam 8 detik (1,5%/detik). Pada shot 2,4 detik, gerakan yang sama terjadi
3,3× lebih cepat. Itu yang membuat video terasa hidup, bukan gerakan yang
lebih besar.

---

## A. Aturan yang mengikat semua shot

1. **Satu shot, satu ide, satu gerakan utama.** Boleh ada gerakan sekunder,
   tapi tidak boleh dua gagasan bersaing.
2. **Setiap shot wajib punya minimal satu gerakan**: kamera, objek, atau teks.
   Diam total hanya boleh untuk shot penutup.
3. **Tidak ada dua shot berurutan dengan jenis gerakan sama.** Push-in,
   pull-back, orbit, tilt, track, counter angka, teks masuk — dirotasi.
4. **Maksimal 7 kata diucapkan per shot.** VO mengalir terus melintasi cut;
   yang dipotong adalah gambar, bukan audio.
5. **Maksimal 12 kata di layar per shot.** Angka besar dihitung sebagai satu
   kata.
6. **Semua angka di layar harus ada di `research.md` §7.**
7. **Durasi total 50–60 detik.** 20–24 shot × 2,0–3,0 detik.

---

## B. Enam pertanyaan naratif (jawab dulu, sebelum shot)

1. Satu kalimat yang harus diingat penonton setelah video selesai:
2. Tiga angka paling penting, berurutan:
3. Emosi yang dibangun: (mis. kaget → paham → percaya)
4. Dalam detik ke berapa penonton harus sudah paham topiknya:
5. Ada perbandingan atau twist? Bila ada, di shot berapa:
6. Kalimat penutup / call-to-action:

---

## C. Templat shot

Isi satu baris per shot. Kolom `t` boleh kosong — saya hitung dari durasi.

| # | dur | VO (≤7 kata) | Layar (≤12 kata) | Visual | Gerak utama | Transisi |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | 2,5 | | | | | |
| 02 | 2,5 | | | | | |
| 03 | 2,5 | | | | | |
| 04 | 2,5 | | | | | |

### Kosakata gerak yang tersedia

| Jenis | Contoh | Biaya |
| --- | --- | --- |
| Kamera push-in | kamera maju 8–15% dalam satu shot | gratis |
| Kamera pull-back | kamera mundur, objek mengecil | gratis |
| Orbit | kamera mengelilingi subjek 10–25° | gratis |
| Tilt / pan | kamera naik, turun, menyamping | gratis |
| Track lateral | kamera geser sejajar bidang | gratis |
| Counter angka | angka naik/turun berubah per frame | gratis |
| Teks masuk | kata per kata, baris per baris | gratis |
| Objek meluncur | bus masuk frame, rumah muncul | gratis |
| Cahaya berubah | emission naik/turun | gratis |
| Transisi ffmpeg | cut keras, slide 4–6 frame, whip | ~0 detik render |

---

## D. Contoh tiga shot (bahan yang sudah ada)

| # | dur | VO | Layar | Visual | Gerak | Transisi |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | 2,5 | Anggaran MBG dipangkas. | 240 → 60 | skyline malam, dua blok angka besar di kiri | pull-back cepat, angka 240 mengecil | cut |
| 02 | 2,5 | 180 triliun berpindah. | Rp180 T | angka melesat masuk dari kanan, kota di belakang | orbit 15° ke kiri | cut |
| 03 | 2,5 | Jadi apa? | EMPAT KEMUNGKINAN | empat panggung menyala berurutan | tilt turun | slide 5 frame |

---

## E. Batas teknis (yang bisa saya bangun)

- Geometri: kotak, silinder, limas. Flat shading, tanpa tekstur gambar.
- Material: warna solid, emission untuk teks dan lampu.
- Teks: Liberation Sans Bold + Liberation Serif Italic. Tanpa font lain.
- Kamera: lensa 24–50 mm, gerak bebas.
- Tidak ada: karakter manusia, rigging, cairan, asap volumetrik, simulasi.
- Biaya render: ~1,0–1,9 detik per frame, tidak tergantung panjang shot.

---

## F. Yang saya butuhkan kembali

Bagian B (enam jawaban) + tabel Bagian C yang sudah terisi.
Kalau ada shot yang visualnya belum ada di set sekarang, sebutkan — saya
bangun set baru, dan itu menambah waktu, bukan kualitas.
