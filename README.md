# tabungan-app-v0.0.1
# Tabungan App (HTML/CSS/JS) – Mobile Responsive

**TL;DR**  
Aplikasi simpel buat nyatet pemasukan dan pengeluaran. Full client-side, tanpa backend, semua data disimpan di `localStorage`. Termasuk kalkulator biar gak perlu ngitung manual.

## Fitur
- CRUD lengkap: tambah, edit, hapus catatan tabungan.
- Input: No, Hari (otomatis), Tanggal, Uang Masuk, Uang Keluar, dan Keterangan.
- Hitung saldo otomatis: total masuk dikurangi total keluar.
- Kalkulator sederhana (tambah, kurang, kali, bagi).
- Desain mobile-first yang nyaman dipakai di HP.
- Penyimpanan lokal via `localStorage` tanpa server.

## Cara Pakai
1. Pastikan struktur folder dan file sudah sesuai.
2. Buka `index.html` di browser apa saja.
3. Klik tombol **+ Catat** untuk menambah data baru.
4. Gunakan tombol **Kalkulator** di pojok kanan atas kalau butuh hitung cepat.

## Catatan Teknis
- Data disimpan di `localStorage` dengan key:
  `tabunganData_v1`
- Jika ingin reset data sepenuhnya, buka console browser lalu jalankan:
  ```js
  localStorage.removeItem('tabunganData_v1');
  location.reload();
