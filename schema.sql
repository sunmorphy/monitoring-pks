-- ====================================================================
-- SKEMA BASIS DATA: MONITORING LABORATORIUM PABRIK KELAPA SAWIT (PKS)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS monitoring_pks
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE monitoring_pks;

-- 1. TABEL PENGGUNA (USERS)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'analis', 'operator') NOT NULL DEFAULT 'operator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABEL MONITORING LABORATORIUM
CREATE TABLE IF NOT EXISTS monitoring (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  tanggal DATE NOT NULL,
  pengambilan INT NOT NULL,
  salam VARCHAR(20) DEFAULT 'Malam',

  -- Fibre Press (FP 1 - 6) - Standar < 4.00%
  fp1 DECIMAL(5,2) NULL,
  fp2 DECIMAL(5,2) NULL,
  fp3 DECIMAL(5,2) NULL,
  fp4 DECIMAL(5,2) NULL,
  fp5 DECIMAL(5,2) NULL,
  fp6 DECIMAL(5,2) NULL,

  -- Bunch Press (BP 1 - 4) - Standar < 3.50%
  bp1 DECIMAL(5,2) NULL,
  bp2 DECIMAL(5,2) NULL,
  bp3 DECIMAL(5,2) NULL,
  bp4 DECIMAL(5,2) NULL,

  -- Nut Plant / Heavy Phase & Final Effluent
  allhp DECIMAL(5,2) NULL,
  finalfe DECIMAL(5,2) NULL,

  -- Solid Decanter (1 - 3)
  solid1 DECIMAL(5,2) NULL,
  solid2 DECIMAL(5,2) NULL,
  solid3 DECIMAL(5,2) NULL,

  -- CPO Produksi Tangki V1 (FFA < 5%, Moist < 0.150%, DOBI > 2)
  v1ffa DECIMAL(5,2) NULL,
  v1moist DECIMAL(5,3) NULL,
  v1dobi DECIMAL(5,2) NULL,

  -- CPO Produksi Tangki V2 (FFA < 5%, Moist < 0.150%, DOBI > 2)
  v2ffa DECIMAL(5,2) NULL,
  v2moist DECIMAL(5,3) NULL,
  v2dobi DECIMAL(5,2) NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Mencegah duplikasi input untuk tanggal & nomor pengambilan yang sama
  CONSTRAINT unique_tanggal_pengambilan UNIQUE (tanggal, pengambilan),

  -- Relasi ke pencatat data (audit trail)
  CONSTRAINT fk_monitoring_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indeks pencarian data monitoring berdasarkan tanggal
CREATE INDEX idx_monitoring_tanggal ON monitoring (tanggal);

-- 3. TABEL SESI LOGIN (Dibuat otomatis oleh express-mysql-session jika belum ada)
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  expires INT(11) UNSIGNED NOT NULL,
  data MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
