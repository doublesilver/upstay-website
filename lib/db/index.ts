import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
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
  const tableInfo = database.prepare("PRAGMA table_info(remodeling_cases)").all() as {
    name: string;
  }[];
  if (tableInfo.some((col) => col.name === "before_image")) {
    database.exec("DROP TABLE IF EXISTS remodeling_cases");
  }

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

  const announcementCols = database
    .prepare("PRAGMA table_info(announcements)")
    .all() as { name: string }[];
  if (!announcementCols.some((col) => col.name === "dismiss_duration")) {
    database.exec(
      "ALTER TABLE announcements ADD COLUMN dismiss_duration TEXT NOT NULL DEFAULT 'none'",
    );
  }

  insertDefaultConfig(database);
  seedRemodelingCases(database);
  applyMigrations(database);
}

function insertDefaultConfig(database: Database.Database) {
  const insert = database.prepare(
    "INSERT OR IGNORE INTO site_config (key, value) VALUES (?, ?)",
  );

  insert.run("slogan_text", "공간의 가치를 업스테이가 높여드립니다");

  insert.run("footer_name", "업스테이");
  insert.run("footer_english_name", "up stay");
  insert.run("footer_ceo", "이동훈");
  insert.run("footer_address", "서울시 강남구 논현로 26길 82 (도곡동 157-26번지) 1층");
  insert.run("footer_label_name_spacing", "0.4em");
  insert.run("footer_label_ceo_spacing", "0em");
  insert.run("footer_label_business_number_spacing", "0em");
  insert.run("footer_label_phone_spacing", "0.85em");
  insert.run("footer_label_address_spacing", "1.7em");
  insert.run("footer_business_number", "308-25-02055");
  insert.run("footer_phone", "010-3168-0624");

  insert.run("remodeling_section_title", "리모델링 사례보기");
  insert.run("remodeling_page_title", "리모델링");
  insert.run("remodeling_page_subtitle", "Before → After");

  insert.run("service_remodeling_title", "리모델링");
  insert.run(
    "service_remodeling_desc",
    "주방, 욕실, 발코니, 타일, 천정, 도배, 바닥, 목공, 몰딩, 도장 등 공사의 관리 모든 것",
  );
  insert.run("service_remodeling_caption", "공사의 관리 모든 것");
  insert.run("service_building_title", "건물관리");
  insert.run(
    "service_building_desc",
    "설비, 전기, 수도, 주차장, 청소 및 보수, 유지, 하자보수 등 모든 것",
  );
  insert.run("service_building_caption", "보수, 유지, 하자보수 등 모든 것");
  insert.run("service_rental_title", "임대관리");
  insert.run(
    "service_rental_desc",
    "공실관리 및 입주자 응대와 시설물관리\n월세 관리비 공과금 정산 및 세대납부,\n민원접수 및 처리, 입주안내문 발송진행",
  );
  insert.run("service_rental_caption", "임대차의 모든 업무");

  insert.run("footer_colon_left_offset", "0px");
  insert.run("footer_colon_right_offset", "0px");
  insert.run("schema_version", "3");
}

function seedRemodelingCases(database: Database.Database) {
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
      database.exec(sql);
      insertMigration.run(file);
    });
    tx();
  }
}
