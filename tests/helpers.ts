import Database from "better-sqlite3";

export function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE remodeling_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      show_on_main INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE case_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('before', 'after')),
      match_order INTEGER NOT NULL DEFAULT 1,
      is_starred INTEGER NOT NULL DEFAULT 0,
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
    images?: Array<{
      type: "before" | "after";
      match_order: number;
      is_starred?: number;
      image_url?: string;
    }>;
  } = {},
): number {
  const caseId = Number(
    db
      .prepare(
        "INSERT INTO remodeling_cases (title, show_on_main) VALUES (?, ?)",
      )
      .run("", opts.showOnMain ?? 0).lastInsertRowid,
  );
  for (const img of opts.images ?? []) {
    db.prepare(
      "INSERT INTO case_images (case_id, type, match_order, is_starred, image_url) VALUES (?, ?, ?, ?, ?)",
    ).run(
      caseId,
      img.type,
      img.match_order,
      img.is_starred ?? 0,
      img.image_url ??
        `https://example.com/${caseId}-${img.type}-${img.match_order}.jpg`,
    );
  }
  return caseId;
}
