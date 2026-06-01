import { afterEach, describe, expect, test, vi } from "vitest";
import {
  type UploadItem,
  clampProgress,
  countByStatus,
  createUploadItem,
  overallProgress,
  pendingObjectUrls,
  runWithConcurrency,
  thumbUrl,
  transition,
} from "@/lib/upload-queue";

// node 환경에는 File/URL.createObjectURL이 없으므로 최소 stub.
function fakeFile(name = "a.jpg"): File {
  return { name } as unknown as File;
}

function makeItem(overrides: Partial<UploadItem> = {}): UploadItem {
  return {
    id: "x",
    file: fakeFile(),
    localUrl: "blob:local",
    status: "pending",
    progress: 0,
    ...overrides,
  };
}

describe("createUploadItem", () => {
  test("초기 상태는 pending·progress 0·localUrl 주입", () => {
    const item = createUploadItem(fakeFile("photo.png"), () => "blob:xyz");
    expect(item.status).toBe("pending");
    expect(item.progress).toBe(0);
    expect(item.localUrl).toBe("blob:xyz");
    expect(item.serverUrl).toBeUndefined();
  });

  test("항목마다 고유 id가 부여된다", () => {
    const a = createUploadItem(fakeFile(), () => "blob:1");
    const b = createUploadItem(fakeFile(), () => "blob:2");
    expect(a.id).not.toBe(b.id);
  });
});

describe("transition — 상태머신 전이", () => {
  test("pending → start → uploading", () => {
    const next = transition(makeItem(), { kind: "start" });
    expect(next.status).toBe("uploading");
    expect(next.progress).toBe(0);
  });

  test("uploading → progress 갱신(클램프 포함)", () => {
    const up = transition(makeItem(), { kind: "start" });
    const p = transition(up, { kind: "progress", progress: 42.6 });
    expect(p.progress).toBe(43);
    const over = transition(up, { kind: "progress", progress: 150 });
    expect(over.progress).toBe(100);
  });

  test("uploading → processing(progress 100 고정)", () => {
    const up = transition(makeItem(), { kind: "start" });
    const proc = transition(up, { kind: "processing" });
    expect(proc.status).toBe("processing");
    expect(proc.progress).toBe(100);
  });

  test("processing → done(serverUrl·imageId 확정)", () => {
    const proc = makeItem({ status: "processing", progress: 100 });
    const done = transition(proc, {
      kind: "done",
      serverUrl: "/api/uploads/a.jpg",
      imageId: 7,
    });
    expect(done.status).toBe("done");
    expect(done.serverUrl).toBe("/api/uploads/a.jpg");
    expect(done.imageId).toBe(7);
  });

  test("작은 파일: uploading에서 곧장 done 허용(processing 건너뜀)", () => {
    const up = transition(makeItem(), { kind: "start" });
    const done = transition(up, {
      kind: "done",
      serverUrl: "/api/uploads/b.jpg",
    });
    expect(done.status).toBe("done");
  });

  test("uploading → error → retry → pending", () => {
    const up = transition(makeItem(), { kind: "start" });
    const err = transition(up, { kind: "error", error: "네트워크" });
    expect(err.status).toBe("error");
    expect(err.error).toBe("네트워크");
    const retried = transition(err, { kind: "retry" });
    expect(retried.status).toBe("pending");
    expect(retried.progress).toBe(0);
    expect(retried.error).toBeUndefined();
  });

  test("잘못된 전이는 noop(현 상태 유지)", () => {
    // done은 종료 상태 — error로 되돌리지 않는다(늦게 도착한 이벤트 방어).
    const done = makeItem({ status: "done", progress: 100 });
    const stillDone = transition(done, { kind: "error", error: "late" });
    expect(stillDone.status).toBe("done");

    // pending에 progress 줘도 무시.
    const pend = transition(makeItem(), { kind: "progress", progress: 50 });
    expect(pend.status).toBe("pending");
    expect(pend.progress).toBe(0);

    // done이 아닌 상태에서 retry는 무시.
    const up = transition(makeItem(), { kind: "start" });
    const noRetry = transition(up, { kind: "retry" });
    expect(noRetry.status).toBe("uploading");
  });

  test("done 이후 늦게 온 progress는 무시", () => {
    const done = makeItem({ status: "done", progress: 100 });
    const late = transition(done, { kind: "progress", progress: 30 });
    expect(late.progress).toBe(100);
    expect(late.status).toBe("done");
  });
});

describe("clampProgress", () => {
  test("범위·NaN 처리", () => {
    expect(clampProgress(-5)).toBe(0);
    expect(clampProgress(0)).toBe(0);
    expect(clampProgress(55.4)).toBe(55);
    expect(clampProgress(100)).toBe(100);
    expect(clampProgress(120)).toBe(100);
    expect(clampProgress(NaN)).toBe(0);
  });
});

describe("overallProgress", () => {
  test("빈 큐는 0", () => {
    expect(overallProgress([])).toBe(0);
  });

  test("done=100·error=0·processing=100·uploading=진행률 평균", () => {
    const items = [
      makeItem({ status: "done", progress: 100 }),
      makeItem({ status: "error" }),
      makeItem({ status: "uploading", progress: 50 }),
      makeItem({ status: "processing", progress: 100 }),
    ];
    // (100 + 0 + 50 + 100) / 4 = 62.5 → 63
    expect(overallProgress(items)).toBe(63);
  });
});

describe("countByStatus", () => {
  test("상태별 집계 + settled 판정", () => {
    const all = countByStatus([
      makeItem({ status: "done" }),
      makeItem({ status: "done" }),
      makeItem({ status: "error" }),
    ]);
    expect(all.done).toBe(2);
    expect(all.error).toBe(1);
    expect(all.total).toBe(3);
    expect(all.settled).toBe(true); // 진행 중 0개

    const running = countByStatus([
      makeItem({ status: "done" }),
      makeItem({ status: "uploading" }),
    ]);
    expect(running.settled).toBe(false);

    expect(countByStatus([]).settled).toBe(false); // 빈 큐는 settled 아님
  });
});

describe("thumbUrl", () => {
  test("일반 이미지는 .thumb.webp 접미사", () => {
    expect(thumbUrl("/api/uploads/abc.jpg")).toBe(
      "/api/uploads/abc.jpg.thumb.webp",
    );
  });
  test("gif는 변환본이 없으니 원본 그대로", () => {
    expect(thumbUrl("/api/uploads/anim.gif")).toBe("/api/uploads/anim.gif");
    expect(thumbUrl("/api/uploads/ANIM.GIF")).toBe("/api/uploads/ANIM.GIF");
  });
});

describe("pendingObjectUrls — objectURL 해제 대상 수집", () => {
  test("모든 항목의 localUrl을 모은다", () => {
    const urls = pendingObjectUrls([
      makeItem({ localUrl: "blob:1" }),
      makeItem({ localUrl: "blob:2" }),
    ]);
    expect(urls).toEqual(["blob:1", "blob:2"]);
  });
});

describe("objectURL 생명주기 — 누수 방지", () => {
  // 완료/제거 시 createObjectURL로 만든 URL을 revoke하는지 호출부 계약을 모사 검증.
  const revoked: string[] = [];
  const created: string[] = [];
  const fakeCreate = (f: File) => {
    const u = `blob:${f.name}-${created.length}`;
    created.push(u);
    return u;
  };
  const fakeRevoke = (u: string) => revoked.push(u);

  afterEach(() => {
    created.length = 0;
    revoked.length = 0;
  });

  test("done 처리 후 해당 localUrl을 revoke", () => {
    let item = createUploadItem(fakeFile("p.jpg"), fakeCreate);
    expect(created).toHaveLength(1);
    item = transition(item, { kind: "start" });
    item = transition(item, {
      kind: "done",
      serverUrl: "/api/uploads/p.jpg",
      imageId: 1,
    });
    // 호출부 계약: done이면 localUrl 해제
    if (item.status === "done") fakeRevoke(item.localUrl);
    expect(revoked).toEqual([created[0]]);
  });

  test("error 항목 제거(dismiss) 시 localUrl을 revoke", () => {
    let item = createUploadItem(fakeFile("q.jpg"), fakeCreate);
    item = transition(item, { kind: "start" });
    item = transition(item, { kind: "error", error: "x" });
    if (item.status === "error") fakeRevoke(item.localUrl);
    expect(revoked).toEqual([created[0]]);
  });
});

describe("runWithConcurrency — 동시성 제한 풀", () => {
  test("limit 초과 동시 실행이 없다", async () => {
    let active = 0;
    let maxActive = 0;
    const items = Array.from({ length: 9 }, (_, i) => i);
    await runWithConcurrency(items, 3, async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active -= 1;
    });
    expect(maxActive).toBeLessThanOrEqual(3);
  });

  test("모든 항목이 정확히 1회 처리된다", async () => {
    const items = ["a", "b", "c", "d", "e"];
    const seen: string[] = [];
    await runWithConcurrency(items, 2, async (it) => {
      seen.push(it);
    });
    expect(seen.sort()).toEqual(["a", "b", "c", "d", "e"]);
    expect(seen).toHaveLength(items.length);
  });

  test("항목 수가 limit보다 적으면 항목 수만큼만 worker", async () => {
    const items = [1];
    const fn = vi.fn(async () => {});
    await runWithConcurrency(items, 5, fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("빈 입력은 즉시 완료", async () => {
    const fn = vi.fn(async () => {});
    await runWithConcurrency([], 3, fn);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("재시도 시나리오 — 실패 후 done은 유지", () => {
  test("한 항목이 error여도 done 항목은 영향 없음", () => {
    const items = [
      makeItem({ id: "1", status: "done", progress: 100 }),
      makeItem({ id: "2", status: "error", error: "fail" }),
    ];
    // 2번만 retry → pending. 1번 done 불변.
    const next = items.map((it) =>
      it.id === "2" ? transition(it, { kind: "retry" }) : it,
    );
    expect(next[0].status).toBe("done");
    expect(next[1].status).toBe("pending");
  });
});
