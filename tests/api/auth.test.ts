import { beforeAll, describe, expect, test } from "vitest";
import jwt from "jsonwebtoken";
import { setupTempDataDir, makeRequest } from "../api-helpers";

beforeAll(() => {
  setupTempDataDir();
});

describe("verifyToken", () => {
  test("rejects request without Authorization header", async () => {
    const { verifyToken } = await import("../../lib/auth");
    const req = makeRequest("http://localhost/x");
    expect(verifyToken(req as never)).toBe(false);
  });

  test("rejects non-Bearer prefix (Token scheme)", async () => {
    const { verifyToken } = await import("../../lib/auth");
    const req = makeRequest("http://localhost/x", {
      headers: { authorization: "Token abc123" },
    });
    expect(verifyToken(req as never)).toBe(false);
  });

  test("rejects expired token", async () => {
    const { verifyToken } = await import("../../lib/auth");
    const expired = jwt.sign({ role: "admin" }, process.env.JWT_SECRET!, {
      expiresIn: -60,
    });
    const req = makeRequest("http://localhost/x", {
      headers: { authorization: `Bearer ${expired}` },
    });
    expect(verifyToken(req as never)).toBe(false);
  });

  test("rejects tampered signature", async () => {
    const { verifyToken } = await import("../../lib/auth");
    const valid = jwt.sign({ role: "admin" }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    const tampered = valid.slice(0, -4) + "XXXX";
    const req = makeRequest("http://localhost/x", {
      headers: { authorization: `Bearer ${tampered}` },
    });
    expect(verifyToken(req as never)).toBe(false);
  });

  test("accepts fresh valid token", async () => {
    const { verifyToken } = await import("../../lib/auth");
    const valid = jwt.sign({ role: "admin" }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    const req = makeRequest("http://localhost/x", {
      headers: { authorization: `Bearer ${valid}` },
    });
    expect(verifyToken(req as never)).toBe(true);
  });
});
