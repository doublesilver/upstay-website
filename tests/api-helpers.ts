import { mkdtempSync } from "fs";
import os from "os";
import path from "path";

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
): Request {
  const headers = new Headers(init?.headers as HeadersInit | undefined);
  if (init?.token) headers.set("authorization", `Bearer ${init.token}`);
  const { token: _token, ...rest } = init ?? {};
  return new Request(url, { ...rest, headers });
}
