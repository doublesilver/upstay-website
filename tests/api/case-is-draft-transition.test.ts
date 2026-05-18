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

function putReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/remodeling", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      cookie: `upstay_admin_token=${token}`,
    },
    body: JSON.stringify(body),
  });
}

describe("is_draft 상태 전이 — 저장/메인 지정 시나리오", () => {
  test("handleRegister 시뮬레이션: draft 박스 저장 시 is_draft=0으로 전이", async () => {
    const { getDb } = await import("../../lib/db");
    const db = getDb();

    // 직접 draft 박스를 시드 (POST를 거치지 않고 도메인 상태 세팅)
    const insertResult = db
      .prepare(
        "INSERT INTO remodeling_cases (title, sort_order, show_on_main, is_draft) VALUES (?, ?, ?, ?)",
      )
      .run("register me", -100, 0, 1);
    const id = Number(insertResult.lastInsertRowid);

    // page.tsx 의 handleRegister가 보내는 payload 구조: title + show_on_main + is_draft=0
    const { PUT } = await import("../../app/api/admin/remodeling/route");
    const res = await PUT(
      putReq({ id, title: "saved title", show_on_main: 0, is_draft: 0 }) as never,
    );
    expect(res.status).toBe(200);

    const row = db
      .prepare(
        "SELECT title, is_draft, show_on_main FROM remodeling_cases WHERE id=?",
      )
      .get(id) as { title: string; is_draft: number; show_on_main: number };
    expect(row.title).toBe("saved title");
    expect(row.is_draft).toBe(0);
    expect(row.show_on_main).toBe(0);
  });

  test("handleToggleMain 시뮬레이션: 메인 슬롯 지정 시 is_draft=0 동반 전송", async () => {
    const { getDb } = await import("../../lib/db");
    const db = getDb();

    // 메인 슬롯 1을 비워둔 상태에서 draft 박스 1개 생성
    const insertResult = db
      .prepare(
        "INSERT INTO remodeling_cases (title, sort_order, show_on_main, is_draft) VALUES (?, ?, ?, ?)",
      )
      .run("draft to main", -200, 0, 1);
    const id = Number(insertResult.lastInsertRowid);

    // promoteFromDraft 경로: show_on_main=1 + is_draft=0 같이 보냄
    const { PUT } = await import("../../app/api/admin/remodeling/route");
    const res = await PUT(
      putReq({ id, show_on_main: 1, is_draft: 0 }) as never,
    );
    expect(res.status).toBe(200);

    const row = db
      .prepare(
        "SELECT show_on_main, is_draft FROM remodeling_cases WHERE id=?",
      )
      .get(id) as { show_on_main: number; is_draft: number };
    expect(row.show_on_main).toBe(1);
    expect(row.is_draft).toBe(0);
  });

  test("메인 슬롯 충돌 처리 순서: 기존 점유 박스를 먼저 0으로 비운 뒤 새 박스에 슬롯 부여", async () => {
    // partial UNIQUE index 제약: 동시 부여하면 위반.
    // handleToggleMain은 직렬로 PUT 두 번 — (1) 충돌 박스 0으로, (2) 새 박스 슬롯 부여.
    const { getDb } = await import("../../lib/db");
    const db = getDb();

    // 기존 메인 슬롯 2 점유 박스
    const existingId = Number(
      db
        .prepare(
          "INSERT INTO remodeling_cases (title, sort_order, show_on_main, is_draft) VALUES (?, ?, ?, ?)",
        )
        .run("existing slot2", 0, 2, 0).lastInsertRowid,
    );

    // 새박스(draft)
    const draftId = Number(
      db
        .prepare(
          "INSERT INTO remodeling_cases (title, sort_order, show_on_main, is_draft) VALUES (?, ?, ?, ?)",
        )
        .run("new draft", -300, 0, 1).lastInsertRowid,
    );

    const { PUT } = await import("../../app/api/admin/remodeling/route");

    // step 1: 기존 점유 박스 0으로
    const res1 = await PUT(
      putReq({ id: existingId, show_on_main: 0 }) as never,
    );
    expect(res1.status).toBe(200);

    // step 2: 새 박스에 슬롯 2 부여 + draft 해제
    const res2 = await PUT(
      putReq({ id: draftId, show_on_main: 2, is_draft: 0 }) as never,
    );
    expect(res2.status).toBe(200);

    const finalRows = db
      .prepare(
        "SELECT id, show_on_main, is_draft FROM remodeling_cases WHERE id IN (?, ?) ORDER BY id",
      )
      .all(existingId, draftId) as Array<{
      id: number;
      show_on_main: number;
      is_draft: number;
    }>;
    const existing = finalRows.find((r) => r.id === existingId)!;
    const promoted = finalRows.find((r) => r.id === draftId)!;
    expect(existing.show_on_main).toBe(0);
    expect(promoted.show_on_main).toBe(2);
    expect(promoted.is_draft).toBe(0);
  });

  test("is_draft=0인 박스에 다시 is_draft=0 보내도 멱등", async () => {
    // handleRegister는 메인 박스 묶음도 함께 저장하면서 is_draft=0을 모두에게 보낸다.
    // 이미 0인 박스에 0을 다시 써도 에러 없이 200이어야 한다.
    const { getDb } = await import("../../lib/db");
    const db = getDb();

    const id = Number(
      db
        .prepare(
          "INSERT INTO remodeling_cases (title, sort_order, show_on_main, is_draft) VALUES (?, ?, ?, ?)",
        )
        .run("already saved", 1, 0, 0).lastInsertRowid,
    );

    const { PUT } = await import("../../app/api/admin/remodeling/route");
    const res = await PUT(putReq({ id, is_draft: 0 }) as never);
    expect(res.status).toBe(200);

    const row = db
      .prepare("SELECT is_draft FROM remodeling_cases WHERE id=?")
      .get(id) as { is_draft: number };
    expect(row.is_draft).toBe(0);
  });
});
