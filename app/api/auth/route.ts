import { NextRequest, NextResponse } from "next/server";
import {
  verifyCredentials,
  createToken,
  setAuthCookie,
  clearAuthCookie,
} from "@/lib/auth";
import { getDb } from "@/lib/db";

const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientIp(req: NextRequest): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return ips[ips.length - 1] || "unknown";
  }
  return "unknown";
}

function checkRateLimit(ip: string): { ok: boolean; retryAfterSec?: number } {
  const db = getDb();
  const now = Date.now();
  const row = db
    .prepare("SELECT count, window_start FROM auth_rate_limit WHERE ip = ?")
    .get(ip) as { count: number; window_start: number } | undefined;

  if (!row || now - row.window_start > WINDOW_MS) {
    return { ok: true };
  }
  if (row.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil(
      (row.window_start + WINDOW_MS - now) / 1000,
    );
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}

function recordAttempt(ip: string, success: boolean) {
  const db = getDb();
  const now = Date.now();
  db.prepare("DELETE FROM auth_rate_limit WHERE window_start < ?").run(
    now - WINDOW_MS,
  );
  if (success) {
    db.prepare("DELETE FROM auth_rate_limit WHERE ip = ?").run(ip);
    return;
  }
  const row = db
    .prepare("SELECT count, window_start FROM auth_rate_limit WHERE ip = ?")
    .get(ip) as { count: number; window_start: number } | undefined;
  if (!row || now - row.window_start > WINDOW_MS) {
    db.prepare(
      "INSERT INTO auth_rate_limit (ip, count, window_start) VALUES (?, 1, ?) ON CONFLICT(ip) DO UPDATE SET count = 1, window_start = excluded.window_start",
    ).run(ip, now);
  } else {
    db.prepare("UPDATE auth_rate_limit SET count = count + 1 WHERE ip = ?").run(
      ip,
    );
  }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `로그인 시도가 너무 많습니다. ${limit.retryAfterSec}초 후 다시 시도해주세요.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { id?: unknown }).id !== "string" ||
    typeof (body as { password?: unknown }).password !== "string"
  ) {
    return NextResponse.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }
  const { id, password } = body as { id: string; password: string };

  if (!verifyCredentials(id, password)) {
    recordAttempt(ip, false);
    return NextResponse.json(
      { error: "아이디 또는 비밀번호를 다시 확인해주세요" },
      { status: 401 },
    );
  }

  recordAttempt(ip, true);
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
