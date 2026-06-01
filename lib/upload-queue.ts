// 관리자 사진 업로드 큐의 "두뇌" — 프레임워크 비의존 순수 로직.
// React 컴포넌트(components/admin/upload-queue.tsx)는 이 모듈의 상태머신·계산
// 함수를 그대로 소비한다. 순수 함수로 분리한 이유:
//  ① 상태 전이·진행률·재시도·objectURL 해제 로직을 vitest(node 환경)에서 직접 검증.
//  ② 컴포넌트는 렌더링만 책임지게 해 회귀 위험을 줄인다.
//
// 상태머신: pending → uploading(progress 0-100) → processing → done | error
//  - pending:    파일 선택 직후. 아직 전송 시작 전(동시성 큐 대기 포함).
//  - uploading:  XHR 업로드 진행 중. progress = xhr.upload 바이트 진행률(0-100).
//  - processing: 클라이언트 전송 100% 완료 후 서버가 webp/썸네일 변환 중인 구간.
//  - done:       서버 응답 수신. serverUrl 확정 → 갤러리에 점진 반영.
//  - error:      검증/네트워크/서버 실패. 개별 재시도 가능.

export type UploadStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "done"
  | "error";

export interface UploadItem {
  id: string;
  // 원본 File. 재시도 시 그대로 다시 전송한다.
  file: File;
  // URL.createObjectURL(file) 결과 — 로컬 즉시 미리보기용. done/언마운트 시 해제.
  localUrl: string;
  status: UploadStatus;
  // 0-100. uploading 구간에서만 의미가 있고 나머지 상태에서는 정의상 0 또는 100.
  progress: number;
  // 서버가 돌려준 원본 url (/api/uploads/xxxx.jpg). done에서만 존재.
  serverUrl?: string;
  // done 시 DB에 등록된 case_images.id. 갤러리 점진 반영·중복 방지에 사용.
  imageId?: number;
  // error 시 사용자 친화 메시지.
  error?: string;
}

let seq = 0;
// objectURL id 충돌 방지용 단조 증가 카운터. crypto 비의존(테스트 결정성).
export function nextItemId(): string {
  seq += 1;
  return `up-${Date.now()}-${seq}`;
}

// 파일 → 초기 업로드 항목. createObjectURL은 주입 가능(테스트에서 mock).
export function createUploadItem(
  file: File,
  makeObjectUrl: (f: File) => string,
): UploadItem {
  return {
    id: nextItemId(),
    file,
    localUrl: makeObjectUrl(file),
    status: "pending",
    progress: 0,
  };
}

// 허용된 전이만 통과시키는 상태머신 reducer. 잘못된 전이는 현 상태 유지(noop)해
// race(예: error 처리 직후 늦게 도착한 progress 이벤트)에도 안전하다.
type Transition =
  | { kind: "start" } // pending → uploading
  | { kind: "progress"; progress: number } // uploading → uploading(%)
  | { kind: "processing" } // uploading → processing
  | { kind: "done"; serverUrl: string; imageId?: number } // processing → done
  | { kind: "error"; error: string } // any(비종료) → error
  | { kind: "retry" }; // error → pending

const TERMINAL: ReadonlySet<UploadStatus> = new Set(["done"]);

export function transition(item: UploadItem, t: Transition): UploadItem {
  switch (t.kind) {
    case "start":
      // 재시도(error) 또는 최초(pending)에서만 업로드 시작 허용.
      if (item.status !== "pending") return item;
      return { ...item, status: "uploading", progress: 0, error: undefined };

    case "progress": {
      if (item.status !== "uploading") return item;
      const clamped = clampProgress(t.progress);
      return { ...item, progress: clamped };
    }

    case "processing":
      // 업로드 바이트 전송이 끝났다(=100%). 서버 변환 대기로 전환.
      if (item.status !== "uploading") return item;
      return { ...item, status: "processing", progress: 100 };

    case "done":
      // uploading/processing 어느 쪽에서든 응답이 오면 완료 처리.
      // (작은 파일은 progress 이벤트가 거의 없이 곧장 응답이 올 수 있음)
      if (item.status !== "uploading" && item.status !== "processing")
        return item;
      return {
        ...item,
        status: "done",
        progress: 100,
        serverUrl: t.serverUrl,
        imageId: t.imageId,
        error: undefined,
      };

    case "error":
      // 이미 완료된 항목은 에러로 되돌리지 않는다(늦은 이벤트 방어).
      if (TERMINAL.has(item.status)) return item;
      return { ...item, status: "error", error: t.error };

    case "retry":
      // 실패한 항목만 다시 대기열로. progress 초기화.
      if (item.status !== "error") return item;
      return { ...item, status: "pending", progress: 0, error: undefined };
  }
}

export function clampProgress(p: number): number {
  if (Number.isNaN(p)) return 0;
  if (p < 0) return 0;
  if (p > 100) return 100;
  return Math.round(p);
}

// 전체 진행률 = 항목별 진행률 평균(done=100, error=0 취급).
// 헤더 요약·aria-live 안내에 사용. 빈 큐는 0.
export function overallProgress(items: UploadItem[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, it) => {
    if (it.status === "done") return acc + 100;
    if (it.status === "error") return acc + 0;
    if (it.status === "processing") return acc + 100;
    return acc + clampProgress(it.progress);
  }, 0);
  return Math.round(sum / items.length);
}

export interface QueueCounts {
  total: number;
  pending: number;
  uploading: number;
  processing: number;
  done: number;
  error: number;
  // 더 이상 진행 중인 항목이 없으면 true(모두 done 또는 error).
  settled: boolean;
}

export function countByStatus(items: UploadItem[]): QueueCounts {
  const c: QueueCounts = {
    total: items.length,
    pending: 0,
    uploading: 0,
    processing: 0,
    done: 0,
    error: 0,
    settled: false,
  };
  for (const it of items) c[it.status] += 1;
  c.settled =
    items.length > 0 && c.pending + c.uploading + c.processing === 0;
  return c;
}

// 서버 원본 url → admin 썸네일(.thumb.webp) url.
// 서버가 업로드 직후 .thumb.webp 사본을 만들어두므로 done 카드는 이걸 표시한다.
// gif는 variants가 없으니 원본 그대로(서빙 라우트가 처리).
export function thumbUrl(serverUrl: string): string {
  if (/\.gif$/i.test(serverUrl)) return serverUrl;
  return `${serverUrl}.thumb.webp`;
}

// 큐에서 done이 아닌(진행 중·실패) 항목의 localUrl만 모은다 — 해제 대상은 호출부가 판단.
// done 항목은 갤러리로 넘어간 직후 별도로 해제하므로 여기서 제외할 수 있게 분리.
export function pendingObjectUrls(items: UploadItem[]): string[] {
  return items.map((it) => it.localUrl);
}

// 동시성 제한 풀 — 서버 sharp 메모리 보호를 위해 한 시점에 limit개만 실행.
// runner는 항목 하나를 처리하는 async 함수. 입력 순서대로 시작하되 limit개씩 흐른다.
export async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  runner: (item: T, index: number) => Promise<void>,
): Promise<void> {
  const max = Math.max(1, Math.floor(limit));
  let cursor = 0;
  const workers: Promise<void>[] = [];
  const worker = async () => {
    while (cursor < items.length) {
      const idx = cursor;
      cursor += 1;
      await runner(items[idx], idx);
    }
  };
  const n = Math.min(max, items.length);
  for (let i = 0; i < n; i += 1) workers.push(worker());
  await Promise.all(workers);
}
