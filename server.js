const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "monitoring_pks",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
};
const db = mysql.createPool(dbConfig);

const sessionStore = new MySQLStore(
  {
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 12 * 60 * 60 * 1000,
    createDatabaseTable: true,
    endConnectionOnClose: false,
    schema: {
      tableName: "sessions",
    },
  },
  db
);

app.use(
  session({
    key: "pks_session_id",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 12 * 60 * 60 * 1000,
      secure: "auto",
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use(express.static("public"));
app.use(express.json());

const n = (value) => {
  return value === "" || value === undefined ? null : value;
};

app.get("/", (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect("/laporan.html");
  }
  res.redirect("/login.html");
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username dan password wajib diisi",
      });
    }

    const [rows] = await db.execute(
      "SELECT id, username, password, role FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Username atau password salah",
      });
    }

    const user = rows[0];

    const passwordBenar = await bcrypt.compare(password, user.password);

    if (!passwordBenar) {
      return res.status(401).json({
        status: "error",
        message: "Username atau password salah",
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    res.json({
      status: "success",
      message: "Login berhasil",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error login:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
});

app.get("/api/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      status: "error",
      message: "Belum login",
    });
  }

  res.json({
    status: "success",
    user: req.session.user,
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: "Gagal logout",
      });
    }

    res.clearCookie("pks_session_id");
    res.json({
      status: "success",
      message: "Logout berhasil",
    });
  });
});

function harusLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      status: "error",
      message: "Silakan login terlebih dahulu",
    });
  }
  next();
}

function harusAnalis(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      status: "error",
      message: "Silakan login terlebih dahulu",
    });
  }

  if (req.session.user.role !== "analis" && req.session.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Akses hanya untuk analis atau admin",
    });
  }

  next();
}

function harusAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      status: "error",
      message: "Akses hanya untuk admin",
    });
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Akses hanya untuk admin",
    });
  }

  next();
}

app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS hasil");
    res.json({
      status: "success",
      database: "MySQL terhubung",
      hasil: rows,
    });
  } catch (error) {
    console.error("Error test-db:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal terhubung ke MySQL",
    });
  }
});

app.post("/api/monitoring", harusAnalis, async (req, res) => {
  try {
    const data = req.body;
    const userId = req.session && req.session.user ? req.session.user.id : null;

    if (!data.tanggal || !data.pengambilan) {
      return res.status(400).json({
        status: "error",
        message: "Tanggal dan nomor pengambilan wajib diisi",
      });
    }

    const sql = `
      INSERT INTO monitoring (
        user_id,
        tanggal,
        pengambilan,
        salam,

        fp1, fp2, fp3, fp4, fp5, fp6,
        bp1, bp2, bp3, bp4,
        allhp, finalfe,
        solid1, solid2, solid3,
        v1ffa, v1moist, v1dobi,
        v2ffa, v2moist, v2dobi
      )
      VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?
      )
    `;

    const values = [
      userId,
      data.tanggal,
      data.pengambilan,
      data.salam || "Malam",

      n(data.fp1),
      n(data.fp2),
      n(data.fp3),
      n(data.fp4),
      n(data.fp5),
      n(data.fp6),

      n(data.bp1),
      n(data.bp2),
      n(data.bp3),
      n(data.bp4),

      n(data.allhp),
      n(data.finalfe),

      n(data.solid1),
      n(data.solid2),
      n(data.solid3),

      n(data.v1ffa),
      n(data.v1moist),
      n(data.v1dobi),

      n(data.v2ffa),
      n(data.v2moist),
      n(data.v2dobi),
    ];

    const [result] = await db.execute(sql, values);

    res.json({
      status: "success",
      message: "Data berhasil disimpan",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error simpan monitoring:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        status: "error",
        message: `Data untuk tanggal ${req.body.tanggal} pengambilan ke-${req.body.pengambilan} sudah pernah disimpan.`,
      });
    }

    res.status(500).json({
      status: "error",
      message: "Data gagal disimpan ke database",
    });
  }
});

app.get("/api/monitoring", harusLogin, async (req, res) => {
  try {
    const { tanggal } = req.query;

    if (!tanggal) {
      return res.status(400).json({
        status: "error",
        message: "Parameter tanggal wajib disertakan (format YYYY-MM-DD)",
      });
    }

    const [rows] = await db.execute(
      `
      SELECT m.*, u.username as input_oleh
      FROM monitoring m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.tanggal = ?
      ORDER BY m.pengambilan ASC
      `,
      [tanggal]
    );

    res.json({
      status: "success",
      data: rows,
    });
  } catch (error) {
    console.error("Error ambil monitoring:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data monitoring",
    });
  }
});

app.get("/api/users", harusAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, username, role, created_at FROM users ORDER BY id ASC"
    );
    res.json({
      status: "success",
      data: rows,
    });
  } catch (error) {
    console.error("Error get users:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar pengguna",
    });
  }
});

app.post("/api/users", harusAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        status: "error",
        message: "Username, password, dan role wajib diisi",
      });
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      return res.status(400).json({
        status: "error",
        message: "Username minimal 3 karakter",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password minimal 6 karakter",
      });
    }

    const validRoles = ["admin", "analis", "operator"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: "error",
        message: "Role harus salah satu dari: admin, analis, atau operator",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [cleanUsername, hash, role]
    );

    res.json({
      status: "success",
      message: `User '${cleanUsername}' berhasil dibuat`,
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error post user:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        status: "error",
        message: `Username '${req.body.username}' sudah digunakan`,
      });
    }
    res.status(500).json({
      status: "error",
      message: "Gagal menambahkan pengguna baru",
    });
  }
});

app.delete("/api/users/:id", harusAdmin, async (req, res) => {
  try {
    const targetId = Number(req.params.id);

    if (!targetId) {
      return res.status(400).json({
        status: "error",
        message: "ID user tidak valid",
      });
    }

    if (req.session.user && req.session.user.id === targetId) {
      return res.status(400).json({
        status: "error",
        message: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif",
      });
    }

    const [result] = await db.execute("DELETE FROM users WHERE id = ?", [targetId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "User tidak ditemukan",
      });
    }

    res.json({
      status: "success",
      message: "User berhasil dihapus",
    });
  } catch (error) {
    console.error("Error delete user:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal menghapus pengguna",
    });
  }
});

const DEFAULT_USERS = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "analis", password: "analis123", role: "analis" },
  { username: "operator", password: "operator123", role: "operator" },
];

async function inisialisasiDefaultUsers() {
  try {
    for (const u of DEFAULT_USERS) {
      const [rows] = await db.execute(
        "SELECT id FROM users WHERE username = ?",
        [u.username]
      );
      if (rows.length === 0) {
        const hash = await bcrypt.hash(u.password, 10);
        await db.execute(
          "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
          [u.username, hash, u.role]
        );
        console.log(`[INIT] User default '${u.username}' (${u.role}) berhasil ditambahkan otomatis.`);
      }
    }
  } catch (error) {
    console.warn("[INIT] Inisialisasi user default:", error.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Server Monitoring PKS berjalan di http://localhost:${PORT}`);
  await inisialisasiDefaultUsers();
});