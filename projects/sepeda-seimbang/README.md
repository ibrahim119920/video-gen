# Sepeda Seimbang — explainer 60 detik (Aura3D)

Video vertikal **1080×1920, 30 fps, 60,0 detik**, tanpa voiceover.
Semua informasi disampaikan lewat teks, subtitle, dan anotasi 3D dalam
Bahasa Indonesia.

## Hasil

| Berkas | Isi |
| --- | --- |
| `out/sepeda_seimbang_1080x1920.mp4` | video final 60,0 detik (1.800 frame, H.264) |
| `out/c01_diam_bergerak.mp4` … `out/c07_gerak_penutup.mp4` | tujuh klip per babak |
| `out/preview-grid.jpg` | contact sheet 8 frame |

`out/` diabaikan git (berkas tetap tersimpan lokal). Video tanpa audio,
konsisten dengan seri explainer sebelumnya.

## Peta babak

| # | Durasi | Berkas | Isi | Teks kunci |
| --- | --- | --- | --- | --- |
| 1 | 6 s | `c01_diam_bergerak` | Split atas–bawah: sepeda diam roboh, sepeda melaju tetap tegak | “Sepeda itu aneh. Diam, ia roboh.” / “Melaju, ia tegak sendiri.” |
| 2 | 10 s | `c02_mitos_giroskop` | Roda depan terisolasi, roda kedua berputar berlawanan; vektor L saling menghapus | “Giroskop bukan satu-satunya jawaban.” |
| 3 | 11 s | `c03_pendulum_terbalik` | Pendulum terbalik: pusat massa, garis tumpu, plumb line, jatuh | “Saat diam, sepeda seperti tongkat di ujung jari.” |
| 4 | 12 s | `c04_setir_miring` | Pengendara bermanuver; roda depan mengejar kemiringan; jejak kontak membentuk S | “Roda depan berbelok ke arah kemiringan.” / “Jejak kedua roda membentuk huruf S.” |
| 5 | 9 s | `c05_geometri_garpu` | Tanpa pengendara; pulsa sadel; close-up sumbu kemudi, trail, dan kontak roda | “Bahkan tanpa pengendara, geometri garpu depan membantu.” / “Asalkan sepedanya cukup cepat.” |
| 6 | 7 s | `c06_terlalu_lambat` | Kecepatan turun, osiloskop sudut miring membesar, koreksi terlambat, sepeda jatuh | “Ayunan setir makin lebar dan cepat.” / “Koreksi tak lagi cukup.” |
| 7 | 5 s | `c07_gerak_penutup` | Golden hour, crane up, kartu penutup | “Seimbang karena bergerak.” / “Bukan karena diam — tapi karena terus mengoreksi.” |

## Fisika yang dirujuk

- **Jones (1970), “The stability of the bicycle”** — efek giroskop bukan syarat
  stabilitas; geometri kemudi (termasuk trail) dan koreksi setir berperan.
- **Kooijman, Meijaard, Papadopoulos, Ruina, Schwab (2011), “A bicycle can be
  self-stable without gyroscopic or caster effects”, Science 332:339–342** —
  sepeda dapat stabil sendiri tanpa giroskop; distribusi massa dan geometri
  kemudi menentukan.
- **Meijaard, Papadopoulos, Ruina, Schwab (2007), “Linearized dynamics of a
  bicycle”, Proc. R. Soc. A 463:1955–1982** — model acuan dinamika sepeda.

Babak 3 memakai kerangka pendulum terbalik: dengan titik tumpu di bawah pusat
massa, posisi tegak adalah kesetimbangan tidak stabil. Selama pusat massa tepat
di atas garis tumpu, sepeda bisa bertahan; begitu pusat massa bergeser keluar,
momen gravitasi memperbesar kemiringan dan menjatuhkannya. Babak 4–5
menunjukkan koreksi setir: roda depan berbelok ke arah kemiringan sehingga titik
tumpu bergerak kembali ke bawah pusat massa. Babak 6 menunjukkan batasnya: pada
kecepatan rendah, koreksi setir tidak lagi cukup cepat.

Angka “cukup cepat” sengaja kualitatif; ambang kecepatan bergantung pada
geometri, massa, dan pengendara, sehingga tidak ada satu angka universal.

## Struktur

```
src/
  main.ts           pemuat scene (?scene=N), hook capture deterministik
  bike.ts           sepeda prosedural: rangka, roda, garpu, steer assembly, rider
  ghost.ts          sepeda transparan untuk babak 2–3
  stage.ts          sky, environment, lampu, grid, panah, ring, plumb line
  overlay.ts        teks, subtitle, HUD speedometer, osiloskop
  style.css         layout 1080×1920, split panel, HUD
  scenes/s1–s7.ts   satu modul per babak; update(t) murni fungsi waktu
scripts/
  shoot.mjs         render frame via Playwright + Chrome (deterministik)
  render-final.mjs  render semua babak, vstack S1, encode, concat, verifikasi
```

## Cara render

Prasyarat: Node 20+, Chrome terpasang, `ffmpeg` dan `ffprobe` di `PATH`.
`scripts/shoot.mjs` memakai path Chrome default
`C:\Program Files\Google\Chrome\Application\chrome.exe`; jika Chrome berada di
lokasi lain, ubah konstanta `chrome` di skrip itu atau lewati `--chrome "..."`.

```powershell
cd projects/sepeda-seimbang
npm install
npm run render
```

`npm run render` menjalankan build, merender 1.800 frame, menumpuk dua panel
S1, mengencode tujuh klip, menyatukannya menjadi 60 detik, lalu memverifikasi
jumlah frame dengan `ffprobe`. Perkiraan waktu: sekitar 10 menit pada mesin
dengan Chrome + WebGL2 yang aktif.

Untuk review satu scene:

```powershell
npm run build
node scripts/shoot.mjs --scene 4 --times 1.5,4.5,9,11.5 --out .aura3d/review --format jpg
```

Untuk merender ulang satu babak saja:

```powershell
node scripts/render-final.mjs --only=4 --skip-build
```

Perintah ini hanya merender ulang frame dan klip babak 4; video final tidak
dirakit ulang. Jalankan `node scripts/render-final.mjs --skip-render` setelahnya
untuk mengencode semua klip dari frame yang ada dan menyusun ulang video final.

## Catatan teknis

- **S1** dirender sebagai dua pass terpisah 1080×960 (`?scene=1&panel=left|right`)
  lalu di-`vstack` dengan ffmpeg. Dua app Aura3D dalam satu halaman tidak
  merefleksikan transform runtime secara konsisten, sehingga split-screen
  satu app ditinggalkan. Garis pemisah ikut terekam di tepi atas panel kanan.
- **Capture deterministik**: `autoStart:false`, `app.ready()`,
  `__AURA_CAPTURE__.setTime(t)`, `app.stepAsync(1/30)`, lalu screenshot
  Playwright. Tidak ada waktu nyata atau frame dropping.
- **Aura3D 5.7.2**. Sepeda sepenuhnya prosedural; roda, garpu, dan batang
  kemudi adalah node terpisah agar dapat dianimasikan.
- **Post**: ACES, bloom 0.4–0.62 (threshold 0.80–0.86), vignette ringan.
  Depth of field hanya di babak 2 dan 5.
- **Tanpa audio**. Musik/VO tidak ditambahkan agar konsisten dengan
  `projects/mbg-2027` dan agar teks menjadi satu-satunya pembawa informasi.
