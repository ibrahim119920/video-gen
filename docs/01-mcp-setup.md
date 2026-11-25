# 01 — MCP Setup: Kaggle & Colab

Dokumen ini mencatat apa yang sudah dipasang, konfigurasi final, cara
autentikasi, daftar tool, dan masalah yang mungkin muncul.

- **Tanggal setup:** 25 November 2026
- **OpenCode:** v2.2.5
- **OS:** Windows

---

## 1. Ringkasan

| Server | Tipe | Endpoint / Command | Auth | Tool |
| --- | --- | --- | --- | --- |
| `kaggle` | remote (Streamable HTTP) | `https://www.kaggle.com/mcp` | Bearer token `KGAT_...` | 76 |
| `colab` | local (stdio) | `uvx git+https://github.com/googlecolab/colab-mcp` | tidak perlu (via browser Google) | 1 → 8 setelah tab Colab tersambung |

Keduanya terdaftar di config global OpenCode dan aktif tanpa restart.

---

## 2. Lingkungan & lokasi config

Prasyarat yang sudah tersedia di mesin ini:

```text
Python 3.11.9
git 2.47.0.windows.2
uv 0.12.22 (uvx 0.12.22)
ffmpeg / ffprobe (winget)
```

Config global OpenCode ada di:

```text
C:\Users\HERO COMPUTER\.config\opencode\
├── opencode.json    # kaggle, colab, gitnexus (warisan format V1)
└── opencode.jsonc   # figma, providers, compaction
```

Di mesin ini OpenCode memuat kedua file. Format V2 menempatkan server di
`mcp.servers`. Entri `gitnexus` yang lama masih ditulis langsung di bawah
`mcp` (format V1); masih berfungsi, tetapi sebaiknya dimigrasikan ke
`mcp.servers` saat ada waktu.

Perubahan config MCP berlaku **live** (tanpa restart). Restart service hanya
diperlukan jika menambah environment variable baru untuk proses OpenCode.

---

## 3. Kaggle MCP

### 3.1 Instalasi

```powershell
opencode mcp add kaggle --global --url https://www.kaggle.com/mcp
```

### 3.2 Konfigurasi final

```json
{
  "mcp": {
    "servers": {
      "kaggle": {
        "type": "remote",
        "url": "https://www.kaggle.com/mcp",
        "headers": {
          "Authorization": "Bearer KGAT_xxxxxxxxxxxxxxxx"
        },
        "oauth": false
      }
    }
  }
}
```

`oauth: false` dipasang supaya OpenCode tidak mencoba alur OAuth otomatis.
Token asli ada di file config, **tidak** ditulis di dokumen ini.

### 3.3 Autentikasi: kenapa pakai token

Kaggle mendukung OAuth 2.0, tetapi alur otomatis OpenCode gagal di tahap
registrasi client:

```text
MCP server "https://www.kaggle.com/mcp" requires a login before it can register a client
```

Hasil investigasi manual (25 Nov 2026):

| Uji | Hasil |
| --- | --- |
| `GET /.well-known/oauth-protected-resource` | 200; authorization server `https://www.kaggle.com/` |
| `GET /.well-known/oauth-authorization-server` | 200; ada `authorize`, `token`, `register` endpoint |
| `POST /api/v1/oauth2/register` (DCR) | 200; `client_id: "opencode"` |
| `GET /api/v1/oauth2/authorize` dengan redirect `/callback` | 400 — redirect tidak diizinkan |
| Redirect `/mcp/oauth/callback` (port bebas) | 302 ke halaman login/consent Kaggle |

Redirect URI yang diizinkan Kaggle:

```text
http://127.0.0.1/mcp/oauth/callback
https://www.kaggle.com/account/api/oauth/token
```

Yang lebih menentukan: endpoint MCP Kaggle membalas **HTTP 200** dengan error
di dalam body MCP, bukan `401 + WWW-Authenticate`:

```json
{"result":{"content":[{"type":"text","text":"Unauthenticated"}],"isError":true}}
```

Karena tidak ada challenge 401, OpenCode tidak pernah memicu OAuth otomatis.
Karena itu dipakai token authentication (jalur resmi alternatif dari Kaggle).

**Membuat token:** Kaggle → foto profil → **Settings → API → Generate New
Token**. Token diawali `KGAT`.

### 3.4 Verifikasi

```text
get_accelerator_quota  →  {"gpu_quota": {...}, "tpu_quota": {...}}
```

Sebelum token dipasang, tool yang sama mengembalikan `Unauthenticated`.
Sesudahnya mengembalikan kuota GPU/TPU akun, jadi header diterima.

### 3.5 Tool yang tersedia (76)

| Kategori | Contoh tool |
| --- | --- |
| Notebook | `create_notebook_session`, `save_notebook`, `get_notebook_session_status`, `cancel_notebook_session`, `list_notebook_files`, `download_notebook_output`, `download_notebook_output_zip` |
| Dataset | `search_datasets`, `get_dataset_info`, `list_dataset_files`, `download_dataset`, `upload_dataset_file`, `update_dataset_metadata` |
| Kompetisi | `search_competitions`, `get_competition`, `get_competition_leaderboard`, `download_competition_data_files`, `submit_to_competition` |
| Model | `list_models`, `get_model`, `create_model`, `update_model_variation`, `download_model_variation_version` |
| Forum & writeup | `list_forums`, `get_forum_topic`, `list_topic_messages`, `get_writeup` |
| Benchmark | `get_benchmark_leaderboard`, `create_benchmark_task_from_prompt`, `update_benchmark_arena_settings` |
| Akun | `get_user_profile`, `get_accelerator_quota` |

Tool call memakai bentuk `request: {...}` (bukan argumen flat), misalnya:

```json
{"request": {"competitionName": "titanic"}}
```

### 3.6 Catatan operasional

- `get_accelerator_quota` berguna untuk memantau sisa kuota GPU/TPU Kaggle
  sebelum menjalankan render panjang.
- `save_notebook` + `create_notebook_session` memungkinkan agent menulis
  notebook lalu menjalankannya top-to-bottom tanpa membuka UI.
- Output notebook diunduh lewat `download_notebook_output_zip`.
- Token memberi akses ke akun Kaggle. Perlakukan seperti password.

---

## 4. Colab MCP

### 4.1 Prasyarat

Repo: <https://github.com/googlecolab/colab-mcp>

Yang dibutuhkan: Python, git, uv. Ketiganya sudah ada. `uvx` akan meng-clone
dan menjalankan server dari Git; run pertama lebih lambat karena resolve
dependensi, run berikutnya memakai cache.

### 4.2 Instalasi

```powershell
opencode mcp add colab --global -- uvx git+https://github.com/googlecolab/colab-mcp
```

### 4.3 Konfigurasi final

```json
{
  "mcp": {
    "servers": {
      "colab": {
        "type": "local",
        "command": ["uvx", "git+https://github.com/googlecolab/colab-mcp"],
        "timeout": {
          "startup": 60000,
          "catalog": 60000
        }
      }
    }
  }
}
```

Timeout dinaikkan dari default 30 detik karena run pertama `uvx` bisa memakan
waktu lebih lama.

### 4.4 Cara kerja

1. OpenCode menjalankan `uvx` sebagai proses stdio MCP lokal.
2. Server membuka WebSocket lokal dan membuat token + port acak.
3. Sebelum ada koneksi browser, server hanya mengekspos **1 tool**:
   `open_colab_browser_connection`.
4. Tool itu membuka tab baru ke:

   ```text
   https://colab.research.google.com/#mcpProxyToken=<token>&mcpProxyPort=<port>
   ```

5. Frontend Colab membaca parameter tersebut, menyambung ke WebSocket lokal,
   lalu mem-proxy tool notebook ke agent.
6. Server mengirim `notifications/tools/list_changed`; katalog tool OpenCode
   ikut berubah dari 1 menjadi 8 tool (Code Mode menampilkannya sebagai
   `tools.colab.*`).
7. Koneksi menunggu maksimal **60 detik**. Kalau gagal, tool mengembalikan
   `false`.

Karena tool di-proxy dari frontend, server Colab **harus berjalan lokal** di
mesin yang sama dengan browser, dan tab Colab harus tetap terbuka.

### 4.5 Verifikasi

| Uji | Hasil |
| --- | --- |
| `open_colab_browser_connection()` | `{"result": true}` |
| Jumlah tool setelah connect | 8 |
| `get_cells` | notebook scratch, 1 cell kosong |
| `update_cell` + `run_code_cell` | eksekusi berhasil, output keluar |
| Runtime saat verifikasi | CPU-only (`COLAB_GPU` kosong, `torch ...+cpu`, CUDA false) |

### 4.6 Tool setelah tersambung (8)

| Tool | Fungsi |
| --- | --- |
| `open_colab_browser_connection` | buka/sambungkan tab Colab |
| `add_code_cell` | sisipkan code cell di index tertentu |
| `add_text_cell` | sisipkan markdown cell |
| `update_cell` | timpa isi cell berdasarkan `cellId` |
| `delete_cell` | hapus cell |
| `move_cell` | pindahkan cell ke index lain |
| `get_cells` | baca rentang cell (opsional termasuk output) |
| `run_code_cell` | eksekusi code cell, kembalikan output |

Tidak ada tool untuk mengganti runtime type atau memilih accelerator. Itu
tetap dilakukan manual di UI Colab (Runtime → Change runtime type).

### 4.7 Batasan

- Client harus mendukung `notifications/tools/list_changed`. OpenCode
  mendukung (katalog berubah otomatis saat verifikasi).
- Tab Colab harus tetap terbuka; kalau ditutup/reload, tool notebook
  menghilang dan perlu `open_colab_browser_connection` lagi.
- Browser harus login ke akun Google yang punya akses Colab.
- Tool hanya ada setelah koneksi; sebelum itu daftar tool tampak "kosong"
  (hanya 1 tool), bukan tanda server rusak.
- Runtime default bisa CPU. Render GPU/TPU perlu dipilih manual.

---

## 5. Troubleshooting

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| `kaggle` status `connected` tapi tool balas `Unauthenticated` | header token hilang/salah, atau `oauth` tidak dimatikan | cek `headers.Authorization` dan `oauth: false`, lalu simpan config |
| Kaggle tidak muncul di `opencode mcp list` | server ditulis di luar `mcp.servers` atau file config salah | pastikan bentuk V2 `mcp.servers.kaggle` |
| Tool Colab hanya 1 | tab browser belum tersambung | panggil `open_colab_browser_connection`, biarkan tab terbuka, izinkan popup |
| `open_colab_browser_connection` → `false` | tidak ada koneksi dalam 60 detik | login Google, coba lagi, pastikan tab tidak diblokir |
| `colab` gagal start / timeout | run pertama `uvx` mengunduh dependensi | naikkan `timeout.startup`, atau panaskan cache (lihat 5.1) |
| Tool Colab hilang di tengah sesi | tab ditutup, reload, atau runtime disconnect | sambungkan ulang lewat tool yang sama |
| Server berstatus `disabled` | dimatikan lewat `/mcps` atau state lama | aktifkan lagi di `/mcps`; kalau perlu hapus entri dan tambah ulang |

### 5.1 Memanaskan cache uvx (opsional)

```powershell
"" | uvx git+https://github.com/googlecolab/colab-mcp
```

Perintah ini memulai server lalu langsung keluar karena stdin EOF. Setelah
cache hangat, startup OpenCode jauh lebih cepat.

---

## 6. Cheat sheet

```powershell
# status semua server
opencode mcp list

# tambah server
opencode mcp add kaggle --global --url https://www.kaggle.com/mcp
opencode mcp add colab --global -- uvx git+https://github.com/googlecolab/colab-mcp

# OAuth (interaktif, hanya jika suatu saat pindah dari token)
opencode mcp auth kaggle
opencode mcp logout kaggle
```

Catatan: `opencode mcp auth` membuka alur browser interaktif. Jalankan dari
terminal pengguna, bukan dari proses background, supaya URL authorisasi tidak
tersembunyi di log.

---

## 7. Keamanan

- Token Kaggle = akses penuh ke akun. Simpan hanya di config lokal.
- Jangan commit `opencode.json` / `opencode.jsonc` ke repo publik.
- Jika token bocor: rotasi di Kaggle → Settings → API → Generate New Token,
  lalu ganti header.
- Alternatif yang lebih rapi (butuh restart service):

  ```powershell
  setx KAGGLE_API_TOKEN "KGAT_xxxxxxxxxxxxxxxx"
  ```

  lalu ubah config menjadi:

  ```json
  "headers": { "Authorization": "Bearer {env:KAGGLE_API_TOKEN}" }
  ```

  dan restart OpenCode supaya proses baru mewarisi environment variable.
- Kredensial OAuth (jika nanti dipakai) disimpan OpenCode di luar file config.
