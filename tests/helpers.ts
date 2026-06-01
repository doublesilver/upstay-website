import Database from "better-sqlite3";

export function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");

  // 운영 스키마(lib/db/index.ts + migrations 001·008·019)와 정렬:
  // slot_position(별표 슬롯 1-4)·is_draft(새박스)가 실제 공개 필터의 핵심.
  db.exec(`
    CREATE TABLE remodeling_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      show_on_main INTEGER NOT NULL DEFAULT 0,
      is_draft INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE case_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('before', 'after')),
      match_order INTEGER NOT NULL DEFAULT 1,
      is_starred INTEGER NOT NULL DEFAULT 0,
      slot_position INTEGER NOT NULL DEFAULT 0,
      image_url TEXT NOT NULL DEFAULT '',
      image_url_wm TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (case_id) REFERENCES remodeling_cases(id) ON DELETE CASCADE,
      UNIQUE(case_id, type, match_order)
    );
  `);

  return db;
}

export function seedCase(
  db: Database.Database,
  opts: {
    showOnMain?: number;
    isDraft?: number;
    images?: Array<{
      type: "before" | "after";
      match_order: number;
      is_starred?: number;
      slot_position?: number;
      image_url?: string;
    }>;
  } = {},
): number {
  const caseId = Number(
    db
      .prepare(
        "INSERT INTO remodeling_cases (title, show_on_main, is_draft) VALUES (?, ?, ?)",
      )
      .run("", opts.showOnMain ?? 0, opts.isDraft ?? 0).lastInsertRowid,
  );
  for (const img of opts.images ?? []) {
    db.prepare(
      "INSERT INTO case_images (case_id, type, match_order, is_starred, slot_position, image_url) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(
      caseId,
      img.type,
      img.match_order,
      img.is_starred ?? 0,
      img.slot_position ?? 0,
      img.image_url ??
        `https://example.com/${caseId}-${img.type}-${img.match_order}.jpg`,
    );
  }
  return caseId;
}
