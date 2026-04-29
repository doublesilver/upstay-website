import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { DATA_DIR } from "@/lib/paths";
import { CONFIG_ENTRIES } from "@/lib/config-schema";

const DB_PATH = path.join(DATA_DIR, "upstay.db");
const MIGRATIONS_DIR = path.join(process.cwd(), "lib", "db", "migrations");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
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

  insertDefaultConfig(database);
  seedRemodelingCases(database);
  applyMigrations(database);
}

function insertDefaultConfig(database: Database.Database) {
  const insert = database.prepare(
    "INSERT OR IGNORE INTO site_config (key, value) VALUES (?, ?)",
  );

  for (const entry of CONFIG_ENTRIES) {
    insert.run(entry.key, entry.default);
  }

  insert.run("remodeling_section_title", "리모델링 사례보기");
  insert.run("remodeling_page_title", "리모델링");
  insert.run("remodeling_page_subtitle", "Before → After");

  const migrationFiles = fs.existsSync(MIGRATIONS_DIR)
    ? fs.readdirSync(MIGRATIONS_DIR).filter((f) => /^\d+_.*\.sql$/.test(f))
    : [];
  const latestVersion = String(
    Math.max(0, ...migrationFiles.map((f) => parseInt(f.split("_")[0], 10))),
  );
  insert.run("schema_version", latestVersion);
}

function seedRemodelingCases(database: Database.Database) {
  if (process.env.SEED_DEMO !== "1") return;

  const caseCount = database
    .prepare("SELECT COUNT(*) as cnt FROM remodeling_cases")
    .get() as { cnt: number };

  if (caseCount.cnt > 0) return;

  const insertCase = database.prepare(
    "INSERT INTO remodeling_cases (title, sort_order) VALUES (?, ?)",
  );
  const insertImage = database.prepare(
    "INSERT INTO case_images (case_id, type, match_order, image_url) VALUES (?, ?, ?, ?)",
  );

  const seedCases = [
    {
      title: "",
      sortOrder: 1,
      before:
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&h=900&q=80",
      after:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&h=900&q=80",
    },
    {
      title: "",
      sortOrder: 2,
      before:
        "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&h=900&q=80",
      after:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&h=900&q=80",
    },
    {
      title: "",
      sortOrder: 3,
      before:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&h=900&q=80",
      after:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=900&q=80",
    },
    {
      title: "",
      sortOrder: 4,
      before:
        "https://images.unsplash.com/photo-1533779283484-8ad4940aa3a8?auto=format&fit=crop&w=1200&h=900&q=80",
      after:
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&h=900&q=80",
    },
  ];

  const extraBefores = [
    "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=600&h=400&q=80",
  ];
  const extraAfters = [
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=600&h=400&q=80",
  ];

  for (const seed of seedCases) {
    const result = insertCase.run(seed.title, seed.sortOrder);
    const caseId = Number(result.lastInsertRowid);

    insertImage.run(caseId, "before", 1, seed.before);
    insertImage.run(caseId, "after", 1, seed.after);

    for (let i = 0; i < 3; i++) {
      insertImage.run(caseId, "before", i + 2, extraBefores[i]);
      insertImage.run(caseId, "after", i + 2, extraAfters[i]);
    }
  }
}

function applyMigrations(database: Database.Database) {
  if (!fs.existsSync(MIGRATIONS_DIR)) return;

  const applied = new Set(
    (
      database
        .prepare("SELECT filename FROM schema_migrations ORDER BY filename ASC")
        .all() as { filename: string }[]
    ).map((row) => row.filename),
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const insertMigration = database.prepare(
    "INSERT INTO schema_migrations (filename) VALUES (?)",
  );

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const tx = database.transaction(() => {
      try {
        database.exec(sql);
      } catch (e) {
        const msg = String(e);
        if (
          msg.includes("duplicate column") ||
          msg.includes("no such column")
        ) {
          // ALTER ADD/DROP COLUMN 멱등 처리:
          // - duplicate column: 기존 DB에 이미 컬럼 존재
          // - no such column: 컬럼이 이미 없거나 fresh DB라 DROP 불필요
        } else {
          throw e;
        }
      }
      insertMigration.run(file);
    });
    tx();
  }
}
