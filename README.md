# ☕ Warkop Coin Hunter

Game web berburu koin bertema warung kopi Indonesia. Kumpulkan koin, kembangkan warkop dari warung sederhana sampai modern, pecahkan teka-teki Mystery Coin, dan lengkapi album koleksi.

Berjalan **100% lokal** di browser. Tidak butuh database, API, Node, atau Python. Progres disimpan di browser (localStorage), termasuk cadangan "cloud save".

## Cara Menjalankan

### Cara 1 — paling mudah (ada server lokal)
Dobel-klik **`Jalankan-Game.bat`**. Browser akan terbuka otomatis di `http://localhost:8080`.

Atau lewat PowerShell:
```powershell
./server.ps1
```
Ganti port bila perlu: `./server.ps1 -Port 8090`

### Cara 2 — langsung tanpa server
Dobel-klik **`index.html`** untuk membukanya langsung di browser. Semua fitur tetap berjalan (menu, berburu koin, warkop, album, fusion, settings).

## Fitur

| Fitur | Keterangan |
|---|---|
| **Core gameplay** | Gerakkan karakter (WASD / panah / sentuh), ambil koin, inventory, auto-save |
| **Map warkop** | Satu map warkop dengan meja-kursi, counter, mesin kopi, dekorasi |
| **Siang / Malam** | Tombol 🌓 mengubah ambiance pencahayaan ruangan |
| **Kembangkan warkop** | Beli meja-kursi, lampu neon, sound system, mesin kopi, dekorasi, area parkir, sampai renovasi modern |
| **Mystery Coin** | Koin bersimbol yang harus dipecahkan lewat teka-teki |
| **Coin Fusion** | Gabungkan koin tertentu jadi varian baru (perunggu, perak, emas) |
| **Album Koleksi** | Album dengan cerita singkat di balik setiap koin |
| **Secret NPC** | Pengunjung rahasia yang memberi misi tersembunyi |
| **Seasonal Update** | Tema Lebaran, Kemerdekaan, Halloween, Akhir Tahun (otomatis ikut tanggal atau manual) |
| **Offline Mode** | Berburu koin & menyelesaikan misi dasar tanpa internet |
| **Cloud Save** | Cadangan progres agar aman saat berganti perangkat (disimulasikan lokal) |
| **Accessibility** | Ukuran teks, kurangi efek visual, kontras tinggi, dukungan `prefers-reduced-motion` |

## Struktur Proyek

```
projectbayu/
├─ index.html          # struktur UI
├─ css/style.css       # tampilan & tema
├─ js/
│  ├─ data.js          # konten: koin, item, NPC, teka-teki, seasonal
│  ├─ storage.js       # save/load + cloud save (localStorage)
│  ├─ game.js          # engine canvas: gerakan, koin, siang/malam
│  ├─ ui.js            # panel/modal (warkop, album, fusion, dll)
│  └─ main.js          # orkestrasi & logika aksi
├─ server.ps1          # server lokal PowerShell (opsional)
└─ Jalankan-Game.bat   # peluncur dobel-klik
```

## Catatan Pengembangan Lanjutan
Arsitektur sengaja dibuat sederhana dan lokal dulu. Bila nanti butuh fitur yang lebih kompleks (akun pengguna, cloud save asli, leaderboard), lapisan `storage.js` bisa diganti dengan pemanggilan API/database tanpa mengubah logika game.
