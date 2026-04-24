import { beforeAll, describe, expect, test, vi } from "vitest";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { setupTempDataDir } from "../api-helpers";

vi.mock("@/lib/cache", () => ({ invalidatePublicCache: vi.fn() }));

let token: string;

beforeAll(async () => {
  setupTempDataDir();
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);
});

describe("/api/admin/remodeling/reorder transaction behavior", () => {
  test("valid reorder updates sort_order and returns 200", async () => {
    const { getDb } = await import("../../lib/db");
    const db = getDb();

    db.prepare(
      "INSERT INTO remodeling_cases (id, title, sort_order, show_on_main) VALUES (200, 'Reorder A', 1, 0)",
    ).run();
    db.prepare(
      "INSERT INTO remodeling_cases (id, title, sort_order, show_on_main) VALUES (201, 'Reorder B', 2, 0)",
    ).run();

    const { POST } =
      await import("../../app/api/admin/remodeling/reorder/route");

    const req = new NextRequest(
      "http://localhost/api/admin/remodeling/reorder",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [
            { id: 200, sort_order: 2 },
            { id: 201, sort_order: 1 },
          ],
        }),
      },
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);

    const rows = db
      .prepare(
        "SELECT id, sort_order FROM remodeling_cases WHERE id IN (200, 201) ORDER BY sort_order",
      )
      .all() as { id: number; sort_order: number }[];

    expect(rows[0]).toEqual({ id: 201, sort_order: 1 });
    expect(rows[1]).toEqual({ id: 200, sort_order: 2 });
  });

  test("non-existent id is a no-op (sqlite UPDATE 0 rows — not an error)", async () => {
    const { getDb } = await import("../../lib/db");
    const db = getDb();

    db.prepare(
      "INSERT INTO remodeling_cases (id, title, sort_order, show_on_main) VALUES (210, 'Noop Test', 10, 0)",
    ).run();

    const { POST } =
      await import("../../app/api/admin/remodeling/reorder/route");

    const req = new NextRequest(
      "http://localhost/api/admin/remodeling/reorder",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [
            { id: 210, sort_order: 99 },
            { id: 99999, sort_order: 1 },
          ],
        }),
      },
    );

    const res = await POST(req as never);
    // SQLite UPDATE for nonexistent id silently affects 0 rows — not a DB error
    expect(res.status).toBe(200);

    const row = db
      .prepare("SELECT sort_order FROM remodeling_cases WHERE id=210")
      .get() as { sort_order: number };
    expect(row.sort_order).toBe(99);
  });

  test("rejects request without valid token with 401", async () => {
    const { POST } =
      await import("../../app/api/admin/remodeling/reorder/route");

    const req = new NextRequest(
      "http://localhost/api/admin/remodeling/reorder",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id: 1, sort_order: 1 }] }),
      },
    );

    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });
});
