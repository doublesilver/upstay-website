import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";
import { invalidatePublicCache } from "@/lib/cache";
import { logError } from "@/lib/log";
import { ErrorMessages } from "@/lib/error-messages";

// 정수·범위 검증 + 배열 길이 상한. authenticated DoS(수만 row 쓰기) 차단.
const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        sort_order: z.number().int(),
      }),
    )
    .min(1)
    .max(500),
});

export async function POST(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { items } = parsed.data;

  const db = getDb();
  const stmt = db.prepare(
    "UPDATE remodeling_cases SET sort_order=? WHERE id=?",
  );
  const tx = db.transaction((rows: { id: number; sort_order: number }[]) => {
    for (const r of rows) stmt.run(r.sort_order, r.id);
  });
  try {
    tx(items);
  } catch (e) {
    logError("admin", "remodeling reorder 실패", e);
    return Response.json(
      { error: ErrorMessages.saveFailed() },
      { status: 500 },
    );
  }
  invalidatePublicCache();
  return Response.json({ ok: true });
}
