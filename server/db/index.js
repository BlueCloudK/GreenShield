import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function createDatabase(databasePath = process.env.DATABASE_PATH || path.join(rootDir, "data", "greenshield.db")) {
  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  runMigrations(db);
  return db;
}

export function runMigrations(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`);
  const migrationDir = path.join(rootDir, "server", "db", "migrations");
  const applied = db.prepare("SELECT 1 FROM schema_migrations WHERE version = ?");
  const markApplied = db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)");

  for (const filename of fs.readdirSync(migrationDir).filter((name) => name.endsWith(".sql")).sort()) {
    if (applied.get(filename)) continue;
    const sql = fs.readFileSync(path.join(migrationDir, filename), "utf8");
    db.transaction(() => {
      db.exec(sql);
      markApplied.run(filename, new Date().toISOString());
    })();
  }
}

export function json(value, fallback = {}) {
  try {
    return JSON.parse(value || "") ?? fallback;
  } catch {
    return fallback;
  }
}

