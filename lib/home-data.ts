import { getDb } from "@/lib/db";

export interface RemodelingCase {
  id: number;
  title: string;
  before_image: string;
  after_image: string;
  before_images: string[];
  after_images: string[];
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  dismiss_duration: string;
  created_at: string;
}

function buildCases(
  rows: { id: number; title: string }[],
  imageLimit?: number,
): RemodelingCase[] {
  if (rows.length === 0) return [];

  const db = getDb();
  const caseIds = rows.map((c) => c.id);
  const placeholders = caseIds.map(() => "?").join(",");

  const allImages = db
    .prepare(
      `SELECT case_id, type, match_order, image_url, image_url_wm, is_starred
       FROM case_images
       WHERE case_id IN (${placeholders}) AND image_url <> '' AND is_starred = 1
       ORDER BY match_order ASC, id ASC`,
    )
    .all(...caseIds) as {
    case_id: number;
    type: "before" | "after";
    match_order: number;
    image_url: string;
    image_url_wm: string;
    is_starred: number;
  }[];

  const imageMap = new Map<number, typeof allImages>();
  for (const img of allImages) {
    if (!imageMap.has(img.case_id)) imageMap.set(img.case_id, []);
    imageMap.get(img.case_id)!.push(img);
  }

  return rows
    .map((c) => {
      const images = imageMap.get(c.id) || [];
      const befores = images
        .filter((i) => i.type === "before")
        .map((i) => i.image_url_wm || i.image_url)
        .filter(Boolean);
      const afters = images
        .filter((i) => i.type === "after")
        .map((i) => i.image_url_wm || i.image_url)
        .filter(Boolean);

      return {
        id: c.id,
        title: c.title,
        before_image: befores[0] || "",
        after_image: afters[0] || "",
        before_images: imageLimit ? befores.slice(0, imageLimit) : befores,
        after_images: imageLimit ? afters.slice(0, imageLimit) : afters,
      };
    })
    .filter((item) => item.before_images.length + item.after_images.length > 0);
}

export function getMainCases(): RemodelingCase[] {
  const db = getDb();
  const cases = db
    .prepare(
      "SELECT id, title FROM remodeling_cases WHERE show_on_main IN (1, 2, 3) ORDER BY show_on_main ASC, sort_order ASC, id ASC",
    )
    .all() as { id: number; title: string }[];

  return buildCases(cases, 4);
}

export function getAllCases(): RemodelingCase[] {
  const db = getDb();
  const cases = db
    .prepare(
      "SELECT id, title FROM remodeling_cases ORDER BY sort_order ASC, id ASC",
    )
    .all() as { id: number; title: string }[];

  return buildCases(cases, 4);
}

export function getVisibleAnnouncements(): Announcement[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, title, content, dismiss_duration, created_at FROM announcements WHERE is_visible = 1 ORDER BY created_at DESC LIMIT 5",
    )
    .all() as Announcement[];
}

export function getSiteConfig(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM site_config").all() as {
    key: string;
    value: string;
  }[];
  const config: Record<string, string> = {};
  for (const row of rows) config[row.key] = row.value;
  return config;
}
