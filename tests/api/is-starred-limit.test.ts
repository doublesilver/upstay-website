import { beforeAll, describe, expect, test, vi } from "vitest";
import { SignJWT } from "jose";
import { JWT_SECRET } from "../../lib/auth";
import { NextRequest } from "next/server";
import { setupTempDataDir } from "../api-helpers";

vi.mock("@/lib/cache", () => ({ invalidatePublicCache: vi.fn() }));

let token: string;

beforeAll(async () => {
  setupTempDataDir();
  const secret = new TextEncoder().encode(JWT_SECRET);
  token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);
});

describe("images POST is_starred 4-limit server guard", () => {
  test("5th starred image creation returns 409 with descriptive error", async () => {
    const { getDb } = await import("../../lib/db");
    const db = getDb();

    // Seed data uses ids 1-4. Use id=100 to avoid collision.
    db.prepare(
      "INSERT INTO remodeling_cases (id, title, show_on_main) VALUES (100, 'Star Limit Test', 0)",
    ).run();

    for (let i = 0; i < 4; i++) {
      db.prepare(
        "INSERT INTO case_images (case_id, type, match_order, is_starred, image_url) VALUES (?, 'before', ?, 1, ?)",
      ).run(100, i + 1, `http://example.com/star-${i}.jpg`);
    }

    const { POST } =
      await import("../../app/api/admin/remodeling/images/route");

    const req = new NextRequest(
      "http://localhost/api/admin/remodeling/images",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `upstay_admin_token=${token}`,
        },
        body: JSON.stringify({
          case_id: 100,
          type: "before",
          is_starred: 1,
          image_url: "http://example.com/star-5th.jpg",
        }),
      },
    );

    const res = await POST(req as never);
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.error).toMatch(/4개까지/);
  });

  test("4th starred image is still accepted", async () => {
    const { getDb } = await import("../../lib/db");
    const db = getDb();

    db.prepare(
      "INSERT INTO remodeling_cases (id, title, show_on_main) VALUES (101, 'Star Allow Test', 0)",
    ).run();

    for (let i = 0; i < 3; i++) {
      db.prepare(
        "INSERT INTO case_images (case_id, type, match_order, is_starred, image_url) VALUES (?, 'after', ?, 1, ?)",
      ).run(101, i + 1, `http://example.com/after-${i}.jpg`);
    }

    const { POST } =
      await import("../../app/api/admin/remodeling/images/route");

    const req = new NextRequest(
      "http://localhost/api/admin/remodeling/images",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `upstay_admin_token=${token}`,
        },
        body: JSON.stringify({
          case_id: 101,
          type: "after",
          is_starred: 1,
          image_url: "http://example.com/after-4th.jpg",
        }),
      },
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
  });
});
