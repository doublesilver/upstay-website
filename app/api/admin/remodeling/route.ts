import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM remodeling_cases ORDER BY sort_order ASC")
    .all();
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const { before_image, after_image, title, sort_order, show_on_main } =
    await req.json();
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO remodeling_cases (before_image, after_image, title, sort_order, show_on_main) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      before_image || "",
      after_image || "",
      title || "",
      sort_order ?? 0,
      show_on_main ?? 1,
    );
  return Response.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const allowed = [
    "before_image",
    "after_image",
    "before_image_wm",
    "after_image_wm",
    "title",
    "sort_order",
    "show_on_main",
  ];
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
  db.prepare(`UPDATE remodeling_cases SET ${sets.join(", ")} WHERE id=?`).run(
    ...vals,
  );
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const { id } = await req.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const db = getDb();
  db.prepare("DELETE FROM remodeling_cases WHERE id=?").run(id);
  return Response.json({ ok: true });
}
