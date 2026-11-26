# Sepeda Seimbang — explainer 60 detik (Aura3D)

Video vertikal **1080×1920, 30 fps, 60,0 detik**, tanpa voiceover.
Semua informasi disampaikan lewat teks, subtitle, dan anotasi 3D dalam
Bahasa Indonesia.

## Hasil

| Berkas | Isi |
| --- | --- |
| `out/sepeda_seimbang_1080x1920.mp4` | video final 60,0 detik (1.800 frame, H.264) |
| `out/c01_diam_bergerak.mp4` … `out/c09_moral.mp4` | sembilan klip per babak |
| `out/preview-grid.jpg` | contact sheet 3×3, sembilan frame |

`out/` diabaikan git (berkas tetap tersimpan lokal). Video tanpa audio,
konsisten dengan seri explainer sebelumnya.

## Naskah (tepat)

1. “Sepeda itu aneh. Diam, ia roboh. Melaju, ia tetap berdiri.”
2. “Banyak orang mengira rahasianya efek giroskop dari roda yang berputar.”
3. “Namun bukan itu jawabannya”
4. “Coba kamu berdirikan tongkat di telapak tangan kamu. Tangan kamu diam,
   tongkat akan jatuh.”
5. “Namun jika kamu gerakkan tangan mengikuti arah miringnya tongkat,
   tongkatnya akan tetap tegak.”
6. “Bagaimana dengan sepeda? Secara alami, setang dan ban depannya akan selalu
   belok mengikuti miringnya sepeda.”
7. “Kamu pegang sadelnya lalu miringkan sepeda ke kiri, ban depannya juga akan
   berbelok ke kiri.”
8. “Miringkan ke kanan, ban depannya akan berbelok ke kanan. Syaratnya cuma
   satu: tetaplah bergerak maju.”
9. “Pesan moral hari ini adalah: terus bergerak maju dan mengoreksi diri,
   adalah syarat kita bertahan di kehidupan ini.”

## Peta babak

| # | Durasi | Berkas | Isi | Teks kunci |
| --- | --- | --- | --- | --- |
| 1 | 6 s | `c01_diam_bergerak` | Split atas–bawah: sepeda diam roboh, sepeda melaju tetap tegak | “Sepeda itu aneh. Diam, ia roboh.” / “Melaju, ia tetap berdiri.” |
| 2 | 6 s | `c02_mitos_giroskop` | Roda depan terisolasi; panah momentum sudut; roda kedua mulai masuk | “Banyak orang mengira rahasianya efek giroskop dari roda yang berputar.” |
| 3 | 4 s | `c03_bukan_jawabannya` | Roda kedua berlawanan arah; panah saling menghapus; “Net L ≈ 0” | “Namun bukan itu jawabannya” |
| 4 | 8 s | `c04_tongkat_jatuh` | Telapak diam; tongkat miring, plumb keluar dari ring, lalu jatuh | “Coba kamu berdirikan tongkat di telapak tangan kamu. Tangan kamu diam, tongkat akan jatuh.” |
| 5 | 8 s | `c05_tongkat_tegak` | Tangan bergerak mengikuti kemiringan; tongkat tetap tegak, ring hijau | “Namun jika kamu gerakkan tangan mengikuti arah miringnya tongkat, tongkatnya akan tetap tegak.” |
| 6 | 8 s | `c06_setir_miring` | Pengendara bermanuver; roda depan mengejar kemiringan; jejak membentuk S | “Bagaimana dengan sepeda? Secara alami, setang dan ban depannya akan selalu belok mengikuti miringnya sepeda.” |
| 7 | 6 s | `c07_miring_kiri` | Tangan memegang sadel; sepeda miring kiri; ban depan berbelok kiri | “Kamu pegang sadelnya lalu miringkan sepeda ke kiri, ban depannya juga akan berbelok ke kiri.” |
| 8 | 8 s | `c08_miring_kanan` | Sepeda miring kanan, ban depan ke kanan; lalu bergerak maju | “Miringkan ke kanan, ban depannya akan berbelok ke kanan. Syaratnya cuma satu: tetaplah bergerak maju.” |
| 9 | 6 s | `c09_moral` | Golden hour, crane up, kartu penutup | “Pesan moral hari ini adalah: terus bergerak maju dan mengoreksi diri, adalah syarat kita bertahan di kehidupan ini.” |

## Fisika yang dirujuk

- **Jones (1970), “The stability of the bicycle”** — efek giroskop bukan syarat
  stabilitas; geometri kemudi (termasuk trail) dan koreksi setir berperan.
- **Kooijman, Meijaard, Papadopoulos, Ruina, Schwab (2011), “A bicycle can be
  self-stable without gyroscopic or caster effects”, Science 332:339–342** —
  sepeda dapat stabil sendiri tanpa giroskop; distribusi massa dan geometri
  kemudi menentukan.
- **Meijaard, Papadopoulos, Ruina, Schwab (2007), “Linearized dynamics of a
  bicycle”, Proc. R. Soc. A 463:1955–1982** — model acuan dinamika sepeda.

Babak 4–5 memakai demonstrasi tongkat di telapak tangan sebagai pendulum
terbalik: selama tangan diam, pusat massa tongkat bergeser keluar dari bidang
tumpu dan gravitasi menjatuhkannya; jika tangan bergerak mengikuti kemiringan,
tumpuan tetap berada di bawah pusat massa. Babak 6–8 memindahkan gagasan yang
sama ke sepeda: roda depan berbelok ke arah kemiringan, sehingga jejak kontak
bergerak kembali ke bawah pusat massa. Babak 8 menutup dengan syarat kualitatif
— sepeda harus tetap bergerak maju.

Angka “cukup cepat” tidak dipakai lagi sebagai ambang universal. Kecepatan
memang memengaruhi kemudahan koreksi, tetapi ambangnya bergantung pada
geometri, massa, dan pengendara; karena itu narasi baru hanya mengatakan
“tetaplah bergerak maju”.

## Struktur

```
src/
  main.ts           pemuat scene (?scene=N), hook capture deterministik
  bike.ts           sepeda prosedural: rangka, roda, garpu, steer assembly, rider
  ghost.ts          sepeda transparan untuk babak 2–3
  hand.ts           telapak terbuka dan tangan yang menggenggam sadel
  stick.ts          rig tongkat: batang, bola massa, ring tumpu, plumb, panah gravitasi
  lean.ts           panggung sepeda miring + tangan di sadel (dipakai S7–S8)
  stage.ts          sky, environment, lampu, grid, panah, ring, plumb line
  overlay.ts        teks, subtitle, HUD sudut, osiloskop
  style.css         layout 1080×1920, split panel, HUD
  scenes/s1–s9.ts   satu modul per babak; update(t) murni fungsi waktu
scripts/
  shoot.mjs         render frame via Playwright + Chrome (deterministik)
  render-final.mjs  render semua babak, vstack S1, encode, concat, verifikasi
```

Babak 2 dan 3 berbagi satu panggung: `s2.ts` mengekspor `buildMyth()`, dan
`s3.ts` memanggil `update(t + 6)` supaya reveal melanjutkan keadaan akhir S2
tanpa lompatan kamera.

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
S1, mengencode sembilan klip, menyatukannya menjadi 60 detik, lalu
memverifikasi jumlah frame dengan `ffprobe`. Perkiraan waktu: sekitar 15 menit
pada mesin dengan Chrome + WebGL2 yang aktif.

Untuk review satu scene:

```powershell
npm run build
node scripts/shoot.mjs --scene 7 --times 1,3,5 --out .aura3d/review --format jpg
```

Untuk merender ulang satu babak saja:

```powershell
node scripts/render-final.mjs --only=7 --skip-build
```

Perintah ini hanya merender ulang frame dan klip babak 7; video final tidak
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
  kemudi adalah node terpisah agar dapat dianimasikan. `setScale` menerima
  satu argumen (`number` atau `[x, y, z]`), bukan tiga angka.
- **Post**: ACES, bloom 0.4–0.62 (threshold 0.80–0.86), vignette ringan.
  Depth of field hanya di babak 2–5 (mitos/reveal dan dua babak tongkat).
- **Tanpa audio**. Musik/VO tidak ditambahkan agar konsisten dengan
  `projects/mbg-2027` dan agar teks menjadi satu-satunya pembawa informasi.
