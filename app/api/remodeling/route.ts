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
    const images = db
      .prepare(
        "SELECT type, match_order, image_url, image_url_wm FROM case_images WHERE case_id = ? ORDER BY match_order ASC, type ASC",
      )
      .all(c.id) as {
      type: string;
      match_order: number;
      image_url: string;
      image_url_wm: string;
    }[];

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
