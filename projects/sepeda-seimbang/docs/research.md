# Catatan fisika — Sepeda Seimbang

Dokumen ini merangkum dasar fisika yang dipakai naskah. Video sengaja menjaga
klaim tetap hati-hati: tidak ada satu angka kecepatan universal, dan tidak
ada klaim bahwa giroskop atau trail sendirian cukup.

## Sumber utama

1. **Jones, D. E. H. (1970).** “The stability of the bicycle.” *Physics Today*
   23(4), 34–40. DOI: [10.1063/1.3022055](https://doi.org/10.1063/1.3022055).
   Jones membahas stabilitas sepeda, peran efek giroskop, dan geometri kemudi.
   Eksperimen sepeda dengan roda tambahan yang membatalkan momentum sudut
   menunjukkan sepeda tetap dapat stabil — dasar babak 2–3.

2. **Kooijman, J. D. G., Meijaard, J. P., Papadopoulos, J. M., Ruina, A., &
   Schwab, A. L. (2011).** “A bicycle can be self-stable without gyroscopic or
   caster effects.” *Science* 332(6027), 339–342.
   DOI: [10.1126/science.1201959](https://doi.org/10.1126/science.1201959).
   Sepeda uji mereka stabil sendiri tanpa efek giroskop dan tanpa caster
   (trail negatif), sehingga geometri kemudi, distribusi massa, dan dinamika
   kemudi adalah faktor yang lebih umum. Ini alasan video tidak menjadikan
   giroskop sebagai jawaban tunggal.

3. **Meijaard, J. P., Papadopoulos, J. M., Ruina, A., & Schwab, A. L. (2007).**
   “Linearized dynamics of a bicycle.” *Proceedings of the Royal Society A*
   463(2084), 1955–1982. DOI: [10.1098/rspa.2007.1853](https://doi.org/10.1098/rspa.2007.1853).
   Model acuan (bicycle benchmark) untuk dinamika sepeda: derajat kebebasan
   kemudi dan miring, serta kopling gyroscopic, geometri, dan massa.

## Kerangka yang dipakai di video

### 1. Saat diam — pendulum terbalik dan tongkat di telapak tangan

Dengan titik tumpu di bawah pusat massa, posisi tegak adalah kesetimbangan
tidak stabil. Jika pusat massa bergeser keluar dari bidang tumpu, momen
gravitasi memperbesar kemiringan. Pada sepeda diam, tidak ada mekanisme
koreksi; ia roboh (babak 1).

Babak 4–5 membuat gagasan ini tangible. Tongkat ringan dengan bola massa di
ujung berdiri di telapak tangan. Selama tangan diam, pusat massa bergeser
keluar dari ring tumpu dan tongkat jatuh. Jika tangan bergerak mengikuti arah
kemiringan, tumpuan terus berada di bawah pusat massa dan tongkat tetap
tegak. Ini adalah demonstrasi kontrol, bukan simulasi numerik: gerak tangan
di babak 5 sengaja halus dan berskala kecil agar mudah dibaca.

### 2. Saat bergerak — koreksi setir

Pada sepeda yang bergerak, roda depan dapat diarahkan ke arah kemiringan.
Jejak kontak depan bergerak ke samping, sehingga resultan gaya kontak dapat
kembali berada di bawah pusat massa. Ini bukan “sepeda berdiri sendiri”
dalam arti statis: sepeda terus melakukan koreksi kecil. Babak 6 menunjukkan
pengendara yang berbelok; jejak kedua roda membentuk huruf S.

Babak 7–8 mengisolasi geometri tanpa pengendara. Tangan memegang sadel,
sepeda dimiringkan ke kiri atau ke kanan, dan roda depan berbelok ke arah
kemiringan yang sama. Pada babak 8, sepeda kemudian diluruskan dan digerakkan
maju: koreksi setir hanya bekerja selama ada gerak maju yang memberi ruang
untuk memindahkan titik tumpu.

### 3. Peran geometri kemudi dan trail

Trail adalah jarak antara titik potong sumbu kemudi dengan tanah dan titik
kontak ban depan. Geometri ini memengaruhi kopling antara kemiringan dan
sudut setir. Namun, trail bukan satu-satunya syarat: sepeda Kooijman et al.
justru stabil tanpa caster. Karena itu narasi tidak mengatakan “trail adalah
penyebab tunggal”; babak 7–8 hanya menunjukkan bahwa kemiringan dan belokan
ban depan terikat secara geometris.

### 4. Mengapa gerak maju penting

Kecepatan memengaruhi seberapa cepat dan seberapa besar sudut setir yang
dibutuhkan untuk memindahkan titik tumpu di bawah pusat massa. Pada kecepatan
yang sangat rendah, koreksi menjadi lebih sulit. Namun ambangnya bergantung
pada geometri, massa, dan pengendara, sehingga video tidak memakai satu angka
universal. Kalimat penutup babak 8 sengaja kualitatif: “tetaplah bergerak
maju”.

## Yang sengaja tidak diklaim

- Tidak ada angka “kecepatan minimum” universal; video hanya mengatakan
  “tetaplah bergerak maju”.
- Giroskop tidak dinyatakan “tidak berperan sama sekali”; video mengatakan
  giroskop “bukan itu jawabannya” karena ada mekanisme lain yang cukup.
- Trail tidak dinyatakan sebagai satu-satunya penyebab stabilitas.
- Pengendara tidak dihilangkan dari cerita: babak 6 menunjukkan input setir,
  sedangkan babak 7–8 menunjukkan kasus tanpa pengendara sebagai demonstrasi
  geometri.
- Pesan moral di babak 9 adalah metafora, bukan klaim hukum fisika tentang
  kehidupan.
