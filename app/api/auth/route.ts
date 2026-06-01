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
  // Cloudflare proxy 환경 우선 — Cloudflare가 검증한 실제 클라이언트 IP.
  // 이 값은 Cloudflare edge가 setting하며 클라이언트가 임의로 prepend 불가.
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // x-forwarded-for는 클라이언트가 임의로 prepend 할 수 있는 헤더다. 프록시(Cloudflare/Caddy)는
  // 자기가 본 IP를 끝에 append 하므로 "마지막" 값이 신뢰 가능한 실제 클라이언트 IP.
  // 첫 번째를 쓰면 공격자가 매 요청마다 다른 IP를 헤더에 박아 rate-limit 우회 가능.
  // 단 Cloudflare 환경에선 마지막 = Cloudflare edge IP라 모든 요청이 같은 IP로 보임 →
  // rate-limit 무용. cf-connecting-ip가 우선이지만, fallback 패턴은 유지.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
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
