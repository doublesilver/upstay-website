import { beforeAll, describe, expect, test } from "vitest";
import { setupTempDataDir } from "../api-helpers";

beforeAll(() => {
  setupTempDataDir();
});

describe("/api/uploads/[...path] traversal guard", () => {
  test("returns 404 for parent directory traversal via path segments", async () => {
    const { GET } = await import("../../app/api/uploads/[...path]/route");
    const req = new Request("http://localhost/api/uploads/..%2f..%2fupstay.db");
    const res = await GET(req as never, {
      params: Promise.resolve({ path: ["..", "..", "upstay.db"] }),
    });
    expect(res.status).toBe(404);
  });

  test("returns 404 for single parent segment escaping uploads dir", async () => {
    const { GET } = await import("../../app/api/uploads/[...path]/route");
    const req = new Request("http://localhost/api/uploads/x");
    const res = await GET(req as never, {
      params: Promise.resolve({ path: ["..", "upstay.db"] }),
    });
    expect(res.status).toBe(404);
  });

  test("returns 404 for deeply nested traversal to db file", async () => {
    const { GET } = await import("../../app/api/uploads/[...path]/route");
    const req = new Request("http://localhost/api/uploads/a");
    const res = await GET(req as never, {
      params: Promise.resolve({ path: [".", ".", "..", "..", "upstay.db"] }),
    });
    expect(res.status).toBe(404);
  });
});
