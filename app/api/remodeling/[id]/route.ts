import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();

  const caseRow = db
    .prepare("SELECT id, title FROM remodeling_cases WHERE id = ?")
    .get(Number(id)) as { id: number; title: string } | undefined;

  if (!caseRow) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const images = db
    .prepare(
      "SELECT type, match_order, image_url, image_url_wm FROM case_images WHERE case_id = ? ORDER BY match_order ASC, type ASC",
    )
    .all(caseRow.id) as {
    type: "before" | "after";
    match_order: number;
    image_url: string;
    image_url_wm: string;
  }[];

  const pairsMap = new Map<
    number,
    { before_image: string; after_image: string }
  >();
  for (const img of images) {
    if (!pairsMap.has(img.match_order)) {
      pairsMap.set(img.match_order, { before_image: "", after_image: "" });
    }
    const pair = pairsMap.get(img.match_order)!;
    const url = img.image_url_wm || img.image_url;
    if (img.type === "before") {
      pair.before_image = url;
    } else {
      pair.after_image = url;
    }
  }

  const pairs = Array.from(pairsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([match_order, pair]) => ({ match_order, ...pair }));

  return Response.json({ id: caseRow.id, title: caseRow.title, pairs });
}
