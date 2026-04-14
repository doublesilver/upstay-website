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

function SortableRow({
  c,
  onEdit,
  onWatermark,
  onUpload,
  onToggleMain,
  onDelete,
  onTitleChange,
}: {
  c: Case;
  onEdit: (target: EditorTarget) => void;
  onWatermark: (target: EditorTarget) => void;
  onUpload: (caseId: number, field: "before_image" | "after_image") => void;
  onToggleMain: (id: number, val: number) => void;
  onDelete: (id: number) => void;
  onTitleChange: (id: number, title: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: c.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const imgSrc = (path: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return path;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-[#E5E7EB] rounded-lg p-4 flex gap-4 items-start"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-2 cursor-grab active:cursor-grabbing text-[#9CA3AF] hover:text-[#111] shrink-0"
        title="드래그하여 순서 변경"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>

      <div className="flex-1 space-y-3">
        <input
          type="text"
          value={c.title}
          onChange={(e) => onTitleChange(c.id, e.target.value)}
          placeholder="사례 제목"
          className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-[13px] outline-none focus:border-[#111]"
        />

        <div className="grid grid-cols-2 gap-3">
          {(["before_image", "after_image"] as const).map((field) => {
            const src = imgSrc(c[field]);
            const wmSrc = imgSrc(c[`${field}_wm` as keyof Case] as string);
            const label = field === "before_image" ? "BEFORE" : "AFTER";
            return (
              <div key={field}>
                <p className="text-[11px] font-medium text-[#6B7280] mb-1">
                  {label}
                </p>
                {src ? (
                  <div className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={wmSrc || src}
                      alt={label}
                      className="w-full aspect-[4/3] object-cover rounded border border-[#E5E7EB]"
                    />
                    {wmSrc && (
                      <span className="absolute top-1 right-1 bg-[#111] text-white text-[9px] px-1.5 py-0.5 rounded">
                        WM
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onEdit({ caseId: c.id, field, src })}
                        className="bg-white text-[#111] rounded px-2 py-1 text-[11px] font-medium"
                      >
                        편집
                      </button>
                      <button
                        onClick={() =>
                          onWatermark({ caseId: c.id, field, src })
                        }
                        className="bg-white text-[#111] rounded px-2 py-1 text-[11px] font-medium"
                      >
                        워터마크
                      </button>
                      <button
                        onClick={() => onUpload(c.id, field)}
                        className="bg-white text-[#111] rounded px-2 py-1 text-[11px] font-medium"
                      >
                        교체
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onUpload(c.id, field)}
                    className="w-full aspect-[4/3] border-2 border-dashed border-[#D1D5DB] rounded flex items-center justify-center text-[12px] text-[#9CA3AF] hover:border-[#111] hover:text-[#111] transition-colors"
                  >
                    + 사진 업로드
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[12px] text-[#6B7280]">
            <input
              type="checkbox"
              checked={c.show_on_main === 1}
              onChange={(e) => onToggleMain(c.id, e.target.checked ? 1 : 0)}
            />
            메인 노출
          </label>
          <button
            onClick={() => onDelete(c.id)}
            className="text-[12px] text-red-400 hover:text-red-600"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RemodelingAdminPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [msg, setMsg] = useState("");
  const [editTarget, setEditTarget] = useState<EditorTarget | null>(null);
  const [wmTarget, setWmTarget] = useState<EditorTarget | null>(null);

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
    flash("순서 저장됨");
  };

  const handleAdd = async () => {
    await fetch("/api/admin/remodeling", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title: "", sort_order: cases.length + 1 }),
    });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch("/api/admin/remodeling", {
      method: "DELETE",
      headers: getHeaders(),
      body: JSON.stringify({ id }),
    });
    load();
  };

  const handleUpload = (
    caseId: number,
    field: "before_image" | "after_image",
  ) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      const files = input.files;
      if (!files || files.length === 0) return;
      const url = await uploadFile(files[0]);
      await save({ id: caseId, [field]: url } as unknown as Case);
      load();
      flash("업로드 완료");
    };
    input.click();
  };

  const handleTitleChange = async (id: number, title: string) => {
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
    flash("편집 저장됨");
  };

  const handleWatermarkSave = async (blob: Blob) => {
    if (!wmTarget) return;
    const url = await uploadFile(blob, "watermarked.jpg");
    const wmField = `${wmTarget.field}_wm`;
    await save({ id: wmTarget.caseId, [wmField]: url } as unknown as Case);
    setWmTarget(null);
    load();
    flash("워터마크 적용됨");
  };

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-bold text-[#111]">
          리모델링 사례 관리
        </h1>
        <button
          onClick={handleAdd}
          className="bg-[#111] text-white rounded px-4 py-2 text-[13px] font-medium hover:bg-[#333]"
        >
          + 새 사례
        </button>
      </div>

      {msg && <p className="text-[13px] text-green-600 mb-4">{msg}</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={cases.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {cases.map((c) => (
              <SortableRow
                key={c.id}
                c={c}
                onEdit={setEditTarget}
                onWatermark={setWmTarget}
                onUpload={handleUpload}
                onToggleMain={handleToggleMain}
                onDelete={handleDelete}
                onTitleChange={handleTitleChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {cases.length === 0 && (
        <div className="text-center py-12 text-[#6B7280] text-[14px]">
          등록된 사례가 없습니다. &quot;+ 새 사례&quot; 버튼으로 추가하세요.
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
    </div>
  );
}
