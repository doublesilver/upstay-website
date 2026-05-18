import { mkdtempSync } from "fs";
import os from "os";
import path from "path";
import { NextRequest } from "next/server";
import { AUTH_COOKIE } from "../lib/auth";

// lib/auth는 보안 강화를 위해 JWT_SECRET을 export하지 않고 process.env에서만 lazy 로드함.
// 테스트는 같은 값을 쓰기 위해 이 상수를 공유하고 setupTempDataDir에서 env에 주입한다.
export const TEST_JWT_SECRET =
  "test-secret-minimum-length-32-chars-for-validation";

export function setupTempDataDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "upstay-test-"));
  process.env.DATA_DIR = dir;
  // 테스트가 lib/auth 호출 전에 환경변수가 세팅되도록 함께 주입.
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? TEST_JWT_SECRET;
  process.env.ADMIN_ID = process.env.ADMIN_ID ?? "admin";
  process.env.ADMIN_PW = process.env.ADMIN_PW ?? "testpw";
  return dir;
}

export function makeRequest(
  url: string,
  init?: RequestInit & { token?: string },
): NextRequest {
  const headers = new Headers(init?.headers as HeadersInit | undefined);
  if (init?.token) {
    const existing = headers.get("cookie");
    const cookie = `${AUTH_COOKIE}=${init.token}`;
    headers.set("cookie", existing ? `${existing}; ${cookie}` : cookie);
  }
  const method = init?.method;
  const body = init?.body;
  return new NextRequest(url, {
    method,
    headers,
    ...(body !== undefined && body !== null ? { body } : {}),
  });
}
