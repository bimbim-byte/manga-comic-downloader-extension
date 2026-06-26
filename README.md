# Manga/Comic Downloader PRO

Ekstensi **Google Chrome (Manifest V3)** untuk mengunduh chapter manga atau komik dari beberapa situs populer secara otomatis, serta memindai gambar secara universal pada hampir semua situs web. Hasil unduhan dapat langsung dikonversi menjadi **JPG**, **PDF**, atau **CBZ**.

---

## ✨ Fitur

### 🌐 Supported Websites

| Website | Support |
|---------|---------|
| MangaPlus | ✅ |
| Naver Webtoon | ✅ |
| LINE Webtoon | ✅ |
| Other Websites | ✅ Universal Scanner |

---

### 🌐 Universal Scanner

Selain situs yang didukung secara khusus, ekstensi juga dapat digunakan pada situs manga lainnya menggunakan algoritma pemindaian berbasis heuristik yang akan:

- Mendeteksi kontainer komik secara otomatis
- Mengurutkan gambar berdasarkan urutan
- Mengabaikan elemen yang bukan halaman komik

---

# 📋 Prasyarat

Untuk menggunakan fitur **PDF** dan **CBZ**, diperlukan Tampermonkey beserta userscript pendukung.

### 1. Install Tampermonkey

https://www.tampermonkey.net/

### 2. Install Userscript CORS Bridge

https://greasyfork.org/en/scripts/584444-cors-gm

### 3. Aktifkan Userscript

Pastikan userscript tersebut dalam keadaan **Enabled** sebelum melakukan download PDF atau CBZ.

> **Catatan**
>
> Format JPG tetap dapat digunakan apabila tidak membutuhkan proses bypass melalui Tampermonkey (sesuaikan implementasi proyek Anda).

---

# 🛠 Instalasi

1. Download atau clone repository ini.

```
git clone https://github.com/username/manga-downloader-pro.git
```

2. Buka Chrome.

3. Masuk ke

```
chrome://extensions
```

4. Aktifkan **Developer Mode**.

5. Klik **Load unpacked**.

6. Pilih folder proyek.

7. Pastikan:

- Tampermonkey telah terpasang
- Userscript **CORS GM** telah aktif

---

# 📖 Cara Penggunaan

## 1. MangaPlus, Naver Webtoon, LINE Webtoon

1. Buka halaman chapter.
2. Tombol **📥 Download Options** akan muncul otomatis.
3. Klik tombol tersebut.
4. Pilih format:

- JPG
- PDF
- CBZ

5. Tunggu hingga proses selesai.

---

## 2. Situs Lain (Universal Mode)

1. Buka halaman chapter manga.
2. Klik ikon **Manga/Comic Downloader PRO** pada toolbar Chrome.
3. Popup akan muncul.
4. Pilih format output.
5. Popup akan menutup otomatis.
6. Progress akan muncul pada overlay di halaman.

---

# ⚠ Catatan

- PDF dan CBZ memerlukan Tampermonkey.
- Tidak semua situs dapat dipindai dengan tingkat keberhasilan yang sama.
- Beberapa situs dapat berubah sewaktu-waktu sehingga memerlukan pembaruan ekstensi.
