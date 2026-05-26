import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";
import { invalidatePublicCache } from "@/lib/cache";

const imagesReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        match_order: z.number().int(),
      }),
    )
    .min(1)
    .max(500),
  case_id: z.number().int().positive(),
  type: z.enum(["before", "after"]),
});

export async function POST(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = imagesReorderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { items, case_id, type } = parsed.data;

  const db = getDb();
  const ids = items.map((r: { id: number }) => r.id);
  const placeholders = ids.map(() => "?").join(",");
  const valid = db
    .prepare(
      `SELECT COUNT(*) as n FROM case_images WHERE id IN (${placeholders}) AND case_id=? AND type=?`,
    )
    .get(...ids, case_id, type) as { n: number };
  if (valid.n !== ids.length) {
    return Response.json(
      { error: "invalid items for case/type" },
      { status: 400 },
    );
  }

  const stmt = db.prepare("UPDATE case_images SET match_order=? WHERE id=?");
  const tx = db.transaction((rows: { id: number; match_order: number }[]) => {
    for (const r of rows) stmt.run(-r.id, r.id);
    for (const r of rows) stmt.run(r.match_order, r.id);
  });
  try {
    tx(items);
  } catch (e) {
    console.error("[images/reorder]", e);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
  invalidatePublicCache();
  return Response.json({ ok: true });
}
