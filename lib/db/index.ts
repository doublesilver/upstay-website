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
      dismiss_duration TEXT NOT NULL DEFAULT 'none',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 기존 announcements 테이블에 dismiss_duration 컬럼 추가 (없을 경우)
  const announcementCols = db
    .prepare("PRAGMA table_info(announcements)")
    .all() as { name: string }[];
  if (!announcementCols.some((col) => col.name === "dismiss_duration")) {
    db.exec(
      "ALTER TABLE announcements ADD COLUMN dismiss_duration TEXT NOT NULL DEFAULT 'none'",
    );
  }

  // 기본 config 값 삽입 (INSERT OR IGNORE로 기존 값 보존)
  const insert = db.prepare(
    "INSERT OR IGNORE INTO site_config (key, value) VALUES (?, ?)",
  );

  insert.run("slogan_text", "공간의 가치를 업스테이가 높여드립니다");

  // 푸터 사업자 정보
  insert.run("footer_name", "업스테이");
  insert.run("footer_english_name", "up stay");
  insert.run("footer_ceo", "안민혁");
  insert.run(
    "footer_address",
    "서울시 강남구 학동로 26길 82 (논현동 157-26번지 1층)",
  );
  insert.run("footer_label_name_spacing", "0.4em");
  insert.run("footer_label_ceo_spacing", "0em");
  insert.run("footer_label_business_number_spacing", "0em");
  insert.run("footer_label_phone_spacing", "0.85em");
  insert.run("footer_label_address_spacing", "1.7em");
  insert.run("footer_business_number", "308-25-02055");
  insert.run("footer_phone", "010-3168-0624");

  // 메인 페이지 텍스트
  insert.run("remodeling_section_title", "리모델링 사례보기");

  // 리모델링 페이지 텍스트
  insert.run("remodeling_page_title", "리모델링");
  insert.run("remodeling_page_subtitle", "Before → After");

  // 서비스 섹션 제목/설명
  insert.run("service_remodeling_title", "리모델링");
  insert.run(
    "service_remodeling_desc",
    "주방, 욕실, 베란다, 현관, 천정, 도배, 바닥, 구멍, 몰딩, 샷시 등 공사에 관한 모든 것",
  );
  insert.run("service_building_title", "건물관리");
  insert.run(
    "service_building_desc",
    "설비, 전기, 수도, 주차, 청소 등 수선, 유지, 하자보수의 모든 것",
  );
  insert.run("service_rental_title", "임대관리");
  insert.run(
    "service_rental_desc",
    "공실관리, 입퇴실 시 입주자 및 시설물관리,\n월세 관리비 공과금 정산 및 수납독촉,\n민원접수 및 처리, 악성연체자 소송진행",
  );

  insert.run("schema_version", "3");

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
      const caseId = result.lastInsertRowid;
      insertImage.run(caseId, "before", 1, seed.before);
      insertImage.run(caseId, "after", 1, seed.after);
      for (let i = 0; i < 3; i++) {
        insertImage.run(caseId, "before", i + 2, extraBefores[i]);
        insertImage.run(caseId, "after", i + 2, extraAfters[i]);
      }
    }
  }
}
