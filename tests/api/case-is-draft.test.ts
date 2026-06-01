import { beforeAll, describe, expect, test, vi } from "vitest";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { setupTempDataDir } from "../api-helpers";
import { caseUpdateSchema } from "../../lib/admin-schemas";

vi.mock("@/lib/cache", () => ({ invalidatePublicCache: vi.fn() }));

let token: string;

beforeAll(async () => {
  setupTempDataDir();
  // JWT_SECRET은 lib/auth에서 export하지 않는다(보안). setupTempDataDir이 주입한
  // process.env에서 직접 읽는다.
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);
});

function authedRequest(
  url: string,
  method: string,
  body: unknown,
): NextRequest {
  return new NextRequest(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      cookie: `upstay_admin_token=${token}`,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/remodeling — is_draft 저장", () => {
  test("is_draft=1을 body로 보내면 DB에 1로 저장된다", async () => {
    const { POST } = await import("../../app/api/admin/remodeling/route");
    const req = authedRequest("http://localhost/api/admin/remodeling", "POST", {
      title: "draft case",
      sort_order: -5,
      show_on_main: 0,
      is_draft: 1,
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const { id } = (await res.json()) as { id: number };
    expect(typeof id).toBe("number");

    const { getDb } = await import("../../lib/db");
    const row = getDb()
      .prepare("SELECT is_draft, sort_order FROM remodeling_cases WHERE id=?")
      .get(id) as { is_draft: number; sort_order: number };
    expect(row.is_draft).toBe(1);
    expect(row.sort_order).toBe(-5);
  });

  test("is_draft 미지정 시 스키마 기본값 1로 저장 (박스 추가 직후 새박스 상태)", async () => {
    const { POST } = await import("../../app/api/admin/remodeling/route");
    const req = authedRequest("http://localhost/api/admin/remodeling", "POST", {
      title: "default draft",
      sort_order: -10,
      show_on_main: 0,
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const { id } = (await res.json()) as { id: number };
    const { getDb } = await import("../../lib/db");
    const row = getDb()
      .prepare("SELECT is_draft FROM remodeling_cases WHERE id=?")
      .get(id) as { is_draft: number };
    expect(row.is_draft).toBe(1);
  });
});

describe("PUT /api/admin/remodeling — is_draft 전이", () => {
  test("PUT으로 is_draft=0 변경 가능", async () => {
    const { POST, PUT } = await import("../../app/api/admin/remodeling/route");

    // 1) draft 박스 생성
    const createRes = await POST(
      authedRequest("http://localhost/api/admin/remodeling", "POST", {
        title: "put transition",
        sort_order: -20,
        show_on_main: 0,
        is_draft: 1,
      }) as never,
    );
    const { id } = (await createRes.json()) as { id: number };

    // 2) PUT으로 is_draft=0
    const putRes = await PUT(
      authedRequest("http://localhost/api/admin/remodeling", "PUT", {
        id,
        is_draft: 0,
      }) as never,
    );
    expect(putRes.status).toBe(200);

    const { getDb } = await import("../../lib/db");
    const row = getDb()
      .prepare("SELECT is_draft FROM remodeling_cases WHERE id=?")
      .get(id) as { is_draft: number };
    expect(row.is_draft).toBe(0);
  });

  test("PUT으로 is_draft=0 + show_on_main 함께 보내면 둘 다 반영", async () => {
    // handleToggleMain의 promoteFromDraft 경로를 시뮬레이션.
    const { POST, PUT } = await import("../../app/api/admin/remodeling/route");

    const createRes = await POST(
      authedRequest("http://localhost/api/admin/remodeling", "POST", {
        title: "promote",
        sort_order: -30,
        show_on_main: 0,
        is_draft: 1,
      }) as never,
    );
    const { id } = (await createRes.json()) as { id: number };

    const putRes = await PUT(
      authedRequest("http://localhost/api/admin/remodeling", "PUT", {
        id,
        show_on_main: 2,
        is_draft: 0,
      }) as never,
    );
    expect(putRes.status).toBe(200);

    const { getDb } = await import("../../lib/db");
    const row = getDb()
      .prepare(
        "SELECT is_draft, show_on_main FROM remodeling_cases WHERE id=?",
      )
      .get(id) as { is_draft: number; show_on_main: number };
    expect(row.is_draft).toBe(0);
    expect(row.show_on_main).toBe(2);
  });
});

describe("GET /api/admin/remodeling — is_draft 응답 포함", () => {
  test("GET 응답 각 case에 is_draft 필드가 포함된다", async () => {
    const { GET } = await import("../../app/api/admin/remodeling/route");
    const req = new NextRequest("http://localhost/api/admin/remodeling", {
      method: "GET",
      headers: { cookie: `upstay_admin_token=${token}` },
    });
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row).toHaveProperty("is_draft");
      expect(typeof row.is_draft).toBe("number");
    }
  });
});

describe("caseUpdateSchema — is_draft 옵셔널 검증", () => {
  test("is_draft 생략 가능 (부분 업데이트)", () => {
    const result = caseUpdateSchema.safeParse({ id: 1, title: "x" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_draft).toBeUndefined();
    }
  });

  test("is_draft=0/1만 허용, 그 외 값은 거부", () => {
    expect(
      caseUpdateSchema.safeParse({ id: 1, is_draft: 0 }).success,
    ).toBe(true);
    expect(
      caseUpdateSchema.safeParse({ id: 1, is_draft: 1 }).success,
    ).toBe(true);
    expect(
      caseUpdateSchema.safeParse({ id: 1, is_draft: 2 }).success,
    ).toBe(false);
    expect(
      caseUpdateSchema.safeParse({ id: 1, is_draft: -1 }).success,
    ).toBe(false);
  });

  test("show_on_main과 is_draft를 동시에 보낼 수 있다", () => {
    const result = caseUpdateSchema.safeParse({
      id: 1,
      show_on_main: 2,
      is_draft: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.show_on_main).toBe(2);
      expect(result.data.is_draft).toBe(0);
    }
  });
});
