import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";
import { invalidatePublicCache } from "@/lib/cache";
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

export async function GET(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const db = getDb();
  const cases = db
    .prepare("SELECT * FROM remodeling_cases ORDER BY sort_order ASC")
    .all();
  const getImages = db.prepare(
    "SELECT * FROM case_images WHERE case_id = ? ORDER BY match_order ASC, type ASC",
  );
  const result = (cases as Record<string, unknown>[]).map((c) => ({
    ...c,
    images: getImages.all(c.id),
  }));
  return Response.json(result);
}

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const { title, sort_order, show_on_main } = await req.json();
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO remodeling_cases (title, sort_order, show_on_main) VALUES (?, ?, ?)",
    )
    .run(title || "", sort_order ?? 0, show_on_main ?? 1);
  invalidatePublicCache();
  return Response.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const allowed = ["title", "sort_order", "show_on_main"];
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
  invalidatePublicCache();
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const { id } = await req.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const db = getDb();
  const images = db
    .prepare(
      "SELECT image_url, image_url_wm FROM case_images WHERE case_id = ?",
    )
    .all(id) as { image_url: string; image_url_wm: string }[];
  db.prepare("DELETE FROM remodeling_cases WHERE id=?").run(id);
  for (const img of images) {
    for (const url of [img.image_url, img.image_url_wm]) {
      if (url && url.startsWith("/api/uploads/")) {
        const filename = url.replace("/api/uploads/", "");
        const filepath = path.join(DATA_DIR, "uploads", filename);
        try {
          fs.unlinkSync(filepath);
        } catch {}
      }
    }
  }
  invalidatePublicCache();
  return Response.json({ ok: true });
}
