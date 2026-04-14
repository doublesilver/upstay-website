import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT id, title, content, dismiss_duration, created_at FROM announcements WHERE is_visible = 1 ORDER BY created_at DESC LIMIT 5",
    )
    .all();
  return Response.json(rows);
}
