import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";
import { invalidatePublicCache } from "@/lib/cache";
import { UPLOAD_DIR, UPLOAD_DIR_RESOLVED } from "@/lib/paths";

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();

  const { case_id, type, image_url, is_starred } = await req.json();
  if (!case_id || !type) {
    return Response.json({ error: "case_id, type required" }, { status: 400 });
  }

  const db = getDb();

  if (is_starred) {
    const cnt = db
      .prepare(
        "SELECT COUNT(*) as n FROM case_images WHERE case_id=? AND type=? AND is_starred=1",
      )
      .get(case_id, type) as { n: number };
    if (cnt.n >= 4) {
      return Response.json(
        { error: "별표는 BEFORE/AFTER 각 4개까지 선택 가능합니다" },
        { status: 409 },
      );
    }
  }

  const nextOrder = (
    db
      .prepare(
        "SELECT COALESCE(MAX(match_order),0)+1 AS n FROM case_images WHERE case_id=? AND type=?",
      )
      .get(case_id, type) as { n: number }
  ).n;

  const result = db
    .prepare(
      "INSERT INTO case_images (case_id, type, match_order, image_url, is_starred) VALUES (?, ?, ?, ?, ?)",
    )
    .run(case_id, type, nextOrder, image_url || "", is_starred ? 1 : 0);

  invalidatePublicCache();
  return Response.json({ id: result.lastInsertRowid, match_order: nextOrder });
}

export async function PUT(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const allowed = ["image_url", "image_url_wm", "match_order", "is_starred"];
  const sets: string[] = [];
  const vals: unknown[] = [];

  for (const key of allowed) {
    if (key in fields) {
      sets.push(`${key}=?`);
      vals.push(key === "is_starred" ? (fields[key] ? 1 : 0) : fields[key]);
    }
  }

  if (sets.length === 0) return Response.json({ ok: true });

  const db = getDb();
  vals.push(id);
  const sql = `UPDATE case_images SET ${sets.join(", ")} WHERE id=?`;

  try {
    const tx = db.transaction(() => {
      if ("is_starred" in fields && fields.is_starred) {
        const row = db
          .prepare(
            "SELECT case_id, type, is_starred FROM case_images WHERE id=?",
          )
          .get(id) as
          | { case_id: number; type: string; is_starred: number }
          | undefined;
        if (!row) throw new Error("NOT_FOUND");
        if (!row.is_starred) {
          const cnt = db
            .prepare(
              "SELECT COUNT(*) as n FROM case_images WHERE case_id=? AND type=? AND is_starred=1",
            )
            .get(row.case_id, row.type) as { n: number };
          if (cnt.n >= 4) throw new Error("STAR_LIMIT");
        }
      }
      db.prepare(sql).run(...vals);
    });
    tx();
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "STAR_LIMIT") {
      return Response.json(
        { error: "별표는 BEFORE/AFTER 각 4개까지 선택 가능합니다" },
        { status: 409 },
      );
    }
    if (msg === "NOT_FOUND") {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    throw e;
  }

  invalidatePublicCache();
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();

  const { id, case_id } = await req.json();
  if (!id || !case_id) {
    return Response.json({ error: "id, case_id required" }, { status: 400 });
  }

  const db = getDb();
  const row = db
    .prepare(
      "SELECT case_id, image_url, image_url_wm FROM case_images WHERE id = ?",
    )
    .get(id) as
    | { case_id: number; image_url: string; image_url_wm: string }
    | undefined;

  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  if (row.case_id !== case_id) {
    return Response.json({ error: "case_id mismatch" }, { status: 403 });
  }

  db.prepare("DELETE FROM case_images WHERE id = ?").run(id);

  for (const url of [row.image_url, row.image_url_wm]) {
    if (!url || !url.startsWith("/api/uploads/")) continue;
    const filename = url.replace("/api/uploads/", "");
    const resolved = path.resolve(UPLOAD_DIR, filename);
    if (
      !resolved.startsWith(UPLOAD_DIR_RESOLVED + path.sep) &&
      resolved !== UPLOAD_DIR_RESOLVED
    ) {
      console.warn("[images DELETE] traversal 차단:", url);
      continue;
    }
    try {
      fs.unlinkSync(resolved);
    } catch (e) {
      console.warn(
        "[images DELETE] unlink 실패:",
        resolved,
        (e as Error).message,
      );
    }
  }

  invalidatePublicCache();
  return Response.json({ ok: true });
}
