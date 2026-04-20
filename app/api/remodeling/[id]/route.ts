import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }

  const db = getDb();
  const caseRow = db
    .prepare("SELECT id, title FROM remodeling_cases WHERE id = ?")
    .get(numId) as { id: number; title: string } | undefined;

  if (!caseRow) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const images = db
    .prepare(
      `SELECT type, match_order, image_url, image_url_wm
       FROM case_images
       WHERE case_id = ?
         AND is_starred = 1
         AND image_url <> ''
       ORDER BY type ASC, match_order ASC, id ASC`,
    )
    .all(caseRow.id) as {
    type: "before" | "after";
    match_order: number;
    image_url: string;
    image_url_wm: string;
  }[];

  const before_images = images
    .filter((img) => img.type === "before")
    .map((img) => img.image_url_wm || img.image_url)
    .filter(Boolean);
  const after_images = images
    .filter((img) => img.type === "after")
    .map((img) => img.image_url_wm || img.image_url)
    .filter(Boolean);

  return Response.json({
    id: caseRow.id,
    title: caseRow.title,
    before_images,
    after_images,
  });
}
