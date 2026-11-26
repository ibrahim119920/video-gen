# Storyboard — Sepeda Seimbang

Format 1080×1920 (9:16), 30 fps, total 60 detik. Tanpa voiceover; teks Indonesia
menjadi narasi. Semua transisi antar babak adalah hard cut.

## Naskah

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

## 01 — Diam vs bergerak (6 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–6.0 | Split atas–bawah. Panel atas: sepeda tanpa pengendara berdiri di grid, lalu roboh ke samping. Panel bawah: sepeda yang sama melaju, sedikit goyah, tetap tegak. | Tag `DIAM` (merah, kiri atas) dan `BERGERAK` (hijau, kanan atas, tepat di bawah garis pemisah). |
| 0.7–3.35 | Panel atas mulai miring pada 1,05 s dan menyentuh lantai sekitar 3,35 s; debu impact muncul. Panel bawah terus melaju. | “Sepeda itu aneh. **Diam, ia roboh.**” |
| 3.35–5.72 | Sepeda atas tetap jatuh; sepeda bawah terus bergerak; grid bergulir. | “Melaju, ia **tetap berdiri.**” |

Teknis: dua pass 1080×960 (`?scene=1&panel=left|right`) di-`vstack`.
Garis cyan 2 px di tepi atas panel kanan menjadi pembatas di tengah frame.
Jatuhnya panel atas dipercepat (2,3 s) agar bertepatan dengan akhir kalimat
pertama.

## 02 — Mitos giroskop (6 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–2.2 | Close-up roda depan terisolasi, berputar; fork dan batang kemudi terlihat. | Corner `MITOS GIROSKOP`. |
| 2.2–4.8 | Panah L cyan muncul di hub; ring L berdenyut. | “Banyak orang mengira rahasianya” |
| 3.25–5.75 | Kamera mulai menarik ke belakang. | “**efek giroskop** dari roda yang berputar.” |
| 4.8–6.0 | Roda amber kedua meluncur masuk ke poros dan berputar berlawanan; panah C amber muncul. | — |

Teknis: `s2.ts` mengekspor `buildMyth()` dengan garis waktu 10 s. S2 hanya
memakai 0–6 s; S3 melanjutkan 6–10 s.

## 03 — Bukan jawabannya (4 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–0.6 | Roda amber kedua hampir masuk penuh; panah L dan C terlihat. | Corner `MITOS GIROSKOP`. |
| 0.4–3.7 | Kamera menarik ke belakang; ghost bike utuh terlihat. | “Namun **bukan itu jawabannya**” |
| 1.5–3.6 | Panah L dan C mengecil menuju hub; callout “Net L ≈ 0”. | — |
| 2.1–3.6 | Ghost bike tetap tegak; callout hijau “✓ tetap seimbang”. | — |

Teknis: `s3.ts` memakai `buildMyth()` yang sama dan memanggil
`update(t + 6)`, sehingga reveal dimulai dari keadaan akhir S2 tanpa lompatan.
Roda amber adalah roda kedua yang momentum sudutnya berlawanan; jumlah
momentum sudut mendekati nol, tetapi sepeda tetap seimbang.

## 04 — Tongkat jatuh (8 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–2.3 | Tangan terbuka di atas lantai studio; tongkat 0,78 m berdiri di telapak; ring tumpu putih; plumb kuning; panah gravitasi merah di bola massa. | Corner `TANGAN DIAM`. |
| 0.8–4.3 | Tangan tidak bergerak. Tongkat mulai miring pada 2,3 s; plumb bergeser keluar dari ring; ring berubah merah. | “Coba kamu berdirikan tongkat di **telapak tangan** kamu.” |
| 4.3–7.7 | Tongkat terus miring, lalu tergelincir dari ujung jari dan jatuh ke lantai sekitar 5,9 s; tangan tetap diam. | “Tangan kamu diam, tongkat akan **jatuh.**” |
| 4.3–7.55 | Callout merah “✕ jatuh” di kiri bawah. | — |

Teknis: `makeHandRig()` dari `src/stick.ts`; basis tongkat di `y = 0.006`,
ring radius 0,06 m. Depth of field halus (focus 4,1 m). Kamera push-in pelan
dan bergeser ke kanan mengikuti tongkat yang jatuh.

## 05 — Tongkat tegak (8 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–1.0 | Tangan di tengah, tongkat tegak, ring hijau. | Corner `TANGAN MENGIKUTI`. |
| 1.0–7.4 | Tangan bergeser halus ±0,105 m; tongkat miring ±4,2°; ring hijau tetap berada di bawah tongkat. | “Namun jika kamu gerakkan tangan **mengikuti arah miringnya tongkat,**” |
| 4.4–7.7 | Tangan terus mengoreksi; tongkat tetap tegak. | “tongkatnya akan tetap **tegak.**” |
| 4.4–7.55 | Callout hijau “✓ tetap tegak”. | — |

Teknis: tangan dan tongkat berbagi satu rig; rotasi tongkat terjadi di basis,
sehingga gerak tangan tidak menggeser titik tumpu secara visual. Kamera
push-in tipis; depth of field halus.

## 06 — Setir mengejar miring (8 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–1.8 | Pengendara melaju lurus; kamera chase 3/4 rendah; dua ring kontak (cyan belakang, amber depan). | Corner `SETIR MENGEJAR MIRING`; HUD sudut miring/setir. “Bagaimana dengan **sepeda?**” |
| 1.8–5.0 | Kamera bergeser ke samping; sepeda berayun; roda depan berbelok mengikuti kemiringan; jejak kontak mulai tergambar. | “Secara alami, setang dan **ban depannya**” |
| 5.0–8.0 | Kamera naik ke high 3/4; jalur S terlihat; pengendara di ujung jalur; panah setir di kontak depan. | “akan selalu belok mengikuti **miringnya sepeda.**” |

Teknis: jalur sinusoidal `x = 1.6 sin(2πu/10.5)`, kecepatan 2,4 m/s,
kemiringan dan setir adalah fungsi dari kelengkungan. Jejak kontak
belakang/depan dibangun dari 48 chunk dan di-reveal mengikuti jarak tempuh.
HUD menampilkan sudut miring dan sudut setir, bukan ambang kecepatan.

## 07 — Miring kiri (6 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–1.3 | Sepeda tanpa pengendara di atas turntable; tangan menggenggam sadel dari sisi kanan; kamera high rear 3/4. | Corner `MIRING KIRI`; HUD 0°. |
| 1.3–2.9 | Sepeda miring kiri 14°; roda depan berbelok kiri 26°; ring kontak dan panah setir cyan bergerak; tangan ikut leaning. | “Kamu pegang sadelnya lalu **miringkan sepeda ke kiri,**” |
| 3.2–5.7 | Tahan kemiringan; roda depan tetap berbelok kiri; HUD 14° / 26° KIRI. | “ban depannya juga akan **berbelok ke kiri.**” |

Teknis: `makeLeanStage()` memutar rig di sekitar garis kontak ban (bukan origin
lantai), sehingga roda tetap menapak saat frame miring. Panah setir di kontak
depan menunjukkan arah ban. Turntable radius 1,05 m menjadi jangkar visual.

## 08 — Miring kanan, lalu maju (8 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–3.3 | Sepeda miring kanan 14°; roda depan berbelok kanan 26°; tangan tetap di sadel; HUD 14° / 26° KANAN. | Corner `MIRING KANAN`. “Miringkan ke kanan, ban depannya akan **berbelok ke kanan.**” |
| 3.3–4.0 | Sepeda diluruskan; kemiringan dan setir kembali nol. | “Syaratnya cuma satu:” |
| 4.0–8.0 | Roda berputar, grid bergulir, kamera pull-back; HUD berubah menjadi “▶ GERAK MAJU”. | “**tetaplah bergerak maju.**” |

Teknis: setelah 4 s, `travel = 2.4 × (t − 4)`; rig tetap di tempat, grid
digulirkan ke arah kamera dan roda diputar. Tidak ada angka kecepatan di layar;
status “GERAK MAJU” bersifat kualitatif.

## 09 — Moral (6 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–2.15 | Golden hour; pengendara melaju; kamera crane dari dekat ke lebar; fade-in dari hitam 0,55 s. | “Pesan moral hari ini adalah:” |
| 2.15–5.85 | Layar diredupkan 34%; kartu judul di atas horizon; sepeda tetap bergerak di belakang. | Judul “**TERUS BERGERAK**” + “terus bergerak maju dan mengoreksi diri, adalah syarat kita bertahan di kehidupan ini.” |

Teknis: tidak ada matahari diskret di frame; cahaya golden hour datang dari
sun-key dan sky gradient. Crane berhenti di posisi lebar yang masih
mempertahankan ukuran sepeda. Judul ditempatkan di atas garis horizon.

## Panduan visual

- Palet: biru malam `#0F1B2D` / `#16243C`, oranye hero `#FF8A3D`, cyan
  anotasi `#35D0E8`, kuning aksen `#FFD166`, merah peringatan `#FF4D5E`,
  hijau aman `#4ADE80`.
- Lantai grid gelap, bayangan lembut, bloom tipis; ACES tone mapping.
- Kamera selalu 9:16; subjek utama berada di tengah vertikal, teks di
  sepertiga bawah.
- Tidak ada gerakan kamera yang lebih cepat dari 1,5 m/s agar identitas visual
  “studio blueprint” tetap tenang.
- Depth of field hanya di babak 2–5; babak sepeda dan penutup tetap tajam.
