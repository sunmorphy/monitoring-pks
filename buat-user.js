const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
require("dotenv").config();

async function buatUser() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  const users = [
    {
      username: "admin",
      password: "admin123",
      role: "admin",
    },
    {
      username: "analis",
      password: "analis123",
      role: "analis",
    },
    {
      username: "operator",
      password: "operator123",
      role: "operator",
    },
  ];

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);

    await db.execute(
      `
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
      `,
      [user.username, hash, user.role]
    );

    console.log(`User ${user.username} berhasil dibuat`);
  }

  await db.end();
}

buatUser().catch(console.error);