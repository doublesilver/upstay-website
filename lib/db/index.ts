import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "upstay.db");

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

function initSchema(db: Database.Database) {
  // 기존 스키마 감지: before_image 컬럼이 있으면 구버전 → DROP 후 재생성
  const tableInfo = db.prepare("PRAGMA table_info(remodeling_cases)").all() as {
    name: string;
  }[];
  if (tableInfo.some((col) => col.name === "before_image")) {
    db.exec("DROP TABLE IF EXISTS remodeling_cases");
  }

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
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 기본값 삽입
  const existing = db
    .prepare("SELECT COUNT(*) as cnt FROM site_config")
    .get() as { cnt: number };
  if (existing.cnt === 0) {
    const insert = db.prepare(
      "INSERT OR IGNORE INTO site_config (key, value) VALUES (?, ?)",
    );
    insert.run("hero_title", "공간의 가치를\n업스테이가 높입니다");
    insert.run("hero_subtitle", "리모델링 · 건물관리 · 임대관리");
    insert.run("schema_version", "2");
  }

  // 기본 리모델링 사례 삽입
  const caseCount = db
    .prepare("SELECT COUNT(*) as cnt FROM remodeling_cases")
    .get() as { cnt: number };
  if (caseCount.cnt === 0) {
    const insertCase = db.prepare(
      "INSERT INTO remodeling_cases (title, sort_order) VALUES (?, ?)",
    );
    const insertImage = db.prepare(
      "INSERT INTO case_images (case_id, type, match_order, image_url) VALUES (?, ?, ?, ?)",
    );

    const seedCases = [
      {
        title: "사례 1",
        sortOrder: 1,
        before:
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&h=900&q=80",
        after:
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&h=900&q=80",
      },
      {
        title: "사례 2",
        sortOrder: 2,
        before:
          "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&h=900&q=80",
        after:
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&h=900&q=80",
      },
      {
        title: "사례 3",
        sortOrder: 3,
        before:
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&h=900&q=80",
        after:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=900&q=80",
      },
      {
        title: "사례 4",
        sortOrder: 4,
        before:
          "https://images.unsplash.com/photo-1533779283484-8ad4940aa3a8?auto=format&fit=crop&w=1200&h=900&q=80",
        after:
          "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&h=900&q=80",
      },
    ];

    for (const seed of seedCases) {
      const result = insertCase.run(seed.title, seed.sortOrder);
      const caseId = result.lastInsertRowid;
      insertImage.run(caseId, "before", 1, seed.before);
      insertImage.run(caseId, "after", 1, seed.after);
    }
  }
}
