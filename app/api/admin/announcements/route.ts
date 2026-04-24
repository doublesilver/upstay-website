import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";
import { invalidatePublicCache } from "@/lib/cache";
import { announcementSchema } from "@/lib/admin-schemas";

export async function GET(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM announcements ORDER BY created_at DESC")
    .all();
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();
  const body = await req.json();
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { title, content, is_visible, dismiss_duration } = parsed.data;
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO announcements (title, content, is_visible, dismiss_duration) VALUES (?, ?, ?, ?)",
    )
    .run(title, content, is_visible, dismiss_duration);
  invalidatePublicCache();
  return Response.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();
  const body = await req.json();
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { id, title, content, is_visible, dismiss_duration } = parsed.data;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const db = getDb();
  db.prepare(
    "UPDATE announcements SET title=?, content=?, is_visible=?, dismiss_duration=? WHERE id=?",
  ).run(title, content, is_visible, dismiss_duration, id);
  invalidatePublicCache();
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();
  const { id } = await req.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const db = getDb();
  db.prepare("DELETE FROM announcements WHERE id=?").run(id);
  invalidatePublicCache();
  return Response.json({ ok: true });
}
