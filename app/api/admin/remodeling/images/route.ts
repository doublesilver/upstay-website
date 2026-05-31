import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";
import { invalidatePublicCache } from "@/lib/cache";
import { UPLOAD_DIR, UPLOAD_DIR_RESOLVED } from "@/lib/paths";
import {
  imageDeleteSchema,
  imagePostSchema,
  imageSlotSchema,
} from "@/lib/admin-schemas";
import { logError, logWarn } from "@/lib/log";
import { ErrorMessages } from "@/lib/error-messages";

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
    logError("admin", "images POST 실패", e, { case_id, type });
    return Response.json(
      { error: ErrorMessages.saveFailed() },
      { status: 500 },
    );
  }

  if (!insertResult.result.changes) {
    logError("admin", "images POST 변경 없음", null, { case_id, type });
    return Response.json(
      { error: ErrorMessages.saveFailed("이미지 저장") },
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
      logError("admin", "images PUT slot 실패", e, { id });
      return Response.json(
        { error: ErrorMessages.saveFailed() },
        { status: 500 },
      );
    }

    invalidatePublicCache();
    return Response.json({ ok: true });
  }

  const allowed = [
    "image_url",
    "image_url_wm",
    "match_order",
    "is_starred",
    "edit_settings",
  ];
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
    logError("admin", "images PUT 실패", e, { id });
    return Response.json(
      { error: ErrorMessages.saveFailed() },
      { status: 500 },
    );
  }

  invalidatePublicCache();
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = imageDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { case_id } = parsed.data;
  // 단일 id도 ids 배열로 정규화해 이후 로직을 일원화.
  const ids = parsed.data.ids ?? [parsed.data.id as number];

  const db = getDb();

  // SQLite는 SQL placeholder 길이 제한이 있어(SQLITE_MAX_VARIABLE_NUMBER)
  // 여기서는 zod에서 이미 max(500)으로 막아둠. 일반 운영 케이스(수십~수백장)는 안전.
  const placeholders = ids.map(() => "?").join(",");

  // case_id 소유권 검증과 DELETE를 한 트랜잭션으로 묶어
  // 부분 삭제 / race 시 다른 케이스 이미지 삭제 사고 방지.
  let removedRows: { id: number; image_url: string; image_url_wm: string }[];
  let changes: number;
  try {
    const tx = db.transaction(() => {
      const rows = db
        .prepare(
          `SELECT id, case_id, image_url, image_url_wm
             FROM case_images
            WHERE id IN (${placeholders})`,
        )
        .all(...ids) as {
        id: number;
        case_id: number;
        image_url: string;
        image_url_wm: string;
      }[];

      // 요청된 id 중 하나라도 다른 case에 속하면 전체 거부 — 의도치 않은 cross-case 삭제 차단.
      if (rows.some((r) => r.case_id !== case_id)) {
        throw new Error("CASE_MISMATCH");
      }

      const r = db
        .prepare(
          `DELETE FROM case_images
            WHERE case_id = ?
              AND id IN (${placeholders})`,
        )
        .run(case_id, ...ids);

      return {
        rows: rows.map((r) => ({
          id: r.id,
          image_url: r.image_url,
          image_url_wm: r.image_url_wm,
        })),
        changes: r.changes,
      };
    });
    const out = tx();
    removedRows = out.rows;
    changes = out.changes;
  } catch (e) {
    const msg = (e as Error).message || "";
    if (msg === "CASE_MISMATCH") {
      return Response.json({ error: "case_id mismatch" }, { status: 403 });
    }
    logError("admin", "images DELETE 실패", e, { case_id, ids });
    return Response.json(
      { error: ErrorMessages.deleteFailed() },
      { status: 500 },
    );
  }

  // 파일 unlink는 트랜잭션 밖에서 best-effort.
  // path-traversal 가드는 기존과 동일하게 이미지별로 유지 (안전 우선).
  for (const row of removedRows) {
    for (const url of [row.image_url, row.image_url_wm]) {
      if (!url || !url.startsWith("/api/uploads/")) continue;
      const filename = path.basename(new URL(url, "http://x").pathname);
      const resolved = path.resolve(UPLOAD_DIR, filename);
      if (
        !resolved.startsWith(UPLOAD_DIR_RESOLVED + path.sep) &&
        resolved !== UPLOAD_DIR_RESOLVED
      ) {
        logWarn("admin", "images DELETE traversal 차단", { url });
        continue;
      }
      try {
        fs.unlinkSync(resolved);
      } catch (e) {
        logWarn("admin", "images DELETE unlink 실패", {
          resolved,
          err: (e as Error).message,
        });
      }
      // precompute한 모든 사본 동반 삭제. 기존 업로드는 사본이
      // 없을 수 있어 ENOENT는 정상.
      const VARIANT_SUFFIXES = [
        ".webp",
        ".avif",
        ".thumb.webp",
        ".thumb.webp.avif",
        ".medium.webp",
        ".medium.webp.avif",
      ];
      for (const suffix of VARIANT_SUFFIXES) {
        try {
          fs.unlinkSync(resolved + suffix);
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
            logWarn("admin", "images DELETE 사본 unlink 실패", {
              path: resolved + suffix,
              err: (e as Error).message,
            });
          }
        }
      }
    }
  }

  invalidatePublicCache();
  return Response.json({ ok: true, deleted: changes });
}
