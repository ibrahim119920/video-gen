# Storyboard — Sepeda Seimbang

Format 1080×1920 (9:16), 30 fps, total 60 detik. Tanpa voiceover; teks Indonesia
menjadi narasi. Semua transisi antar babak adalah hard cut.

## 01 — Diam vs bergerak (6 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–6.0 | Split atas–bawah. Panel atas: sepeda tanpa pengendara berdiri di grid, lalu roboh ke samping. Panel bawah: sepeda yang sama melaju, sedikit goyah, tetap tegak. | Tag `DIAM` (merah, kiri atas) dan `BERGERAK` (hijau, kanan atas, tepat di bawah garis pemisah). |
| 0.7–3.3 | Roboh terjadi sekitar 2,5–3,5 s. | “Sepeda itu aneh. **Diam, ia roboh.**” |
| 3.4–5.7 | Sepeda bergerak terus; roda berputar, grid bergulir. | “Melaju, ia **tegak sendiri.**” |

Teknis: dua pass 1080×960 (`?scene=1&panel=left|right`) di-`vstack`.
Garis cyan 2 px di tepi atas panel kanan menjadi pembatas di tengah frame.

## 02 — Mitos giroskop (10 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–2.2 | Close-up roda depan terisolasi, berputar; fork dan batang kemudi terlihat. | Corner `MITOS GIROSKOP`. |
| 2.2–4.8 | Panah L cyan muncul di hub; ring L berdenyut. | “Banyak orang mengira rahasianya **efek giroskop** dari roda yang berputar.” |
| 4.8–7.4 | Roda amber kedua meluncur masuk ke poros dan berputar berlawanan; panah C amber muncul. | “Padahal, sepeda yang efek giroskopnya **sudah dinetralkan** pun tetap bisa diseimbangkan.” |
| 7.2–9.9 | Kamera menarik ke belakang; kedua panah mengecil menuju hub; ghost bike terlihat utuh. | “Giroskop **bukan** satu-satunya jawaban.” + callout “Net L ≈ 0”, “✓ tetap seimbang”. |

## 03 — Pendulum terbalik (11 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–3.0 | Sepeda ghost 3/4 belakang; bola pusat massa (CoM) di ujung batang; garis tumpu putih; spotlight hangat. | Corner `PENDULUM TERBALIK`; callout “Pusat massa”. |
| 3.0–4.6 | Sedikit dorongan: sepeda mulai miring; strip tumpu memerah saat plumb line keluar. | “Saat diam, sepeda seperti **tongkat di ujung jari.**” |
| 4.6–7.8 | Kemiringan bertambah; plumb line kuning jatuh di luar strip; panah gravitasi merah muncul. | “Sedikit miring, pusat massanya keluar dari **titik tumpu.**” |
| 7.8–11.0 | Jatuh dipercepat; kamera orbit rendah; bola CoM mendekati lantai. | “Gravitasi **menariknya jatuh.**” + callout “di luar garis tumpu”. |

## 04 — Setir mengejar miring (12 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–4.0 | Pengendara melaju di grid; kamera chase 3/4 rendah; dua ring kontak (cyan belakang, amber depan). | Corner `SETIR MENGEJAR MIRING`; speedo 5.4 m/s. “Saat melaju, sepeda bisa **miring** tanpa jatuh.” |
| 4.0–7.2 | Kamera bergeser ke samping; sepeda berayun; roda depan terlihat berbelok mengikuti kemiringan; jejak kontak mulai tergambar. | “Roda depan berbelok **ke arah kemiringan.**” |
| 7.2–10.2 | Kamera naik ke near-overhead; jalur S terlihat; dua jejak kontak berwarna. | “Titik tumpunya bergerak **kembali di bawah pusat massa.**” |
| 10.2–12.0 | Frame lebar S; pengendara di ujung jalur; callout kontak. | “Jejak kedua roda membentuk **huruf S.**” |

Teknis: jalur sinusoidal `x = 1.9 sin(2πu/12)`, kemiringan dan setir adalah
fungsi dari kelengkungan; jejak kontak belakang/depan dibangun dari 53 chunk
dan di-reveal mengikuti jarak tempuh.

## 05 — Geometri garpu (9 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–2.0 | Sepeda tanpa pengendara melaju; pulsa kuning menyebar di lantai dari bawah sadel. | Corner `TANPA PENGENDARA`; speedo 5.5 m/s stabil. “Bahkan tanpa pengendara, **geometri garpu depan** membantu.” |
| 2.0–5.6 | Goyangan meredam; sepeda tetap tegak; roda berputar. | “Roda depan otomatis berbelok **ke arah miring.**” |
| 5.6–9.0 | Push-in ke garpu; roda depan asli diganti outline cyan; sumbu kemudi kuning putus-putus; braket trail cyan; ring kontak. | “Asalkan sepedanya **cukup cepat.**” + callout “trail”. |

Teknis: `AXIS_GROUND_Z` dihitung dari `HEAD_CENTER` dan `HEAD_TILT`; jarak
antara titik potong sumbu kemudi dan kontak ban adalah trail (≈8 cm pada model).

## 06 — Terlalu lambat (7 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–3.2 | Chase belakang 3/4; kecepatan turun 6,0 → 2,0 m/s; osiloskop sudut miring mulai bergelombang. | Corner `TERLALU LAMBAT`; speedo merah “melambat”. “Melambat, sepeda jadi **makin sulit dikoreksi.**” |
| 3.2–5.8 | Amplitudo goyangan membesar; setir tertinggal dari kemiringan; grid melambat. | “Ayunan setir makin **lebar dan cepat.**” |
| 5.8–7.0 | Sepeda jatuh ke samping; kamera mengikuti; speedo menuju nol; osiloskop mentok. | “Koreksi tak lagi **cukup.**” + callout “koreksi terlambat”. |

## 07 — Penutup (5 s)

| Waktu | Visual | Teks |
| --- | --- | --- |
| 0.0–2.8 | Golden hour; pengendara melaju; matahari rendah; kamera crane dari dekat ke lebar. | “**Bukan karena berdiri sendiri.**” |
| 2.9–5.0 | Layar diredupkan 38%; kartu judul; sepeda tetap bergerak di belakang. | Judul “**SEIMBANG KARENA BERGERAK**” + “Bukan karena diam — tapi karena **terus mengoreksi.**” |

## Panduan visual

- Palet: biru malam `#0F1B2D` / `#16243C`, oranye hero `#FF8A3D`, cyan
  anotasi `#35D0E8`, kuning aksen `#FFD166`, merah peringatan `#FF4D5E`,
  hijau aman `#4ADE80`.
- Lantai grid gelap, bayangan lembut, bloom tipis; ACES tone mapping.
- Kamera selalu 9:16; subjek utama berada di tengah vertikal, teks di
  sepertiga bawah.
- Tidak ada gerakan kamera yang lebih cepat dari 1,5 m/s agar identitas visual
  “studio blueprint” tetap tenang.
