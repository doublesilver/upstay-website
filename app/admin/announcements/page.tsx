"use client";

import { useEffect, useState, useCallback } from "react";
import { Toast } from "@/components/admin/toast";
import { apiFetch, getHeaders } from "@/lib/admin-api";
import { parseStyle, styleToCss, type TextStyle } from "@/lib/text-style";

interface Announcement {
  id: number;
  title: string;
  content: string;
  is_visible: number;
  dismiss_duration: string;
  title_style: string;
  content_style: string;
  created_at: string;
}

const DISMISS_OPTIONS = [
  { value: "none", label: "매번 표시" },
  { value: "day", label: "하루 안 보임" },
  { value: "week", label: "일주일 안 보임" },
  { value: "forever", label: "다시 안 보임" },
];

const NEW_ITEM: Announcement = {
  id: 0,
  title: "",
  content: "",
  is_visible: 1,
  dismiss_duration: "none",
  title_style: "{}",
  content_style: "{}",
  created_at: "",
};

export default function AnnouncementsAdminPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [toast, setToast] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingNew, setCreatingNew] = useState(false);
  const [dirtyMap, setDirtyMap] = useState<Record<number, boolean>>({});

  const load = useCallback(() => {
    apiFetch("/api/admin/announcements", { headers: getHeaders() })
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setToast("불러오기 실패"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    const isDirty = Object.values(dirtyMap).some(Boolean);
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyMap]);

  useEffect(() => {
    if (deleting === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleting(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleting]);

  const setDirty = useCallback((id: number, isDirty: boolean) => {
    setDirtyMap((prev) => {
      if (Boolean(prev[id]) === isDirty) return prev;
      const next = { ...prev };
      if (isDirty) next[id] = true;
      else delete next[id];
      return next;
    });
  }, []);

  const handleSave = async (item: Announcement) => {
    const method = item.id ? "PUT" : "POST";
    try {
      await apiFetch("/api/admin/announcements", {
        method,
        headers: getHeaders(),
        body: JSON.stringify(item),
      });
      setToast(item.id ? "수정되었습니다" : "등록되었습니다");
      if (item.id) setDirty(item.id, false);
      else {
        setCreatingNew(false);
        setDirty(0, false);
      }
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
      setDirty(id, false);
      setToast("삭제되었습니다");
      load();
    } catch {
      setToast("삭제 실패");
    }
  };

  const handleToggleVisible = async (item: Announcement) => {
    if (dirtyMap[item.id]) {
      setToast("저장하지 않은 변경사항이 있습니다");
      return;
    }
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[26px] font-bold text-[#111] tracking-tight">
          팝업창
        </h1>
        <button
          onClick={() => setCreatingNew(true)}
          disabled={creatingNew}
          className="bg-[#111] text-white rounded-xl px-5 py-2.5 text-[14px] font-semibold hover:bg-[#333] active:scale-[0.98] transition-all disabled:opacity-40"
        >
          + 새 팝업
        </button>
      </div>

      <div className="space-y-3">
        {creatingNew && (
          <AnnouncementCard
            key="new"
            item={NEW_ITEM}
            isNew
            onSave={handleSave}
            onCancel={() => {
              setCreatingNew(false);
              setDirty(0, false);
            }}
            onDelete={() => {}}
            onToggleVisible={() => {}}
            onDirtyChange={(d) => setDirty(0, d)}
          />
        )}

        {items.map((item) => (
          <AnnouncementCard
            key={item.id}
            item={item}
            onSave={handleSave}
            onDelete={() => setDeleting(item.id)}
            onToggleVisible={() => handleToggleVisible(item)}
            onDirtyChange={(d) => setDirty(item.id, d)}
          />
        ))}

        {loading && items.length === 0 && !creatingNew && (
          <div className="py-20 text-center text-[#999] text-[14px]">
            로딩 중...
          </div>
        )}

        {!loading && items.length === 0 && !creatingNew && (
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

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}

type CardProps = {
  item: Announcement;
  isNew?: boolean;
  onSave: (item: Announcement) => void;
  onDelete: () => void;
  onCancel?: () => void;
  onToggleVisible: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

function AnnouncementCard({
  item,
  isNew = false,
  onSave,
  onDelete,
  onCancel,
  onToggleVisible,
  onDirtyChange,
}: CardProps) {
  const [draft, setDraft] = useState<Announcement>(item);
  const [activeField, setActiveField] = useState<"title" | "content" | null>(
    null,
  );

  useEffect(() => {
    setDraft(item);
  }, [item]);

  const isDirty =
    draft.title !== item.title ||
    draft.content !== item.content ||
    draft.dismiss_duration !== item.dismiss_duration ||
    draft.title_style !== item.title_style ||
    draft.content_style !== item.content_style;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const updateField = (field: "title" | "content", value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const titleStyle: TextStyle = parseStyle(draft.title_style);
  const contentStyle: TextStyle = parseStyle(draft.content_style);
  const activeStyle = activeField === "title" ? titleStyle : contentStyle;
  const activeBold = activeStyle.fontWeight === "bold";

  const toggleBoldActive = () => {
    if (!activeField) return;
    const key = activeField === "title" ? "title_style" : "content_style";
    setDraft((prev) => {
      const cur = parseStyle(prev[key] as string);
      const next = cur.fontWeight === "bold" ? undefined : "bold";
      return {
        ...prev,
        [key]: JSON.stringify({ ...cur, fontWeight: next }),
      };
    });
  };

  const appendBulletActive = () => {
    if (!activeField) return;
    setDraft((prev) => {
      const text = prev[activeField];
      const lines = text.split("\n");
      const nonEmpty = lines.filter((l) => l.length > 0);
      let updated: string;
      if (nonEmpty.length === 0) {
        updated = "• ";
      } else {
        const allBulleted = nonEmpty.every((l) => l.startsWith("• "));
        updated = lines
          .map((l) => {
            if (l.length === 0) return l;
            if (allBulleted) return l.startsWith("• ") ? l.slice(2) : l;
            return l.startsWith("• ") ? l : "• " + l;
          })
          .join("\n");
      }
      return { ...prev, [activeField]: updated };
    });
  };

  const canSave = isDirty && draft.content.trim().length > 0;

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col md:flex-row gap-4 transition-colors border border-[#111] hover:shadow-sm">
      <div className="flex-1 space-y-2 min-w-0">
        <textarea
          value={draft.title}
          onChange={(e) => updateField("title", e.target.value)}
          onFocus={() => setActiveField("title")}
          rows={1}
          placeholder="제목 (엔터키로 줄바꿈)"
          aria-label="팝업 제목"
          className="w-full border border-[#111] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#111] transition-colors resize-y"
          style={styleToCss(titleStyle)}
        />
        <textarea
          value={draft.content}
          onChange={(e) => updateField("content", e.target.value)}
          onFocus={() => setActiveField("content")}
          rows={4}
          placeholder="팝업 내용"
          aria-label="팝업 내용"
          className="w-full border border-[#111] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#111] transition-colors resize-y"
          style={styleToCss(contentStyle)}
        />
      </div>

      <div className="md:w-[160px] flex flex-col gap-2 shrink-0 border border-[#111] rounded-lg p-2">
        {!isNew && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] text-[#666]">
              {item.is_visible ? "공개" : "비공개"}
            </span>
            <button
              type="button"
              onClick={onToggleVisible}
              aria-label={item.is_visible ? "비공개로 전환" : "공개로 전환"}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                item.is_visible ? "bg-[#111]" : "bg-[#DDD]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  item.is_visible ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        )}

        <div className="flex gap-1">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleBoldActive}
            disabled={!activeField}
            className={`flex-1 h-8 rounded-md text-[13px] font-bold border transition-colors disabled:opacity-30 disabled:hover:border-[#DDD] ${
              activeField && activeBold
                ? "bg-[#111] text-white border-[#111]"
                : "bg-white border-[#DDD] hover:border-[#111]"
            }`}
            title="굵게"
            aria-label="굵게"
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={appendBulletActive}
            disabled={!activeField}
            className="flex-1 h-8 border border-[#DDD] rounded-md text-[13px] bg-white hover:border-[#111] transition-colors disabled:opacity-30 disabled:hover:border-[#DDD]"
            title="글머리기호"
            aria-label="글머리기호"
          >
            •
          </button>
        </div>

        <select
          value={draft.dismiss_duration || "none"}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, dismiss_duration: e.target.value }))
          }
          aria-label="팝업 닫기 설정"
          className="w-full border border-[#DDD] rounded-md px-2 py-1.5 text-[11px] outline-none focus:border-[#111]"
        >
          {DISMISS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="h-px bg-[#DDD] my-1" />

        <div className="flex gap-1 mt-auto">
          <button
            type="button"
            onClick={() => onSave(draft)}
            disabled={!canSave}
            className="flex-1 h-8 bg-[#111] text-white rounded text-[12px] font-semibold hover:bg-[#333] disabled:opacity-30 transition-colors"
          >
            저장
          </button>
          {isNew ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-8 border border-[#111] text-[#666] rounded text-[12px] hover:bg-[#F7F7F7] transition-colors"
            >
              취소
            </button>
          ) : (
            <button
              type="button"
              onClick={onDelete}
              className="flex-1 h-8 border border-red-200 text-red-500 rounded text-[12px] hover:bg-red-50 transition-colors"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
