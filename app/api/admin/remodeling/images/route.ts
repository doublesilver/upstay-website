import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";
import { invalidatePublicCache } from "@/lib/cache";
import { UPLOAD_DIR, UPLOAD_DIR_RESOLVED } from "@/lib/paths";
import { imagePostSchema, imageSlotSchema } from "@/lib/admin-schemas";

export async function POST(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();

  const body = await req.json();
  const parsed = imagePostSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { case_id, type, image_url, is_starred } = parsed.data;

  const db = getDb();

  let insertResult: {
    result: { changes: number; lastInsertRowid: number | bigint };
    nextOrder: number;
  };
  try {
    insertResult = db.transaction(() => {
      if (is_starred) {
        const cnt = db
          .prepare(
            "SELECT COUNT(*) as n FROM case_images WHERE case_id=? AND type=? AND is_starred=1",
          )
          .get(case_id, type) as { n: number };
        if (cnt.n >= 4) throw new Error("STAR_LIMIT");
      }
      const nextOrder = (
        db
          .prepare(
            "SELECT COALESCE(MAX(match_order),0)+1 AS n FROM case_images WHERE case_id=? AND type=?",
          )
          .get(case_id, type) as { n: number }
      ).n;
      const r = db
        .prepare(
          "INSERT INTO case_images (case_id, type, match_order, image_url, is_starred) VALUES (?, ?, ?, ?, ?)",
        )
        .run(case_id, type, nextOrder, image_url || "", is_starred ? 1 : 0);
      return { result: r, nextOrder };
    })();
  } catch (e) {
    const msg = (e as Error).message || "";
    if (msg === "STAR_LIMIT")
      return Response.json(
        { error: "별표는 BEFORE/AFTER 각 4개까지 선택 가능합니다" },
        { status: 409 },
      );
    if (
      msg.includes("UNIQUE constraint failed") &&
      msg.includes("slot_position")
    )
      return Response.json(
        {
          error:
            "해당 슬롯은 이미 다른 사진이 차지하고 있습니다. 새로고침 후 다시 시도해주세요.",
        },
        { status: 409 },
      );
    console.error("images error:", e);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }

  if (!insertResult.result.changes) {
    return Response.json(
      { error: "이미지 저장에 실패했습니다" },
      { status: 500 },
    );
  }

  try {
    invalidatePublicCache();
  } catch {
    // 캐시 무효화 실패는 INSERT 성공에 영향 없음
  }
  return Response.json({
    id: insertResult.result.lastInsertRowid,
    match_order: insertResult.nextOrder,
  });
}

export async function PUT(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();

  const body = await req.json();
  const parsedPut = imageSlotSchema.safeParse(body);
  if (!parsedPut.success) {
    return Response.json(
      { error: parsedPut.error.issues[0].message },
      { status: 400 },
    );
  }
  const { id, ...fields } = parsedPut.data as { id: number } & Record<
    string,
    unknown
  >;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const db = getDb();

  if ("slot_position" in fields) {
    const slotPos = Number(fields.slot_position);
    if (!Number.isInteger(slotPos) || slotPos < 0 || slotPos > 4) {
      return Response.json(
        { error: "slot_position must be 0-4" },
        { status: 400 },
      );
    }

    try {
      const tx = db.transaction(() => {
        const row = db
          .prepare("SELECT case_id, type FROM case_images WHERE id=?")
          .get(id) as { case_id: number; type: string } | undefined;
        if (!row) throw new Error("NOT_FOUND");

        if (slotPos > 0) {
          db.prepare(
            "UPDATE case_images SET slot_position=0, is_starred=0 WHERE case_id=? AND type=? AND slot_position=? AND id<>?",
          ).run(row.case_id, row.type, slotPos, id);
        }

        const newIsStarred = slotPos > 0 ? 1 : 0;
        db.prepare(
          "UPDATE case_images SET slot_position=?, is_starred=? WHERE id=?",
        ).run(slotPos, newIsStarred, id);
      });
      tx();
    } catch (e) {
      const msg = (e as Error).message || "";
      if (msg === "NOT_FOUND") {
        return Response.json({ error: "not found" }, { status: 404 });
      }
      if (
        msg.includes("UNIQUE constraint failed") &&
        msg.includes("slot_position")
      ) {
        return Response.json(
          {
            error:
              "해당 슬롯은 이미 다른 사진이 차지하고 있습니다. 새로고침 후 다시 시도해주세요.",
          },
          { status: 409 },
        );
      }
      console.error("images error:", e);
      return Response.json({ error: "서버 오류" }, { status: 500 });
    }

    invalidatePublicCache();
    return Response.json({ ok: true });
  }

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
    const msg = (e as Error).message || "";
    if (msg === "STAR_LIMIT") {
      return Response.json(
        { error: "별표는 BEFORE/AFTER 각 4개까지 선택 가능합니다" },
        { status: 409 },
      );
    }
    if (msg === "NOT_FOUND") {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    if (
      msg.includes("UNIQUE constraint failed") &&
      msg.includes("slot_position")
    ) {
      return Response.json(
        {
          error:
            "해당 슬롯은 이미 다른 사진이 차지하고 있습니다. 새로고침 후 다시 시도해주세요.",
        },
        { status: 409 },
      );
    }
    console.error("images error:", e);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }

  invalidatePublicCache();
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();

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
    const filename = path.basename(new URL(url, "http://x").pathname);
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
