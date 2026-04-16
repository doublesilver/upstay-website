import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("all") === "true";

  const query = showAll
    ? "SELECT id, title FROM remodeling_cases ORDER BY sort_order ASC"
    : "SELECT id, title FROM remodeling_cases WHERE show_on_main >= 1 ORDER BY show_on_main ASC";

  const cases = db.prepare(query).all() as { id: number; title: string }[];

  const caseIds = cases.map((c) => c.id);
  if (caseIds.length === 0) return Response.json([]);

  const allImages = db
    .prepare(
      `SELECT case_id, type, match_order, image_url, image_url_wm FROM case_images WHERE case_id IN (${caseIds.map(() => "?").join(",")}) ORDER BY match_order ASC, type ASC`,
    )
    .all(...caseIds) as {
    case_id: number;
    type: string;
    match_order: number;
    image_url: string;
    image_url_wm: string;
  }[];

  const imageMap = new Map<number, typeof allImages>();
  for (const img of allImages) {
    if (!imageMap.has(img.case_id)) imageMap.set(img.case_id, []);
    imageMap.get(img.case_id)!.push(img);
  }

  const result = cases.map((c) => {
    const images = imageMap.get(c.id) || [];

    const befores = images
      .filter((i) => i.type === "before")
      .map((i) => i.image_url_wm || i.image_url);
    const afters = images
      .filter((i) => i.type === "after")
      .map((i) => i.image_url_wm || i.image_url);

    return {
      id: c.id,
      title: c.title,
      before_image: befores[0] || "",
      after_image: afters[0] || "",
      before_images: befores.slice(0, 4),
      after_images: afters.slice(0, 4),
    };
  });

  return Response.json(result);
}
