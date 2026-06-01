"use client";

// 업로드 진행 중인 파일들을 카드 리스트로 보여주는 컴포넌트.
// 상태머신·진행률 계산은 lib/upload-queue.ts(순수 로직)에 있고, 여기선 그 결과를
// 그릴 뿐이다. 다섯 가지 완전체 UX 중 화면 표현을 담당:
//  1. 로컬 미리보기(localUrl) 즉시 표시
//  2. 장당 진행률 바(uploading %)
//  3. "처리중" 스피너(processing)
//  4. done이면 서버 썸네일(.thumb.webp)로 교체
//  5. error는 빨갛게 + 재시도 버튼
//
// 접근성: 전체 진행 요약은 aria-live, 각 카드 미리보기는 alt, 재시도는 aria-label.

import { RefreshCw, X } from "lucide-react";
import { resolveImg } from "@/lib/image-url";
import {
  type UploadItem,
  countByStatus,
  overallProgress,
  thumbUrl,
} from "@/lib/upload-queue";

function statusLabel(item: UploadItem): string {
  switch (item.status) {
    case "pending":
      return "대기 중";
    case "uploading":
      return `${item.progress}%`;
    case "processing":
      return "처리중";
    case "done":
      return "완료";
    case "error":
      return "실패";
  }
}

export function UploadCard({
  item,
  onRetry,
  onDismiss,
}: {
  item: UploadItem;
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const isError = item.status === "error";
  const isDone = item.status === "done";
  const isProcessing = item.status === "processing";
  const isUploading = item.status === "uploading";

  // done이면 서버 최적화 썸네일, 아니면 로컬 미리보기.
  const previewSrc =
    isDone && item.serverUrl
      ? resolveImg(thumbUrl(item.serverUrl))
      : item.localUrl;

  return (
    <div
      data-testid="upload-queue-card"
      data-upload-status={item.status}
      className={`relative w-[120px] h-[90px] rounded-lg overflow-hidden shrink-0 border transition-all ${
        isError ? "border-red-400 ring-2 ring-red-300" : "border-[#111]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- blob: 로컬 미리보기는 next/image 최적화 대상이 아님 */}
      <img
        src={previewSrc}
        alt={`업로드 ${statusLabel(item)}: ${item.file.name}`}
        className={`w-full h-full object-cover select-none ${
          isError ? "opacity-40" : isDone ? "opacity-100" : "opacity-70"
        }`}
        draggable={false}
      />

      {/* 진행률 바 — uploading 구간에서만. */}
      {isUploading && (
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/20">
          <div
            className="h-full bg-[#111] transition-[width] duration-150"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}

      {/* 처리중 스피너 — 서버가 webp/썸네일 변환 중. */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
          <RefreshCw
            size={18}
            className="text-white animate-spin"
            aria-hidden="true"
          />
        </div>
      )}

      {/* 상태 배지 — 진행률/처리중/완료 텍스트. */}
      <span
        className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
          isError
            ? "bg-red-500 text-white"
            : isDone
              ? "bg-[#111] text-white"
              : "bg-black/60 text-white"
        }`}
      >
        {statusLabel(item)}
      </span>

      {/* 실패 시 재시도 + 닫기(목록에서 제거). */}
      {isError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45">
          <button
            type="button"
            aria-label={`'${item.file.name}' 다시 업로드`}
            onClick={() => onRetry(item.id)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white text-[11px] font-semibold text-red-600 hover:bg-red-50"
          >
            <RefreshCw size={12} aria-hidden="true" />
            재시도
          </button>
          <button
            type="button"
            aria-label={`'${item.file.name}' 목록에서 제거`}
            onClick={() => onDismiss(item.id)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white/90 hover:text-white"
          >
            <X size={11} aria-hidden="true" />
            제거
          </button>
        </div>
      )}
    </div>
  );
}

// 업로드 진행 요약(텍스트 한 줄)만 담당. ★ 레이아웃 출렁임 수정 이후, 업로드
// "카드"는 갤러리 썸네일과 같은 그리드(ImageSection)에 인라인으로 그려진다 — 카드가
// 큐 영역↔갤러리 영역을 오가지 않게 해 layout shift를 없애기 위함. 따라서 여기선
// 카드 목록을 더 이상 그리지 않고, aria-live 요약 줄만 남긴다.
//
// 요약 줄은 진행 중에만 보이고 사라지는데, 나타났다 사라질 때 아래 그리드를 밀어
// 세로 들썩임을 만들지 않도록 항상 같은 높이(min-h)를 차지하게 둔다(빈 줄도 자리 유지).
export function UploadQueueSummary({ items }: { items: UploadItem[] }) {
  const counts = countByStatus(items);
  const pct = overallProgress(items);

  // 진행 중인 항목이 하나도 없으면 빈 요약(자리만 유지) — 세로 출렁임 방지.
  const summary =
    items.length === 0
      ? ""
      : counts.settled
        ? counts.error > 0
          ? `업로드 완료 — 성공 ${counts.done}장, 실패 ${counts.error}장`
          : `사진 ${counts.done}장이 모두 올라갔어요.`
        : `사진 업로드 중... ${counts.done}/${counts.total}장 (${pct}%)`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="text-[12px] text-[#555] mt-2 min-h-[18px]"
    >
      {summary}
    </div>
  );
}
