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

export function getMainCases(): RemodelingCase[] {
  const db = getDb();
  const cases = db
    .prepare(
      "SELECT id, title FROM remodeling_cases WHERE show_on_main >= 1 ORDER BY show_on_main ASC",
    )
    .all() as { id: number; title: string }[];

  if (cases.length === 0) return [];

  const caseIds = cases.map((c) => c.id);
  const allImages = db
    .prepare(
      `SELECT case_id, type, match_order, image_url, image_url_wm FROM case_images WHERE case_id IN (${caseIds.map(() => "?").join(",")}) ORDER BY match_order ASC, type ASC`,
    )
    .all(...caseIds) as {
    case_id: number;
    type: string;
    image_url: string;
    image_url_wm: string;
  }[];

  const imageMap = new Map<number, typeof allImages>();
  for (const img of allImages) {
    if (!imageMap.has(img.case_id)) imageMap.set(img.case_id, []);
    imageMap.get(img.case_id)!.push(img);
  }

  return cases.map((c) => {
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
      before_images: befores.slice(0, 4),
      after_images: afters.slice(0, 4),
    };
  });
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
