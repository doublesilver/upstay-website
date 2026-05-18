import { beforeAll, describe, expect, test, vi } from "vitest";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { setupTempDataDir, TEST_JWT_SECRET } from "../api-helpers";

// 캐시 무효화는 사이드 이펙트일 뿐이라 테스트 격리를 위해 mock.
vi.mock("@/lib/cache", () => ({ invalidatePublicCache: vi.fn() }));

let token: string;

beforeAll(async () => {
  // setupTempDataDir이 JWT_SECRET 등 필수 env를 함께 세팅함.
  setupTempDataDir();
  const secret = new TextEncoder().encode(TEST_JWT_SECRET);
  token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);
});

function buildReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/remodeling/images", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      cookie: `upstay_admin_token=${token}`,
    },
    body: JSON.stringify(body),
  });
}

describe("/api/admin/remodeling/images DELETE — bulk", () => {
  test("ids 배열로 한 번에 여러 이미지 삭제", async () => {
    const { getDb } = await import("../../lib/db");
    const db = getDb();

    db.prepare(
      "INSERT INTO remodeling_cases (id, title, show_on_main) VALUES (300, 'Bulk Delete', 0)",
    ).run();
    const insert = db.prepare(
      "INSERT INTO case_images (case_id, type, match_order, image_url) VALUES (?, 'before', ?, ?)",
    );
    const ids: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const r = insert.run(300, i, `http://example.com/bulk-${i}.jpg`);
      ids.push(Number(r.lastInsertRowid));
    }

    const { DELETE } =
      await import("../../app/api/admin/remodeling/images/route");

    const res = await DELETE(buildReq({ ids, case_id: 300 }) as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.deleted).toBe(3);

    const remaining = db
      .prepare("SELECT COUNT(*) AS n FROM case_images WHERE case_id = 300")
      .get() as { n: number };
    expect(remaining.n).toBe(0);
  });

  test("단일 id 형식도 후방 호환으로 지원", async () => {
    const { getDb } = await import("../../lib/db");
    const db = getDb();

    db.prepare(
      "INSERT INTO remodeling_cases (id, title, show_on_main) VALUES (301, 'Legacy single', 0)",
    ).run();
    const r = db
      .prepare(
        "INSERT INTO case_images (case_id, type, match_order, image_url) VALUES (301, 'before', 1, 'http://example.com/legacy.jpg')",
      )
      .run();
    const id = Number(r.lastInsertRowid);

    const { DELETE } =
      await import("../../app/api/admin/remodeling/images/route");

    const res = await DELETE(buildReq({ id, case_id: 301 }) as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(1);

    const remaining = db
      .prepare("SELECT COUNT(*) AS n FROM case_images WHERE id = ?")
      .get(id) as { n: number };
    expect(remaining.n).toBe(0);
  });

  test("다른 case의 id가 섞이면 403 + 어떤 행도 삭제되지 않음", async () => {
    const { getDb } = await import("../../lib/db");
    const db = getDb();

    db.prepare(
      "INSERT INTO remodeling_cases (id, title, show_on_main) VALUES (302, 'Owner', 0)",
    ).run();
    db.prepare(
      "INSERT INTO remodeling_cases (id, title, show_on_main) VALUES (303, 'Other', 0)",
    ).run();
    const r1 = db
      .prepare(
        "INSERT INTO case_images (case_id, type, match_order, image_url) VALUES (302, 'before', 1, 'http://example.com/own.jpg')",
      )
      .run();
    const r2 = db
      .prepare(
        "INSERT INTO case_images (case_id, type, match_order, image_url) VALUES (303, 'before', 1, 'http://example.com/other.jpg')",
      )
      .run();
    const ownId = Number(r1.lastInsertRowid);
    const foreignId = Number(r2.lastInsertRowid);

    const { DELETE } =
      await import("../../app/api/admin/remodeling/images/route");

    const res = await DELETE(
      buildReq({ ids: [ownId, foreignId], case_id: 302 }) as never,
    );
    expect(res.status).toBe(403);

    // 트랜잭션 롤백 검증: 두 행 모두 그대로 남아야 함.
    const survivors = db
      .prepare(
        "SELECT id FROM case_images WHERE id IN (?, ?) ORDER BY id",
      )
      .all(ownId, foreignId) as { id: number }[];
    expect(survivors.map((s) => s.id)).toEqual(
      [ownId, foreignId].sort((a, b) => a - b),
    );
  });

  test("id와 ids 둘 다 누락이면 400", async () => {
    const { DELETE } =
      await import("../../app/api/admin/remodeling/images/route");

    const res = await DELETE(buildReq({ case_id: 999 }) as never);
    expect(res.status).toBe(400);
  });

  test("빈 ids 배열은 400", async () => {
    const { DELETE } =
      await import("../../app/api/admin/remodeling/images/route");

    const res = await DELETE(buildReq({ ids: [], case_id: 999 }) as never);
    expect(res.status).toBe(400);
  });

  test("토큰 없으면 401", async () => {
    const { DELETE } =
      await import("../../app/api/admin/remodeling/images/route");

    const req = new NextRequest(
      "http://localhost/api/admin/remodeling/images",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [1], case_id: 1 }),
      },
    );
    const res = await DELETE(req as never);
    expect(res.status).toBe(401);
  });
});
