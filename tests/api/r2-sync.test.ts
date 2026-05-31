import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";

// R2 자격증명 없으면 sync가 throw 없이 무동작 + warn 한 번만.
// 자격증명 있으면 S3Client.send가 PutObjectCommand로 호출.

describe("lib/r2-sync — 자격증명 누락 시 무동작", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET;
    delete process.env.R2_ENDPOINT;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("syncToR2: 자격증명 없으면 throw 없이 끝남", async () => {
    const mod = await import("../../lib/r2-sync");
    await expect(
      mod.syncToR2("/tmp/__nonexistent__.jpg", "key.jpg"),
    ).resolves.toBeUndefined();
  });

  test("syncVariantsToR2: 자격증명 없으면 throw 없이 끝남", async () => {
    const mod = await import("../../lib/r2-sync");
    await expect(
      mod.syncVariantsToR2("/tmp/__nonexistent__.jpg"),
    ).resolves.toBeUndefined();
  });
});
