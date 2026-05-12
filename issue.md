# Perencanaan Fitur Tampilan Hasil Testing Odoo di Web

## Tujuan
Fase ini bertujuan untuk meningkatkan antarmuka pengguna (UI) agar hasil pengujian otomatis (Playwright) dapat dilihat langsung di halaman web tanpa perlu mengecek folder lokal. Pengguna akan melihat status pengujian (Berhasil/Gagal) untuk tiap role beserta pratinjau (preview) screenshot yang diambil.

## Kebutuhan (Requirements)
1. **Status Pengujian per Role**:
   - UI harus memisahkan hasil testing untuk role Admin dan Sales.
   - Tampilkan indikator status sukses atau gagal untuk masing-masing role.
2. **Galeri Screenshot Visual**:
   - Gambar screenshot yang diambil oleh Playwright harus dirender langsung di dalam halaman hasil.
   - Menyediakan fitur *lightbox* atau modal: saat gambar diklik, gambar membesar agar detailnya terlihat jelas.
3. **Pengalaman Pengguna (UX) yang Mulus**:
   - Form disubmit menggunakan metode asynchronous (AJAX / Fetch API) agar halaman tidak refresh.
   - Tampilkan animasi loading (spinner) dan teks status (misal: "Memulai browser...", "Login sebagai Admin...") selama proses pengujian yang memakan waktu lama.
4. **Penyesuaian Backend API**:
   - Endpoint `POST /start-testing` harus diubah untuk merespons dengan data JSON yang terstruktur (status, role, daftar file screenshot), bukan lagi teks HTML biasa.
   - Folder tempat menyimpan screenshot harus diekspos sebagai file statis agar bisa diakses public oleh tag `<img>`.

## Langkah-langkah Implementasi

### 1. Modifikasi Backend (`server.js`)
- Daftarkan direktori `screenshots` agar dapat diakses publik melalui browser:
  ```javascript
  app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));
  ```
- Ubah respons endpoint `/start-testing` untuk mengembalikan JSON. Contoh:
  ```javascript
  res.json({
      success: true,
      data: [
          { role: 'admin', status: 'success', screenshots: ['admin-1.png', 'admin-2.png'] },
          { role: 'sales', status: 'failed', error: 'Invalid password', screenshots: ['sales-error.png'] }
      ]
  });
  ```

### 2. Modifikasi Logic Automasi (`utils/testRunner.js`)
- Pastikan kode Playwright mengembalikan struktur objek yang mencatat status ('success' atau 'failed'), daftar nama file screenshot yang berhasil digenerate, dan pesan error (jika ada).
- Berikan penanganan error (try-catch) per role, sehingga jika satu role gagal, keseluruhan aplikasi tidak crash dan role lain tetap bisa dilaporkan statusnya.

### 3. Modifikasi Frontend (`public/index.html`)
- **JavaScript Fetch**: Tambahkan event listener `submit` pada form, cegah default action (`e.preventDefault()`), lalu gunakan `fetch()` untuk POST data form.
- **Loading UI**: Buat section HTML untuk loading spinner. Sembunyikan form dan tampilkan spinner saat request berjalan.
- **Rendering Hasil**:
  - Tangkap respons JSON dari server.
  - Sembunyikan spinner.
  - Buat elemen DOM secara dinamis (menggunakan `document.createElement` atau template string) untuk merender hasil.
  - Kelompokkan hasil per role. Tampilkan text ✅ Berhasil atau ❌ Gagal.
  - Iterasi array `screenshots` dan buat elemen `<img src="/screenshots/nama-file.png">`.
- **Implementasi Lightbox**: Buat elemen div overlay yang awalnya tersembunyi. Tambahkan event `onclick` pada setiap gambar hasil untuk menampilkan overlay tersebut beserta gambar ukuran penuhnya.

## Kriteria Selesai (Acceptance Criteria)
- [x] Halaman web tidak ter-refresh (reload) saat form disubmit.
- [x] Loading spinner animasi muncul selama Playwright sedang memproses.
- [x] Hasil dikelompokkan dengan jelas berdasarkan nama role (Admin/Sales).
- [x] Status keberhasilan atau kegagalan (termasuk error message) terlihat jelas.
- [x] Thumbnail screenshot muncul dan memuat gambar dengan benar tanpa broken image.
- [x] Gambar dapat diklik untuk memunculkan lightbox/modal yang menampilkan versi aslinya.
- [x] (Opsional) Terdapat tombol untuk "Kembali" atau "Uji Ulang" untuk mereset tampilan kembali ke form awal tanpa perlu me-refresh seluruh halaman.
