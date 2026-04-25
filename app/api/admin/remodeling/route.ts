import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";
import { invalidatePublicCache } from "@/lib/cache";
import fs from "fs";
import path from "path";
import { UPLOAD_DIR_RESOLVED } from "@/lib/paths";
import { caseCreateSchema, caseUpdateSchema } from "@/lib/admin-schemas";

export async function GET(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();
  const db = getDb();
  const cases = db
    .prepare("SELECT * FROM remodeling_cases ORDER BY sort_order ASC")
    .all() as Record<string, unknown>[];
  if (cases.length === 0) return Response.json([]);
  const caseIds = cases.map((c) => c.id as number);
  const placeholders = caseIds.map(() => "?").join(",");
  const allImages = db
    .prepare(
      `SELECT * FROM case_images WHERE case_id IN (${placeholders}) ORDER BY match_order ASC, type ASC`,
    )
    .all(...caseIds) as Array<Record<string, unknown> & { case_id: number }>;
  const imageMap = new Map<number, typeof allImages>();
  for (const img of allImages) {
    if (!imageMap.has(img.case_id)) imageMap.set(img.case_id, []);
    imageMap.get(img.case_id)!.push(img);
  }
  const result = cases.map((c) => ({
    ...c,
    images: imageMap.get(c.id as number) || [],
  }));
  return Response.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();
  const body = await req.json();
  const parsed = caseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { title, sort_order, show_on_main } = parsed.data;
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO remodeling_cases (title, sort_order, show_on_main) VALUES (?, ?, ?)",
    )
    .run(title, sort_order, show_on_main);
  invalidatePublicCache();
  return Response.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();
  const body = await req.json();
  const parsed = caseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { id, ...fields } = parsed.data as { id: number } & Record<
    string,
    unknown
  >;
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
  if (!(await verifyToken(req))) return unauthorized();
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
      if (!url || !url.startsWith("/api/uploads/")) continue;
      const filename = url.replace("/api/uploads/", "");
      const resolved = path.resolve(UPLOAD_DIR_RESOLVED, filename);
      if (
        !resolved.startsWith(UPLOAD_DIR_RESOLVED + path.sep) &&
        resolved !== UPLOAD_DIR_RESOLVED
      ) {
        console.warn("[DELETE] path traversal 시도 차단:", url);
        continue;
      }
      try {
        fs.unlinkSync(resolved);
      } catch (e) {
        console.warn("[DELETE] unlink 실패:", resolved, (e as Error).message);
      }
    }
  }
  invalidatePublicCache();
  return Response.json({ ok: true });
}
