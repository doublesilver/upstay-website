import { mkdtempSync } from "fs";
import os from "os";
import path from "path";
import { NextRequest } from "next/server";

export function setupTempDataDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "upstay-test-"));
  process.env.DATA_DIR = dir;
  process.env.ADMIN_ID = "admin";
  process.env.ADMIN_PW = "test";
  process.env.JWT_SECRET = "test-secret-minimum-length-32-chars-for-validation";
  return dir;
}

export function makeRequest(
  url: string,
  init?: RequestInit & { token?: string },
): NextRequest {
  const headers = new Headers(init?.headers as HeadersInit | undefined);
  if (init?.token) headers.set("authorization", `Bearer ${init.token}`);
  const method = init?.method;
  const body = init?.body;
  return new NextRequest(url, {
    method,
    headers,
    ...(body !== undefined && body !== null ? { body } : {}),
  });
}
