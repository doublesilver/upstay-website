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

  insert.run("hero_title", "공간의 가치를\n업스테이가 높입니다");
  insert.run("hero_subtitle", "리모델링 · 건물관리 · 임대관리");

  // 메인 페이지 텍스트
  insert.run("remodeling_section_title", "리모델링");
  insert.run("remodeling_more_text", "더보기 →");

  // 리모델링 페이지 텍스트
  insert.run("remodeling_page_title", "리모델링");
  insert.run("remodeling_page_subtitle", "Before → After");

  // 서비스 섹션 제목/캡션
  insert.run("service_remodeling_title", "리모델링");
  insert.run("service_remodeling_caption", "공사에 관한 모든 것");
  insert.run("service_building_title", "건물관리");
  insert.run("service_building_caption", "수선 · 유지 · 하자보수");
  insert.run("service_rental_title", "임대관리");
  insert.run("service_rental_caption", "공실 · 입퇴실 · 민원");

  // 서비스 아이템 (JSON 배열)
  insert.run(
    "remodeling_items",
    JSON.stringify([
      { title: "주방", description: "싱크대·타일·후드 교체" },
      { title: "욕실", description: "방수·타일·위생기구 교체" },
      { title: "베란다", description: "확장·샷시·방수 공사" },
      { title: "현관", description: "중문·신발장·타일 시공" },
      { title: "천장", description: "몰딩·조명·텍스 교체" },
      { title: "도배", description: "벽지·페인트·곰팡이 처리" },
      { title: "바닥", description: "장판·마루·타일 시공" },
      { title: "기타", description: "구멍보수·샷시·몰딩 등" },
    ]),
  );
  insert.run(
    "building_items",
    JSON.stringify([
      {
        title: "설비",
        description: "냉난방 · 급배수 · 환기 등 기본 설비 점검 및 유지보수",
      },
      {
        title: "전기",
        description: "차단기 · 조명 · 콘센트 등 전기 설비 유지보수",
      },
      { title: "목공", description: "마감재 · 문틀 · 내장 마감 보수 작업" },
      {
        title: "소방",
        description: "소화기 · 스프링클러 · 비상구 등 소방 설비 점검",
      },
      { title: "청소", description: "공용부 및 외부 공간의 정기 청소 관리" },
    ]),
  );
  insert.run(
    "rental_items",
    JSON.stringify([
      { title: "공실관리", description: "상태 점검 및 다음 임차 준비" },
      { title: "입퇴실 관리", description: "시설물 확인 및 인계 절차" },
      { title: "수납 관리", description: "월세·관리비·공과금 정산 및 독촉" },
      { title: "민원 처리", description: "임차인 요청·불편 사항 해결" },
      { title: "연체 대응", description: "소송·재판·강제 퇴실 법적 절차" },
    ]),
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

    for (const seed of seedCases) {
      const result = insertCase.run(seed.title, seed.sortOrder);
      const caseId = result.lastInsertRowid;
      insertImage.run(caseId, "before", 1, seed.before);
      insertImage.run(caseId, "after", 1, seed.after);
    }
  }
}
