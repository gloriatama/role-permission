# Perencanaan Web App Testing Odoo

## Tujuan
Membuat web application sederhana menggunakan Express.js dan HTML native untuk mengumpulkan data URL Odoo serta kredensial akun untuk beberapa role (Admin, Sales, dll). Saat ini, sistem belum perlu dikoneksikan dengan eksekusi script Playwright.

## Kebutuhan (Requirements)
1. **Teknologi**: Node.js, Express.js, HTML/CSS biasa (tanpa framework frontend seperti React/Vue).
2. **Halaman UI**:
   - Sebuah form input yang rapi dan mudah digunakan.
   - Field untuk memasukkan **URL Website Odoo**.
   - Field **Username** dan **Password** untuk Role **Admin**.
   - Field **Username** dan **Password** untuk Role **Sales**.
   - Tombol submit dengan teks **"Mulai Testing"**.
3. **Backend API (Express)**:
   - Route `GET /` untuk merender/mengirimkan halaman HTML form.
   - Route `POST /start-testing` untuk menerima data form ketika di-submit.
   - Saat menerima data POST, untuk saat ini cukup lakukan `console.log()` untuk mencetak payload ke terminal, dan kembalikan respons JSON atau HTML sederhana yang menandakan data berhasil diterima.

## Langkah-langkah Implementasi

### 1. Persiapan Proyek
- Pastikan project sudah diinisialisasi dengan `npm init -y` (jika belum).
- Install Express dengan menjalankan perintah:
  ```bash
  npm install express
  ```

### 2. Struktur Direktori
Buat file dan folder dengan struktur berikut:
```text
/
├── public/
│   └── index.html   <-- File antarmuka form
├── server.js        <-- Entry point untuk Express server
└── package.json
```

### 3. Pembuatan Antarmuka (UI) - `public/index.html`
- Buat struktur dokumen HTML5 standar.
- Tambahkan styling CSS sederhana di dalam tag `<style>` (atau file terpisah) agar form terlihat menarik dan rapi (misalnya menggunakan Flexbox/Grid, padding, dan border yang memadai).
- Buat form yang menargetkan endpoint backend: `<form action="/start-testing" method="POST">`
- Masukkan input field berikut beserta labelnya:
  - Input `url` (type="url", name="odooUrl", required)
  - Input `adminUsername` (type="text", name="adminUsername", required)
  - Input `adminPassword` (type="password", name="adminPassword", required)
  - Input `salesUsername` (type="text", name="salesUsername", required)
  - Input `salesPassword` (type="password", name="salesPassword", required)
- Tambahkan tombol submit: `<button type="submit">Mulai Testing</button>`

### 4. Setup Backend - `server.js`
- Import modul `express` dan inisialisasi aplikasi `const app = express();`.
- Gunakan middleware untuk membaca payload form URL-encoded dan JSON:
  ```javascript
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  ```
- Sajikan file statis dari folder `public`:
  ```javascript
  app.use(express.static('public'));
  ```
- Buat route `POST /start-testing`:
  ```javascript
  app.post('/start-testing', (req, res) => {
      const data = req.body;
      console.log("Data Testing Diterima:", data);
      res.send("<h3>Data berhasil diterima. Silakan cek console server.</h3>");
  });
  ```
- Jalankan server di port tertentu (misal: 3000):
  ```javascript
  const PORT = 3000;
  app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
  });
  ```

## Kriteria Selesai (Acceptance Criteria)
- [ ] Server Express dapat di-start (`node server.js`) tanpa terjadi error.
- [ ] Halaman form dapat diakses di browser melalui URL `http://localhost:3000`.
- [ ] Form memiliki field URL, kredensial Admin, dan kredensial Sales sesuai permintaan.
- [ ] Saat tombol "Mulai Testing" ditekan, data berhasil dikirim dan tidak ada error pada halaman.
- [ ] Di console terminal / server log, data input (URL dan semua username/password) berhasil tercetak dengan benar.
