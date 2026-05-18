import { mkdtempSync } from "fs";
import os from "os";
import path from "path";
import { NextRequest } from "next/server";
import { AUTH_COOKIE } from "../lib/auth";

// 테스트마다 격리된 임시 DATA_DIR을 만든다.
// JWT_SECRET/ADMIN_ID/ADMIN_PW는 글로벌 vitest.setup.ts가 이미 주입했지만,
// 외부에서 setupTempDataDir만 부르고 setup을 건너뛰는 케이스를 위해 한 번 더 보강.
export function setupTempDataDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "upstay-test-"));
  process.env.DATA_DIR = dir;
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    process.env.JWT_SECRET =
      "test-secret-minimum-length-32-chars-for-validation";
  }
  if (!process.env.ADMIN_ID) process.env.ADMIN_ID = "admin";
  if (!process.env.ADMIN_PW) process.env.ADMIN_PW = "test-password";
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
