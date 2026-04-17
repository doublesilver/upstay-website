import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";
import { invalidatePublicCache } from "@/lib/cache";

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const { items } = await req.json();
  if (!Array.isArray(items))
    return Response.json({ error: "items required" }, { status: 400 });

  const db = getDb();
  const stmt = db.prepare("UPDATE case_images SET match_order=? WHERE id=?");
  const tx = db.transaction((rows: { id: number; match_order: number }[]) => {
    for (const r of rows) stmt.run(-r.id, r.id);
    for (const r of rows) stmt.run(r.match_order, r.id);
  });
  tx(items);
  invalidatePublicCache();
  return Response.json({ ok: true });
}
