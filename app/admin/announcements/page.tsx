"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { Toast } from "@/components/admin/toast";
import { apiFetch, getHeaders } from "@/lib/admin-api";

interface Announcement {
  id: number;
  title: string;
  content: string;
  is_visible: number;
  dismiss_duration: string;
  created_at: string;
}

export default function AnnouncementsAdminPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [toast, setToast] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const wrapBold = () => {
    const el = contentRef.current;
    if (!el || !editing) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const selected = value.slice(s, e);
    let newValue: string;
    let newStart: number;
    let newEnd: number;
    if (selected) {
      newValue = value.slice(0, s) + `**${selected}**` + value.slice(e);
      newStart = s;
      newEnd = e + 4;
    } else {
      newValue = value.slice(0, s) + "****" + value.slice(s);
      newStart = s + 2;
      newEnd = s + 2;
    }
    flushSync(() => setEditing({ ...editing, content: newValue }));
    el.focus();
    el.setSelectionRange(newStart, newEnd);
  };

  const insertBullet = () => {
    const el = contentRef.current;
    if (!el || !editing) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const lines = value.split("\n");
    let charCount = 0;
    let startLine = 0;
    let endLine = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineEnd = charCount + lines[i].length;
      if (charCount <= s && s <= lineEnd + 1) startLine = i;
      if (charCount <= e && e <= lineEnd + 1) endLine = i;
      charCount += lines[i].length + 1;
    }
    const newLines = lines.map((line, i) =>
      i >= startLine && i <= endLine ? "• " + line : line,
    );
    const newValue = newLines.join("\n");
    const added = (endLine - startLine + 1) * 2;
    flushSync(() => setEditing({ ...editing, content: newValue }));
    el.focus();
    el.setSelectionRange(s + 2, e + added);
  };

  const load = useCallback(() => {
    apiFetch("/api/admin/announcements", { headers: getHeaders() })
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setToast("불러오기 실패"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    if (!editing && deleting === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deleting !== null) setDeleting(null);
      else if (editing) setEditing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, deleting]);

  const handleSave = async () => {
    if (!editing) return;
    const method = editing.id ? "PUT" : "POST";
    try {
      await apiFetch("/api/admin/announcements", {
        method,
        headers: getHeaders(),
        body: JSON.stringify(editing),
      });
      setEditing(null);
      setToast(editing.id ? "수정되었습니다" : "등록되었습니다");
      load();
    } catch {
      setToast("저장 실패");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch("/api/admin/announcements", {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify({ id }),
      });
      setDeleting(null);
      setToast("삭제되었습니다");
      load();
    } catch {
      setToast("삭제 실패");
    }
  };

  const handleToggleVisible = async (item: Announcement) => {
    try {
      await apiFetch("/api/admin/announcements", {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ ...item, is_visible: item.is_visible ? 0 : 1 }),
      });
      load();
    } catch {
      setToast("변경 실패");
    }
  };

  const newItem = (): Announcement => ({
    id: 0,
    title: "",
    content: "",
    is_visible: 1,
    dismiss_duration: "none",
    created_at: "",
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[26px] font-bold text-[#111] tracking-tight">
            팝업창
          </h1>
        </div>
        <button
          onClick={() => setEditing(newItem())}
          className="bg-[#111] text-white rounded-xl px-5 py-2.5 text-[14px] font-semibold hover:bg-[#333] active:scale-[0.98] transition-all"
        >
          + 새 팝업
        </button>
      </div>

      {/* 편집 모달 */}
      {editing && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setEditing(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-edit-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
          >
            <h2 id="announcement-edit-title" className="sr-only">
              팝업 편집
            </h2>
            <div className="px-6 py-5 space-y-4">
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                  placeholder="제목"
                  className="w-full border border-[#DDD] rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#111] transition-colors"
                />
                <div className="h-px bg-[#E5E5E5]" />
                <textarea
                  ref={contentRef}
                  value={editing.content}
                  onChange={(e) =>
                    setEditing({ ...editing, content: e.target.value })
                  }
                  rows={5}
                  aria-label="팝업 내용"
                  className="w-full border border-[#DDD] rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#111] transition-colors resize-none"
                  placeholder="팝업 내용"
                />
              </div>
              <div className="border-t border-[#EBEBEB]" />
              <div>
                <select
                  aria-label="팝업 닫기 설정"
                  value={editing.dismiss_duration || "none"}
                  onChange={(e) =>
                    setEditing({ ...editing, dismiss_duration: e.target.value })
                  }
                  className="w-full border border-[#DDD] rounded-xl px-4 py-3 text-[14px] outline-none transition-all focus:border-[#111] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                >
                  <option value="none">매번 표시</option>
                  <option value="day">닫으면 하루 동안 안 보임</option>
                  <option value="week">닫으면 일주일 동안 안 보임</option>
                  <option value="forever">닫으면 다시 안 보임</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#EBEBEB] flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={wrapBold}
                  className="w-9 h-9 border border-[#DDD] rounded-lg hover:bg-[#F7F7F7] font-bold text-[14px]"
                  title="굵게"
                  aria-label="굵게"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={insertBullet}
                  className="w-9 h-9 border border-[#DDD] rounded-lg hover:bg-[#F7F7F7] text-[14px]"
                  title="글머리기호"
                  aria-label="글머리기호"
                >
                  •
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(null)}
                  className="px-5 py-2.5 rounded-xl text-[14px] text-[#666] hover:bg-[#F7F7F7] transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={!editing.content}
                  className="bg-[#111] text-white rounded-xl px-5 py-2.5 text-[14px] font-semibold hover:bg-[#333] disabled:opacity-30 transition-all"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleting !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setDeleting(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-delete-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="px-6 py-8 text-center">
              <h3
                id="announcement-delete-title"
                className="text-[17px] font-bold text-[#111]"
              >
                삭제하시겠습니까?
              </h3>
            </div>
            <div className="px-6 py-4 border-t border-[#EBEBEB] flex gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 py-2.5 rounded-xl text-[14px] text-[#666] hover:bg-[#F7F7F7] transition-all"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleting)}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-[14px] font-semibold hover:bg-red-600 transition-all"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 공지 목록 */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-[#EBEBEB] rounded-2xl p-5 flex items-start justify-between gap-4 hover:shadow-sm transition-all"
          >
            <div className="flex-1 min-w-0 space-y-2">
              <div className="border border-[#111] rounded-lg px-3 py-2">
                <span className="font-semibold text-[15px] text-[#111] truncate block">
                  {item.title || "(제목 없음)"}
                </span>
              </div>
              <div className="border border-[#111] rounded-lg px-3 py-2">
                {item.content ? (
                  <p className="text-[14px] text-[#333] line-clamp-3 whitespace-pre-wrap">
                    {item.content}
                  </p>
                ) : (
                  <p className="text-[13px] text-[#BBB] italic">(빈 팝업)</p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 shrink-0 border border-black rounded-lg p-2">
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full ${
                    item.is_visible
                      ? "bg-green-50 text-green-600"
                      : "bg-[#F7F7F7] text-[#999]"
                  }`}
                >
                  {item.is_visible ? "공개" : "비공개"}
                </span>
                <button
                  onClick={() => handleToggleVisible(item)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${
                    item.is_visible ? "bg-[#111]" : "bg-[#DDD]"
                  }`}
                  title={item.is_visible ? "비공개로 전환" : "공개로 전환"}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                      item.is_visible ? "translate-x-4.5" : ""
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setEditing(item)}
                  className="px-3 py-1.5 rounded-lg text-[12px] border border-[#DDD] text-[#333] hover:bg-[#F7F7F7]"
                >
                  수정
                </button>
                <button
                  onClick={() => setDeleting(item.id)}
                  className="px-3 py-1.5 rounded-lg text-[12px] border border-red-200 text-red-500 hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}

        {loading && items.length === 0 && (
          <div className="py-20 text-center text-[#999] text-[14px]">
            로딩 중...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="bg-white border border-[#EBEBEB] rounded-2xl py-16 text-center">
            <div className="w-16 h-16 bg-[#F7F7F7] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#CCC"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-[#999]">
              등록된 공지가 없습니다
            </p>
            <p className="mt-1 text-[13px] text-[#CCC]">
              새 공지를 작성해보세요
            </p>
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
