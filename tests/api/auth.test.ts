import { beforeAll, describe, expect, test } from "vitest";
import { SignJWT } from "jose";
import { setupTempDataDir, makeRequest } from "../api-helpers";
import { JWT_SECRET } from "../../lib/auth";

beforeAll(() => {
  setupTempDataDir();
});

function getSecret() {
  return new TextEncoder().encode(JWT_SECRET);
}

describe("verifyToken", () => {
  test("rejects request without auth cookie", async () => {
    const { verifyToken } = await import("../../lib/auth");
    const req = makeRequest("http://localhost/x");
    expect(await verifyToken(req as never)).toBe(false);
  });

  test("rejects Bearer header (cookie-only auth)", async () => {
    const { verifyToken } = await import("../../lib/auth");
    const valid = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(getSecret());
    const req = makeRequest("http://localhost/x", {
      headers: { authorization: `Bearer ${valid}` },
    });
    expect(await verifyToken(req as never)).toBe(false);
  });

  test("rejects expired token", async () => {
    const { verifyToken } = await import("../../lib/auth");
    const expired = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(new Date(Date.now() - 60000))
      .sign(getSecret());
    const req = makeRequest("http://localhost/x", { token: expired });
    expect(await verifyToken(req as never)).toBe(false);
  });

  test("rejects tampered signature", async () => {
    const { verifyToken } = await import("../../lib/auth");
    const valid = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(getSecret());
    const tampered = valid.slice(0, -4) + "XXXX";
    const req = makeRequest("http://localhost/x", { token: tampered });
    expect(await verifyToken(req as never)).toBe(false);
  });

  test("accepts fresh valid token via cookie", async () => {
    const { verifyToken } = await import("../../lib/auth");
    const valid = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(getSecret());
    const req = makeRequest("http://localhost/x", { token: valid });
    expect(await verifyToken(req as never)).toBe(true);
  });
});
