"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ImageEditor } from "@/components/admin/image-editor";
import { WatermarkEditor } from "@/components/admin/watermark-editor";
import { Toast } from "@/components/admin/toast";

interface Case {
  id: number;
  before_image: string;
  after_image: string;
  before_image_wm: string;
  after_image_wm: string;
  title: string;
  sort_order: number;
  show_on_main: number;
}

type EditorTarget = {
  caseId: number;
  field: "before_image" | "after_image";
  src: string;
};

function getToken() {
  return sessionStorage.getItem("admin_token") || "";
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function uploadFile(file: Blob, name?: string): Promise<string> {
  const fd = new FormData();
  fd.append("files", file, name || "image.jpg");
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  const data = await res.json();
  return data.urls[0];
}

function ImageSlot({
  src,
  wmSrc,
  label,
  onEdit,
  onWatermark,
  onUpload,
}: {
  src: string | null;
  wmSrc: string | null;
  label: string;
  onEdit: () => void;
  onWatermark: () => void;
  onUpload: () => void;
}) {
  if (!src) {
    return (
      <button
        onClick={onUpload}
        className="w-full aspect-[4/3] border-2 border-dashed border-[#DDD] rounded-xl flex flex-col items-center justify-center gap-2 text-[#BBB] hover:border-[#999] hover:text-[#666] transition-all"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17,8 12,3 7,8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span className="text-[12px]">{label} 업로드</span>
      </button>
    );
  }

  return (
    <div className="relative group rounded-xl overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={wmSrc || src}
        alt={label}
        className="w-full aspect-[4/3] object-cover"
      />
      {wmSrc && (
        <span className="absolute top-2 right-2 bg-[#111]/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
          WM
        </span>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="bg-white text-[#111] rounded-lg px-3 py-1.5 text-[12px] font-medium shadow-sm hover:bg-[#F7F7F7] transition-all"
        >
          편집
        </button>
        <button
          onClick={onWatermark}
          className="bg-white text-[#111] rounded-lg px-3 py-1.5 text-[12px] font-medium shadow-sm hover:bg-[#F7F7F7] transition-all"
        >
          워터마크
        </button>
        <button
          onClick={onUpload}
          className="bg-white text-[#111] rounded-lg px-3 py-1.5 text-[12px] font-medium shadow-sm hover:bg-[#F7F7F7] transition-all"
        >
          교체
        </button>
      </div>
      <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-white/80 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function SortableCard({
  c,
  onEdit,
  onWatermark,
  onUpload,
  onToggleMain,
  onDelete,
  onTitleChange,
  onTitleBlur,
}: {
  c: Case;
  onEdit: (target: EditorTarget) => void;
  onWatermark: (target: EditorTarget) => void;
  onUpload: (caseId: number, field: "before_image" | "after_image") => void;
  onToggleMain: (id: number, val: number) => void;
  onDelete: (id: number) => void;
  onTitleChange: (id: number, title: string) => void;
  onTitleBlur: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: c.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const imgSrc = (path: string) => path || null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-[#EBEBEB] rounded-2xl p-5 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-4 mb-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[#CCC] hover:text-[#666] transition-colors shrink-0"
          title="드래그하여 순서 변경"
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.2" />
            <circle cx="11" cy="3" r="1.2" />
            <circle cx="5" cy="8" r="1.2" />
            <circle cx="11" cy="8" r="1.2" />
            <circle cx="5" cy="13" r="1.2" />
            <circle cx="11" cy="13" r="1.2" />
          </svg>
        </button>
        <input
          type="text"
          value={c.title}
          onChange={(e) => onTitleChange(c.id, e.target.value)}
          onBlur={() => onTitleBlur(c.id)}
          placeholder="사례 제목을 입력하세요"
          className="flex-1 text-[15px] font-medium text-[#111] outline-none border-b border-transparent focus:border-[#DDD] pb-1 transition-all"
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggleMain(c.id, c.show_on_main ? 0 : 1)}
            className={`relative w-10 h-[22px] rounded-full transition-colors ${
              c.show_on_main ? "bg-[#111]" : "bg-[#DDD]"
            }`}
            title={c.show_on_main ? "메인 노출 중" : "메인 미노출"}
          >
            <span
              className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${
                c.show_on_main ? "translate-x-[18px]" : ""
              }`}
            />
          </button>
          <button
            onClick={() => onDelete(c.id)}
            className="p-1.5 rounded-lg text-[#CCC] hover:text-red-500 hover:bg-red-50 transition-all"
            title="삭제"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(["before_image", "after_image"] as const).map((field) => (
          <ImageSlot
            key={field}
            src={imgSrc(c[field])}
            wmSrc={imgSrc(c[`${field}_wm` as keyof Case] as string)}
            label={field === "before_image" ? "Before" : "After"}
            onEdit={() => onEdit({ caseId: c.id, field, src: c[field] })}
            onWatermark={() =>
              onWatermark({ caseId: c.id, field, src: c[field] })
            }
            onUpload={() => onUpload(c.id, field)}
          />
        ))}
      </div>
    </div>
  );
}

export default function RemodelingAdminPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [toast, setToast] = useState("");
  const [editTarget, setEditTarget] = useState<EditorTarget | null>(null);
  const [wmTarget, setWmTarget] = useState<EditorTarget | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const load = useCallback(() => {
    fetch("/api/admin/remodeling", { headers: getHeaders() })
      .then((r) => r.json())
      .then(setCases);
  }, []);

  useEffect(load, [load]);

  const save = async (c: Partial<Case> & { id: number }) => {
    await fetch("/api/admin/remodeling", {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(c),
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = cases.findIndex((c) => c.id === active.id);
    const newIdx = cases.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(cases, oldIdx, newIdx);
    setCases(reordered);
    for (let i = 0; i < reordered.length; i++) {
      await save({ id: reordered[i].id, sort_order: i + 1 } as Case);
    }
    flash("순서가 변경되었습니다");
  };

  const handleAdd = async () => {
    await fetch("/api/admin/remodeling", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title: "", sort_order: cases.length + 1 }),
    });
    load();
    flash("새 사례가 추가되었습니다");
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/admin/remodeling", {
      method: "DELETE",
      headers: getHeaders(),
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    load();
    flash("삭제되었습니다");
  };

  const handleUpload = (
    caseId: number,
    field: "before_image" | "after_image",
  ) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const files = input.files;
      if (!files?.length) return;
      const url = await uploadFile(files[0]);
      await save({ id: caseId, [field]: url } as unknown as Case);
      load();
      flash("업로드 완료");
    };
    input.click();
  };

  const handleTitleChange = (id: number, title: string) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  };

  const handleTitleBlur = async (id: number) => {
    const c = cases.find((c) => c.id === id);
    if (c) await save({ id, title: c.title } as Case);
  };

  const handleToggleMain = async (id: number, val: number) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, show_on_main: val } : c)),
    );
    await save({ id, show_on_main: val } as Case);
  };

  const handleEditorSave = async (blob: Blob) => {
    if (!editTarget) return;
    const url = await uploadFile(blob, "edited.jpg");
    await save({
      id: editTarget.caseId,
      [editTarget.field]: url,
    } as unknown as Case);
    setEditTarget(null);
    load();
    flash("편집이 저장되었습니다");
  };

  const handleWatermarkSave = async (blob: Blob) => {
    if (!wmTarget) return;
    const url = await uploadFile(blob, "watermarked.jpg");
    await save({
      id: wmTarget.caseId,
      [`${wmTarget.field}_wm`]: url,
    } as unknown as Case);
    setWmTarget(null);
    load();
    flash("워터마크가 적용되었습니다");
  };

  const flash = (m: string) => setToast(m);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[26px] font-bold text-[#111] tracking-tight">
            리모델링 사례
          </h1>
          <p className="mt-1 text-[14px] text-[#888]">
            Before/After 사례를 관리합니다
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-[#111] text-white rounded-xl px-5 py-2.5 text-[14px] font-semibold hover:bg-[#333] active:scale-[0.98] transition-all"
        >
          + 새 사례
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={cases.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {cases.map((c) => (
              <SortableCard
                key={c.id}
                c={c}
                onEdit={setEditTarget}
                onWatermark={setWmTarget}
                onUpload={handleUpload}
                onToggleMain={handleToggleMain}
                onDelete={(id) => setDeleting(id)}
                onTitleChange={handleTitleChange}
                onTitleBlur={handleTitleBlur}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {cases.length === 0 && (
        <div className="bg-white border border-[#EBEBEB] rounded-2xl py-20 text-center">
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
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-[#999]">
            등록된 사례가 없습니다
          </p>
          <p className="mt-1 text-[13px] text-[#CCC]">
            새 사례를 추가하고 Before/After 사진을 업로드하세요
          </p>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleting !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-6 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3,6 5,6 21,6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <h3 className="text-[17px] font-bold text-[#111]">
                사례를 삭제하시겠습니까?
              </h3>
              <p className="mt-2 text-[13px] text-[#888]">
                삭제된 사례와 이미지는 복구할 수 없습니다
              </p>
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

      {editTarget && (
        <ImageEditor
          src={editTarget.src}
          onSave={handleEditorSave}
          onCancel={() => setEditTarget(null)}
        />
      )}

      {wmTarget && (
        <WatermarkEditor
          src={wmTarget.src}
          onSave={handleWatermarkSave}
          onCancel={() => setWmTarget(null)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
