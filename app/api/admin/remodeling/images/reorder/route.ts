import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";
import { invalidatePublicCache } from "@/lib/cache";

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const { items, case_id, type } = await req.json();
  if (!case_id || !type || !Array.isArray(items)) {
    return Response.json(
      { error: "items, case_id, type required" },
      { status: 400 },
    );
  }

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
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
  invalidatePublicCache();
  return Response.json({ ok: true });
}
