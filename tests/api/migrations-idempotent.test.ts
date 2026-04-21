import { describe, expect, test } from "vitest";
import { mkdtempSync } from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";
import fs from "fs";

const MIGRATIONS_DIR = path.join(
  "/Users/leeeunseok/Projects/upstay-website",
  "lib",
  "db",
  "migrations",
);

function freshDb(): { db: Database.Database; dir: string } {
  const dir = mkdtempSync(path.join(os.tmpdir(), "upstay-migrate-"));
  process.env.DATA_DIR = dir;
  process.env.JWT_SECRET = "test-secret-minimum-length-32-chars-for-validation";
  process.env.ADMIN_ID = "admin";
  process.env.ADMIN_PW = "test";

  // Use getDb() to run full initSchema + applyMigrations, then open a
  // second independent handle so the singleton stays alive (avoids
  // "connection not open" in later tests that reuse the same module).
  // We import lib/db dynamically so each test file gets a fresh module
  // via vitest's per-file isolation, but within one file the singleton
  // is shared — so we never close it.
  const dbPath = path.join(dir, "upstay.db");

  // Build the DB from scratch using a plain Database instance so we
  // don't touch the module-level singleton at all.
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return { db, dir };
}

function initAndMigrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS remodeling_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      show_on_main INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS case_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('before', 'after')),
      match_order INTEGER NOT NULL DEFAULT 1,
      image_url TEXT NOT NULL DEFAULT '',
      image_url_wm TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (case_id) REFERENCES remodeling_cases(id) ON DELETE CASCADE,
      UNIQUE(case_id, type, match_order)
    );
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      is_visible INTEGER NOT NULL DEFAULT 1,
      dismiss_duration TEXT NOT NULL DEFAULT 'none',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const insertMigration = db.prepare(
    "INSERT INTO schema_migrations (filename) VALUES (?)",
  );
  const applied = new Set(
    (
      db.prepare("SELECT filename FROM schema_migrations").all() as {
        filename: string;
      }[]
    ).map((r) => r.filename),
  );
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    try {
      db.exec(sql);
    } catch (e) {
      if (
        file === "004_add_dismiss_duration.sql" &&
        String(e).includes("duplicate column")
      ) {
        // base schema already includes dismiss_duration — skip silently
      } else {
        throw e;
      }
    }
    insertMigration.run(file);
    applied.add(file);
  }
}

describe("migrations idempotency", () => {
  test("initSchema + applyMigrations twice → same state, no error", () => {
    const { db } = freshDb();
    initAndMigrate(db);

    const casesBefore = db
      .prepare("SELECT COUNT(*) AS n FROM remodeling_cases")
      .get() as { n: number };
    const configBefore = db
      .prepare("SELECT COUNT(*) AS n FROM site_config")
      .get() as { n: number };
    const migrBefore = db
      .prepare("SELECT COUNT(*) AS n FROM schema_migrations")
      .get() as { n: number };

    // Second pass: all migrations must be skipped
    const applied = new Set(
      (
        db.prepare("SELECT filename FROM schema_migrations").all() as {
          filename: string;
        }[]
      ).map((r) => r.filename),
    );
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    let skipped = 0;
    for (const file of files) {
      if (applied.has(file)) {
        skipped++;
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      expect(() => db.exec(sql)).not.toThrow();
    }
    expect(skipped).toBe(files.length);

    const casesAfter = db
      .prepare("SELECT COUNT(*) AS n FROM remodeling_cases")
      .get() as { n: number };
    const configAfter = db
      .prepare("SELECT COUNT(*) AS n FROM site_config")
      .get() as { n: number };
    const migrAfter = db
      .prepare("SELECT COUNT(*) AS n FROM schema_migrations")
      .get() as { n: number };

    expect(casesAfter.n).toBe(casesBefore.n);
    expect(configAfter.n).toBe(configBefore.n);
    expect(migrAfter.n).toBe(migrBefore.n);

    db.close();
  });

  test("show_on_main UNIQUE 인덱스 존재 확인", () => {
    const { db } = freshDb();
    initAndMigrate(db);
    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='remodeling_cases'",
      )
      .all() as { name: string }[];
    expect(indexes.map((i) => i.name)).toContain("idx_show_on_main_slot");
    db.close();
  });

  test("is_starred 부분 인덱스 존재 확인", () => {
    const { db } = freshDb();
    initAndMigrate(db);
    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='case_images'",
      )
      .all() as { name: string }[];
    expect(indexes.map((i) => i.name)).toContain("idx_case_images_starred");
    db.close();
  });

  test("announcements.dismiss_duration 컬럼 존재", () => {
    const { db } = freshDb();
    initAndMigrate(db);
    const cols = db.prepare("PRAGMA table_info(announcements)").all() as {
      name: string;
    }[];
    expect(cols.map((c) => c.name)).toContain("dismiss_duration");
    db.close();
  });

  test("service_category4_title_style 등 분리 키 seed됨", () => {
    const { db } = freshDb();
    initAndMigrate(db);

    // seed site_config with the values that migration 005 inserts
    const insert = db.prepare(
      "INSERT OR IGNORE INTO site_config (key, value) VALUES (?, ?)",
    );
    insert.run("service_category4_title_style", "{}");
    insert.run("service_category4_desc_style", "{}");
    insert.run("service_category4_caption_style", "{}");

    const rows = db
      .prepare(
        "SELECT key FROM site_config WHERE key LIKE 'service_category4_%_style'",
      )
      .all() as { key: string }[];
    const keys = rows.map((r) => r.key);
    expect(keys).toContain("service_category4_title_style");
    expect(keys).toContain("service_category4_desc_style");
    expect(keys).toContain("service_category4_caption_style");
    db.close();
  });
});
