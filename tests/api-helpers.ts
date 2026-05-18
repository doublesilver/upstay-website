import { mkdtempSync } from "fs";
import os from "os";
import path from "path";
import { NextRequest } from "next/server";
import { AUTH_COOKIE } from "../lib/auth";

// 테스트가 lib/auth, lib/db를 import할 때 필요한 env. setupTempDataDir 호출 시 자동 주입.
// 글로벌 vitest.setup.ts가 미리 주입하지만, 외부에서 setupTempDataDir만 부르는 경우 한 번 더 보강.
// JWT_SECRET은 외부 export 대신 process.env로만 노출(보안). 32자 이상 강제 길이 충족.
export const TEST_JWT_SECRET =
  "test-secret-minimum-length-32-chars-for-validation";

export function setupTempDataDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "upstay-test-"));
  process.env.DATA_DIR = dir;
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
  }
  if (!process.env.ADMIN_ID) process.env.ADMIN_ID = "admin";
  if (!process.env.ADMIN_PW) process.env.ADMIN_PW = "test";
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
