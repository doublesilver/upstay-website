import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const { items } = await req.json();
  if (!Array.isArray(items))
    return Response.json({ error: "items required" }, { status: 400 });

  const db = getDb();
  const stmt = db.prepare(
    "UPDATE remodeling_cases SET sort_order=? WHERE id=?",
  );
  const tx = db.transaction((rows: { id: number; sort_order: number }[]) => {
    for (const r of rows) stmt.run(r.sort_order, r.id);
  });
  tx(items);
  return Response.json({ ok: true });
}
