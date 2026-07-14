const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors()); // allow the frontend (different origin/port) to call this API
app.use(express.json());

// Database connection settings come from environment variables,
// set in docker-compose.yaml — never hardcoded here.
const pool = new Pool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD || "apppassword",
  database: process.env.DB_NAME || "guestbook",
  port: process.env.DB_PORT || 5432,
});

// Retry logic: Postgres may still be starting up when this container starts
async function connectWithRetry(retries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      console.log("Connected to the database.");
      return;
    } catch (err) {
      console.log(`Database not ready yet (attempt ${attempt}/${retries}). Retrying in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Could not connect to the database after several attempts.");
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

app.get("/api/messages", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, message, created_at FROM messages ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed." });
  }
});

app.post("/api/messages", async (req, res) => {
  const name = (req.body.name || "").trim();
  const message = (req.body.message || "").trim();
  if (!name || !message) {
    return res.status(400).json({ error: "Both 'name' and 'message' are required." });
  }
  try {
    await pool.query(
      "INSERT INTO messages (name, message) VALUES ($1, $2)",
      [name, message]
    );
    res.status(201).json({ status: "created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save message." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = 5000;
(async () => {
  await connectWithRetry();
  await initDb();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend API listening on port ${PORT}`);
  });
})();
