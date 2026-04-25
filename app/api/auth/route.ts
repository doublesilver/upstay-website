import { NextRequest, NextResponse } from "next/server";
import {
  verifyCredentials,
  createToken,
  setAuthCookie,
  clearAuthCookie,
} from "@/lib/auth";
import { getDb } from "@/lib/db";

const RATE_WINDOW = 15 * 60;
const RATE_MAX = 5;

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const now = Math.floor(Date.now() / 1000);
  const db = getDb();

  const rec = db
    .prepare("SELECT count, window_start FROM auth_rate_limit WHERE ip = ?")
    .get(ip) as { count: number; window_start: number } | undefined;

  if (rec && now - rec.window_start < RATE_WINDOW && rec.count >= RATE_MAX) {
    const retryAfter = RATE_WINDOW - (now - rec.window_start);
    return NextResponse.json(
      { error: "너무 많은 시도. 잠시 후 다시 시도하세요." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const { id, password } = await req.json();
  if (!verifyCredentials(id, password)) {
    if (!rec || now - rec.window_start >= RATE_WINDOW) {
      db.prepare(
        "INSERT OR REPLACE INTO auth_rate_limit (ip, count, window_start) VALUES (?, 1, ?)",
      ).run(ip, now);
    } else {
      db.prepare(
        "UPDATE auth_rate_limit SET count = count + 1 WHERE ip = ?",
      ).run(ip);
    }
    return NextResponse.json(
      { error: "아이디 또는 비밀번호를 다시 확인해주세요" },
      { status: 401 },
    );
  }

  db.prepare("DELETE FROM auth_rate_limit WHERE ip = ?").run(ip);

  const token = await createToken();
  const res = NextResponse.json({ ok: true });
  setAuthCookie(res, token);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearAuthCookie(res);
  return res;
}
