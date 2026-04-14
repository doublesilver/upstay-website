import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();

  const cases = db
    .prepare(
      "SELECT id, title FROM remodeling_cases WHERE show_on_main = 1 ORDER BY sort_order ASC",
    )
    .all() as { id: number; title: string }[];

  const result = cases.map((c) => {
    const beforeRow = db
      .prepare(
        "SELECT image_url, image_url_wm FROM case_images WHERE case_id = ? AND type = 'before' AND match_order = 1",
      )
      .get(c.id) as { image_url: string; image_url_wm: string } | undefined;

    const afterRow = db
      .prepare(
        "SELECT image_url, image_url_wm FROM case_images WHERE case_id = ? AND type = 'after' AND match_order = 1",
      )
      .get(c.id) as { image_url: string; image_url_wm: string } | undefined;

    const imageCount = (
      db
        .prepare(
          "SELECT COUNT(*) as cnt FROM case_images WHERE case_id = ? AND type = 'after'",
        )
        .get(c.id) as { cnt: number }
    ).cnt;

    return {
      id: c.id,
      title: c.title,
      before_image: beforeRow
        ? beforeRow.image_url_wm || beforeRow.image_url
        : "",
      after_image: afterRow ? afterRow.image_url_wm || afterRow.image_url : "",
      image_count: imageCount,
    };
  });

  return Response.json(result);
}
