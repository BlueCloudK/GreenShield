import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AsyncLocalStorage } from "node:async_hooks";
import pg from "pg";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export async function createDatabase(
  databasePath = process.env.DATABASE_PATH || path.join(rootDir, "data", "greenshield.db"),
  connectionString = process.env.DATABASE_URL,
) {
  if (connectionString && databasePath !== ":memory:") {
    const db = await connectPostgres(connectionString);
    try {
      await runMigrations(db);
    } catch (error) {
      await db.close();
      throw error;
    }
    return db;
  }
  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  const wrapped = wrapSqlite(db);
  await runMigrations(wrapped);
  return wrapped;
}

export async function runMigrations(db) {
  await db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`);
  const migrationDir = path.join(rootDir, "server", "db", "migrations");
  const applied = db.prepare("SELECT 1 FROM schema_migrations WHERE version = ?");
  const markApplied = db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)");

  for (const filename of fs
    .readdirSync(migrationDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    const sql = fs.readFileSync(path.join(migrationDir, filename), "utf8");
    await db.transaction(async () => {
      if (db.dialect === "postgres") await db.exec("SELECT pg_advisory_xact_lock(78293451)");
      if (await applied.get(filename)) return;
      await db.exec(sql);
      if (db.dialect === 'postgres') {
        for (const table of ['email_verifications', 'payment_orders', 'payment_receipts', 'endpoint_evaluations']) {
          await db.exec(`DO $$ BEGIN IF to_regclass('greenshield.${table}') IS NOT NULL THEN
            ALTER TABLE greenshield.${table} ENABLE ROW LEVEL SECURITY;
            REVOKE ALL ON greenshield.${table} FROM PUBLIC;
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON greenshield.${table} FROM anon; END IF;
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON greenshield.${table} FROM authenticated; END IF;
          END IF; END $$;`);
        }
      }
      await markApplied.run(filename, new Date().toISOString());
    })();
  }
}

export function postgresParameters(sql) {
  let index = 0;
  return sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|\?/g, (token) => (token === "?" ? `$${++index}` : token));
}

async function connectPostgres(connectionString) {
  const sslCa = process.env.DATABASE_SSL_CA;
  const pool = new pg.Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    ssl: process.env.DATABASE_SSL === "false" ? false : {
      rejectUnauthorized: true,
      ...(sslCa ? { ca: fs.readFileSync(sslCa, "utf8") } : {}),
    },
    options: "-c search_path=greenshield",
  });
  pool.on("error", (error) => console.error(JSON.stringify({ level: "error", message: "Database connection error", code: error.code })));
  try {
    await pool.query("CREATE SCHEMA IF NOT EXISTS greenshield");
  } catch (error) {
    await pool.end();
    throw error;
  }
  const context = new AsyncLocalStorage();
  const query = (sql, args = []) => (context.getStore() || pool).query({ text: postgresParameters(sql), values: args });
  return {
    dialect: "postgres",
    prepare(sql) {
      return {
        async get(...args) {
          return normalizeRow((await query(sql, args)).rows[0]);
        },
        async all(...args) {
          return (await query(sql, args)).rows.map(normalizeRow);
        },
        async run(...args) {
          return { changes: (await query(sql, args)).rowCount };
        },
      };
    },
    exec: (sql) => query(sql),
    transaction(callback) {
      return async (...args) => {
        if (context.getStore()) return callback(...args);
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const value = await context.run(client, () => callback(...args));
          await client.query("COMMIT");
          return value;
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        } finally {
          client.release();
        }
      };
    },
    close: () => pool.end(),
  };
}

function normalizeRow(row) {
  if (!row) return row;
  // COUNT returns int8 strings in pg, whereas SQLite returns numbers.
  for (const key of [
    "count",
    "target_count",
    "scan_count",
    "open_findings",
    "active_projects",
    "recent_scans",
    "high_findings",
    "fixed_findings",
    "cnt",
    "order_code",
  ]) {
    if (typeof row[key] === "string" && /^\d+$/.test(row[key])) row[key] = Number(row[key]);
  }
  return row;
}

function wrapSqlite(raw) {
  const context = new AsyncLocalStorage();
  let tail = Promise.resolve();
  function exclusive(callback) {
    if (context.getStore()) return Promise.resolve().then(callback);
    const task = tail.then(() => context.run(true, callback));
    tail = task.catch(() => {});
    return task;
  }
  return {
    dialect: "sqlite",
    prepare(sql) {
      const statement = raw.prepare(sql);
      return Object.fromEntries(["get", "all", "run"].map((method) => [method, (...args) => exclusive(() => statement[method](...args))]));
    },
    exec: (sql) => exclusive(() => raw.exec(sql)),
    transaction(callback) {
      return (...args) => {
        if (context.getStore()) return callback(...args);
        return exclusive(async () => {
          raw.exec("BEGIN IMMEDIATE");
          try {
            const value = await callback(...args);
            raw.exec("COMMIT");
            return value;
          } catch (error) {
            raw.exec("ROLLBACK");
            throw error;
          }
        });
      };
    },
    close: () => exclusive(() => raw.close()),
  };
}

export function json(value, fallback = {}) {
  try {
    return JSON.parse(value || "") ?? fallback;
  } catch {
    return fallback;
  }
}
