import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT id, before_image, after_image, before_image_wm, after_image_wm, title FROM remodeling_cases WHERE show_on_main = 1 ORDER BY sort_order ASC",
    )
    .all() as {
    id: number;
    before_image: string;
    after_image: string;
    before_image_wm: string;
    after_image_wm: string;
    title: string;
  }[];

  const result = rows.map((r) => ({
    id: r.id,
    before_image: r.before_image_wm || r.before_image,
    after_image: r.after_image_wm || r.after_image,
    title: r.title,
  }));
  return Response.json(result);
}
