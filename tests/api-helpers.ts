import { mkdtempSync } from "fs";
import os from "os";
import path from "path";
import { NextRequest } from "next/server";
import { AUTH_COOKIE } from "../lib/auth";

export function setupTempDataDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "upstay-test-"));
  process.env.DATA_DIR = dir;
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
