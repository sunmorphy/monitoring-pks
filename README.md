# Monitoring PKS

Sistem monitoring laboratorium dan pelaporan harian hasil analisa mutu serta losses (kehilangan minyak/CPO) pada stasiun proses Pabrik Kelapa Sawit (PKS).

Aplikasi ini mencatat data per siklus pengambilan sampel, menghasilkan format pesan pelaporan WhatsApp otomatis, serta menyediakan visualisasi grafik dan tabel rekapitulasi harian.

---

## 1. Kebutuhan Sistem & Prasyarat

Sebelum memulai instalasi, pastikan perangkat komputer host telah terpasang perangkat lunak berikut:

1. **Node.js**: Versi 18 LTS atau 20 LTS ke atas ([nodejs.org](https://nodejs.org/)).
2. **MySQL Server**: Versi 8.0 atau MariaDB 10.5+.
3. **Git**: Untuk clone repositori (opsional jika menggunakan arsip zip).
4. **Akun Cloudflare & Domain Aktif**: Nama domain yang nameserver-nya telah diarahkan ke Cloudflare.
5. **Konektor `cloudflared`**: Diunduh pada saat proses konfigurasi tunnel di Cloudflare Dashboard.
6. **PM2** (Opsional, direkomendasikan): Process manager untuk menjalankan aplikasi di latar belakang dan otomatis menyala saat komputer dinyalakan.

---

## 2. Setup Environment Aplikasi

### A. Clone dan Buka Folder Project
Buka terminal atau Command Prompt, lalu arahkan ke direktori project:
```bash
cd /path/to/monitoring-pks
```

### B. Instalasi Dependensi Node.js
Jalankan perintah berikut untuk mengunduh modul-modul yang dibutuhkan:
```bash
npm install
```

---

## 3. Setup MySQL Server

### Setup di Windows

#### Cara 1: Menggunakan MySQL Community Server (Standar Resmi)
1. **Unduh Installer**:
   * Buka [dev.mysql.com/downloads/installer/](https://dev.mysql.com/downloads/installer/).
   * Unduh file berukuran besar: `mysql-installer-community-...msi` (sekitar 300–400 MB).
   * Pada halaman unduh Oracle, klik tautan *"No thanks, just start my download"*.
2. **Jalankan Installer**:
   * **Choosing a Setup Type**: Pilih **Server only** atau **Custom** (pilih *MySQL Server* dan *MySQL Command Line Client*). Klik **Next** lalu **Execute**.
   * **Type and Networking**: Biarkan *Config Type* pada **Development Computer**, pastikan *Port* bernilai **`3306`**. Klik **Next**.
   * **Authentication Method**: Pilih **Use Strong Password Encryption for Authentication (RECOMMENDED)**.
   * **Accounts and Roles**: Tentukan **MySQL Root Password** (misal: `pks12345` atau `home`). Catat password ini untuk dimasukkan ke file `.env`. Klik **Next**.
   * **Windows Service**: Pastikan nama service `MySQL80` dan centang **Start the MySQL Server at System Startup** agar database menyala otomatis saat komputer dihidupkan.
   * **Apply Configuration**: Klik **Execute** hingga semua konfigurasi selesai bertanda centang hijau, lalu klik **Finish**.
3. **Menambahkan MySQL ke System PATH Windows (Agar perintah `mysql` dapat dijalankan dari CMD/PowerShell)**:
   * Buka folder: `C:\Program Files\MySQL\MySQL Server 8.0\bin` lalu salin path tersebut.
   * Buka Windows Search, ketik `Environment Variables`, lalu pilih **Edit the system environment variables**.
   * Klik tombol **Environment Variables** $\rightarrow$ pada kotak *System variables*, cari baris **Path** $\rightarrow$ klik **Edit**.
   * Klik **New**, tempelkan path `C:\Program Files\MySQL\MySQL Server 8.0\bin`, lalu klik **OK**.

#### Cara 2: Menggunakan XAMPP (Alternatif Praktis Windows)
1. Unduh XAMPP di [apachefriends.org](https://www.apachefriends.org/).
2. Jalankan instalasi dan centang komponen **MySQL**.
3. Buka **XAMPP Control Panel**, lalu klik tombol **Start** pada baris **MySQL** (hingga indikator berwarna hijau pada port 3306).
4. Pengaturan bawaan XAMPP: User `root` dengan password kosong (`DB_PASSWORD=`).

---

### Setup di macOS

#### Cara 1: Menggunakan Homebrew (Direkomendasikan)
1. **Pasang MySQL**:
   Buka Terminal macOS, lalu jalankan:
   ```bash
   brew install mysql
   ```
2. **Jalankan Service MySQL**:
   ```bash
   brew services start mysql
   ```
   *(MySQL akan otomatis berjalan di latar belakang setiap kali Mac dinyalakan).*
3. **Konfigurasi Keamanan & Password Root**:
   Jalankan utilitas keamanan untuk membuat password root:
   ```bash
   mysql_secure_installation
   ```
   * Ikuti petunjuk di terminal: masukkan password baru untuk user `root` (misal: `pks12345`), lalu jawab `Y` untuk pertanyaan penghapusan anonymous user dan reload privilege tables.
4. **Verifikasi Status**:
   ```bash
   brew services list
   ```
   *(Pastikan status `mysql` adalah `started`).*

#### Cara 2: Menggunakan Installer DMG Resmi macOS
1. **Unduh Installer**:
   * Buka [dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/).
   * Pilih **Operating System: macOS**.
   * **PENTING**: Pilih varian arsitektur **macOS (ARM 64-bit untuk chipset Silicon, x86_64 untuk chipset Intel), DMG Archive**.
2. **Proses Instalasi**:
   * Buka file `.dmg`, lalu jalankan installer `.pkg`.
   * Pada tahap penentuan password, pilih *Use Strong Password Encryption* dan masukkan password root Anda.
3. **Menambahkan MySQL ke PATH zsh Terminal**:
   Buka Terminal dan daftarkan path binary MySQL:
   ```bash
   echo 'export PATH="/usr/local/mysql/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```
4. **Mengelola Service**:
   Buka **System Settings** di Mac $\rightarrow$ gulir ke bawah dan klik menu **MySQL** $\rightarrow$ klik tombol **Start MySQL Server**.

---

### C. Impor Skema Database

Setelah service MySQL aktif di port 3306, buka terminal / Command Prompt di folder proyek `monitoring-pks`:

```bash
mysql -u root -p < schema.sql
```
*(Ketik password root MySQL yang telah Anda buat saat diminta. Jika menggunakan XAMPP tanpa password, jalankan: `mysql -u root < schema.sql`).*

Perintah ini akan membuat:
* Basis data `monitoring_pks`.
* Tabel `users` (akun pengguna & role).
* Tabel `monitoring` (data losses & parameter mutu CPO dengan audit trail).
* Tabel `sessions` (penyimpanan sesi login).

---

### D. Konfigurasi `.env`

Sesuaikan file [`.env`](file://.env) di root folder proyek:

```env
DB_HOST=localhost
DB_USER=user
DB_PASSWORD=password
DB_NAME=name
DB_PORT=port

PORT=3000
SESSION_SECRET=secret
NODE_ENV=production
```

> **Catatan Pengguna XAMPP**: Jika menggunakan XAMPP dengan pengaturan default, kosongkan baris password: `DB_PASSWORD=`.

---

## 4. Menjalankan Server & Verifikasi Awal

### A. Menjalankan Server
Jalankan server aplikasi:
```bash
npm start
```
Output terminal akan menampilkan:
```text
Server Monitoring PKS berjalan di http://localhost:3000
[INIT] User default 'admin' (admin) berhasil ditambahkan otomatis.
[INIT] User default 'analis' (analis) berhasil ditambahkan otomatis.
[INIT] User default 'operator' (operator) berhasil ditambahkan otomatis.
```

> **Catatan Inisialisasi User**: Sistem secara otomatis mengecek dan menambahkan akun default jika belum ada di database tanpa menimpa data yang telah ada.

### B. Akun Bawaan Sistem
| Username | Password Bawaan | Role | Hak Akses |
|---|---|---|---|
| `admin` | `admin123` | `admin` | Kelola user (`/users.html`), Input lab, dan Lihat laporan |
| `analis` | `analis123` | `analis` | Input data lab & generator WA (`/index.html`), Lihat laporan |
| `operator` | `operator123` | `operator` | Hanya melihat dashboard laporan (`/laporan.html`) |

### C. Pengujian Akses Lokal
Buka browser pada komputer host:
* Akses lokal: `http://localhost:3000` (otomatis dialihkan ke halaman login).
* Akses dari HP / laptop lain di jaringan LAN/WiFi lab: `http://<IP-KOMPUTER-HOST>:3000` (contoh: `http://192.168.1.50:3000`).

---

## 5. Konfigurasi Service Otomatis (PM2)

Agar aplikasi terus berjalan di latar belakang dan otomatis aktif kembali saat komputer dinyalakan:

### Windows
1. Pasang PM2 dan pembungkus service Windows:
   ```cmd
   npm install -g pm2
   npm install -g pm2-windows-service
   ```
2. Daftarkan service:
   ```cmd
   pm2-service-install
   ```
3. Jalankan aplikasi dan simpan state:
   ```cmd
   pm2 start server.js --name "monitoring-pks"
   pm2 save
   ```

### macOS (Apple Silicon / Intel)
1. Pasang PM2 secara global:
   ```bash
   npm install -g pm2
   ```
2. Jalankan aplikasi dan simpan:
   ```bash
   pm2 start server.js --name "monitoring-pks"
   pm2 save
   ```
3. Pasang script launchd startup:
   ```bash
   pm2 startup
   ```
   *(Jalankan perintah yang diinstruksikan oleh terminal).*

### Linux (Ubuntu/Debian)
1. Pasang PM2:
   ```bash
   sudo npm install -g pm2
   ```
2. Jalankan aplikasi:
   ```bash
   pm2 start server.js --name "monitoring-pks"
   pm2 save
   pm2 startup systemd
   ```

---

## 6. Setup Cloudflare Tunnel

Cloudflare Tunnel menghubungkan server lokal di laboratorium pabrik ke internet menggunakan domain perusahaan tanpa memerlukan IP publik statis atau konfigurasi port forwarding pada router.

### Langkah 1: Buat Tunnel di Cloudflare Dashboard
1. Buka [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. Masuk ke menu **Networks** $\rightarrow$ **Tunnels**.
3. Klik **Create a Tunnel**.
4. Pilih tipe konektor **Cloudflare Tunnel (cloudflared)**, lalu klik **Next**.
5. Masukkan nama tunnel (misal: `monitoring-pks-lab`), lalu klik **Save tunnel**.

### Langkah 2: Instalasi Konektor `cloudflared` di Komputer Host
1. Pada halaman instalasi, pilih sistem operasi komputer host (**Windows** atau **Mac** / **Linux**).
2. Cloudflare akan menampilkan perintah satu baris berisi token instalasi.
3. Jalankan perintah tersebut di terminal / Command Prompt (dengan hak Administrator).
   * **Contoh Windows**:
     ```cmd
     winget install --id Cloudflare.cloudflared
     cloudflared.exe service install <TOKEN_DARI_CLOUDFLARE>
     ```
   * **Contoh macOS (Apple Silicon via Homebrew)**:
     ```bash
     brew install cloudflared
     sudo cloudflared service install <TOKEN_DARI_CLOUDFLARE>
     ```
   * **Contoh Linux**:
     ```bash
     curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
     sudo dpkg -i cloudflared.deb
     sudo cloudflared service install <TOKEN_DARI_CLOUDFLARE>
     ```
4. Setelah service berjalan, indikator konektor pada dashboard Cloudflare akan berubah menjadi status **Connected** berwarna hijau. Klik **Next**.

### Langkah 3: Rute Domain Publik (Public Hostname)
Pada halaman **Public Hostname Page**:
1. **Subdomain**: Masukkan subdomain yang diinginkan (contoh: `monitoring` atau `lab-pks`).
2. **Domain**: Pilih domain yang terdaftar di akun Cloudflare Anda (contoh: `namaperusahaan.com`).
3. **Path**: Biarkan kosong.
4. **Service**:
   * **Type**: `HTTP`
   * **URL**: `localhost:3000`
5. Klik **Save tunnel**.

### Langkah 4: Verifikasi Akses Publik
Buka browser pada perangkat di luar jaringan pabrik (misal melalui smartphone dengan paket data seluler) dan akses:
```text
https://monitoring.namaperusahaan.com
```
Jika halaman login Monitoring PKS terbuka dengan koneksi HTTPS terenkripsi, maka setup tunnel telah berhasil.

---

## 7. Struktur Direktori Proyek

```text
monitoring-pks/
├── .env                  # Konfigurasi database, port, dan session secret
├── .gitignore            # Pengabaian file dependensi dan kredensial
├── package.json          # Metadata dependensi dan skrip Node.js
├── schema.sql            # Skrip DDL MySQL (users, monitoring, sessions)
├── buat-user.js          # Skrip seeder manual (opsional)
├── server.js             # Aplikasi Express, session MySQL, dan REST API
├── docs/
│   └── CLOUDFLARE_TUNNEL_SETUP.md
└── public/
    ├── login.html        # Antarmuka autentikasi
    ├── index.html        # Form input data laboratorium & generator pesan WhatsApp
    ├── laporan.html      # Dashboard ringkasan, tabel data, dan grafik Chart.js
    └── users.html        # Antarmuka manajemen user (khusus role admin)
```

---

## 8. Pemeliharaan Rutin

* **Melihat status server**:
  ```bash
  pm2 status
  ```
* **Melihat log aplikasi**:
  ```bash
  pm2 logs monitoring-pks
  ```
* **Restart server**:
  ```bash
  pm2 restart monitoring-pks
  ```
* **Backup basis data berkala**:
  ```bash
  mysqldump -u root -p monitoring_pks > backup_monitoring_pks.sql
  ```
