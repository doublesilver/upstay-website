import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const { case_id, type, match_order, image_url } = await req.json();
  if (!case_id || !type || match_order === undefined || match_order === null)
    return Response.json(
      { error: "case_id, type, match_order required" },
      { status: 400 },
    );
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO case_images (case_id, type, match_order, image_url) VALUES (?, ?, ?, ?)",
    )
    .run(case_id, type, match_order, image_url || "");
  return Response.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const allowed = ["image_url", "image_url_wm", "match_order"];
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const key of allowed) {
    if (key in fields) {
      sets.push(`${key}=?`);
      vals.push(fields[key]);
    }
  }
  if (sets.length === 0) return Response.json({ ok: true });

  const db = getDb();
  vals.push(id);
  db.prepare(`UPDATE case_images SET ${sets.join(", ")} WHERE id=?`).run(
    ...vals,
  );
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const { id, case_id } = await req.json();
  if (!id || !case_id)
    return Response.json({ error: "id, case_id required" }, { status: 400 });
  const db = getDb();
  const row = db
    .prepare("SELECT case_id FROM case_images WHERE id = ?")
    .get(id) as { case_id: number } | undefined;
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  if (row.case_id !== case_id)
    return Response.json({ error: "case_id mismatch" }, { status: 403 });
  db.prepare("DELETE FROM case_images WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
