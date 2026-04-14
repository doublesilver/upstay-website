import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT id, before_image, after_image, title FROM remodeling_cases WHERE show_on_main = 1 ORDER BY sort_order ASC",
    )
    .all();
  return Response.json(rows);
}
