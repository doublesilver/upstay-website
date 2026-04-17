import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";
import { invalidatePublicCache } from "@/lib/cache";

export async function GET(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM announcements ORDER BY created_at DESC")
    .all();
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const { title, content, is_visible, dismiss_duration } = await req.json();
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO announcements (title, content, is_visible, dismiss_duration) VALUES (?, ?, ?, ?)",
    )
    .run(
      title || "",
      content || "",
      is_visible ?? 1,
      dismiss_duration || "none",
    );
  invalidatePublicCache();
  return Response.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const { id, title, content, is_visible, dismiss_duration } = await req.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const db = getDb();
  db.prepare(
    "UPDATE announcements SET title=?, content=?, is_visible=?, dismiss_duration=? WHERE id=?",
  ).run(
    title ?? "",
    content ?? "",
    is_visible ?? 1,
    dismiss_duration || "none",
    id,
  );
  invalidatePublicCache();
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const { id } = await req.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const db = getDb();
  db.prepare("DELETE FROM announcements WHERE id=?").run(id);
  invalidatePublicCache();
  return Response.json({ ok: true });
}
