"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ImageEditor } from "@/components/admin/image-editor";
import { WatermarkEditor } from "@/components/admin/watermark-editor";
import { Toast } from "@/components/admin/toast";

interface CaseImage {
  id: number;
  type: "before" | "after";
  match_order: number;
  image_url: string;
  image_url_wm: string;
}

interface Case {
  id: number;
  title: string;
  sort_order: number;
  show_on_main: number;
  created_at: string;
  images: CaseImage[];
}

type EditorTarget = {
  imageId: number;
  caseId: number;
  type: "before" | "after";
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

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    sessionStorage.removeItem("admin_token");
    window.location.href = "/admin";
    throw new Error("Unauthorized");
  }
  return res;
}

async function uploadFiles(files: File[]): Promise<string[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f, f.name));
  try {
    const res = await apiFetch("/api/admin/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.urls || [];
  } catch {
    return [];
  }
}

async function uploadFile(file: Blob, name?: string): Promise<string> {
  const urls = await uploadFiles([file as File]);
  return urls[0] || "";
}

function getImagesByType(images: CaseImage[], type: "before" | "after") {
  return images
    .filter((img) => img.type === type)
    .sort((a, b) => a.match_order - b.match_order);
}

function SortableThumb({
  img,
  isPrimary,
  onSetPrimary,
  onDelete,
  onEdit,
  onWatermark,
}: {
  img: CaseImage;
  isPrimary: boolean;
  onSetPrimary: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onWatermark: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `img-${img.id}` });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group w-[120px] h-[90px] rounded-lg overflow-hidden shrink-0 border border-[#E5E5E5]"
    >
      {img.image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.image_url_wm || img.image_url}
            alt=""
            className="w-full h-full object-cover"
            {...attributes}
            {...listeners}
          />
          {img.image_url_wm && (
            <span className="absolute top-1 left-1 bg-[#111]/70 text-white text-[8px] px-1 py-0.5 rounded">
              WM
            </span>
          )}
        </>
      ) : (
        <div
          className="w-full h-full bg-[#F5F5F5] flex items-center justify-center text-[#CCC]"
          {...attributes}
          {...listeners}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
      )}

      <button
        onClick={onSetPrimary}
        className={`absolute top-1 right-1 text-[14px] transition-all z-10 ${
          isPrimary
            ? "text-yellow-400 drop-shadow"
            : "text-white/60 opacity-0 group-hover:opacity-100 hover:text-yellow-300"
        }`}
        title={isPrimary ? "대표 이미지" : "대표로 설정"}
      >
        ★
      </button>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-center gap-1 pb-1 opacity-0 group-hover:opacity-100">
        {img.image_url && (
          <>
            <button
              onClick={onEdit}
              className="bg-white/90 text-[#333] rounded px-1.5 py-0.5 text-[9px] font-medium hover:bg-white"
            >
              편집
            </button>
            <button
              onClick={onWatermark}
              className="bg-white/90 text-[#333] rounded px-1.5 py-0.5 text-[9px] font-medium hover:bg-white"
            >
              WM
            </button>
          </>
        )}
      </div>

      <button
        onClick={onDelete}
        className="absolute top-1 left-1 w-5 h-5 bg-red-500/80 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all z-10"
        title="삭제"
      >
        ✕
      </button>
    </div>
  );
}

function ImageSection({
  caseId,
  type,
  images,
  uploading,
  onBulkUpload,
  onDeleteImage,
  onBulkDelete,
  onSetPrimary,
  onReorder,
  onEdit,
  onWatermark,
}: {
  caseId: number;
  type: "before" | "after";
  images: CaseImage[];
  uploading?: boolean;
  onBulkUpload: (
    caseId: number,
    type: "before" | "after",
    files: FileList,
  ) => void;
  onDeleteImage: (caseId: number, imageId: number) => void;
  onBulkDelete: (caseId: number, type: "before" | "after") => void;
  onSetPrimary: (
    caseId: number,
    imageId: number,
    type: "before" | "after",
  ) => void;
  onReorder: (
    caseId: number,
    type: "before" | "after",
    oldIndex: number,
    newIndex: number,
  ) => void;
  onEdit: (target: EditorTarget) => void;
  onWatermark: (target: EditorTarget) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = images.map((img) => `img-${img.id}`);
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    if (oldIdx !== -1 && newIdx !== -1) {
      onReorder(caseId, type, oldIdx, newIdx);
    }
  };

  const label = type === "before" ? "BEFORE" : "AFTER";
  const primaryImg = images.find((img) => img.match_order === 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[11px] font-bold tracking-wider text-[#111]">
          {label}
        </span>
        <span className="text-[12px] text-[#999]">{images.length}장</span>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`ml-auto text-[12px] border rounded-lg px-3 py-1 transition-all ${uploading ? "text-[#CCC] border-[#EEE] cursor-not-allowed" : "text-[#666] hover:text-[#111] border-[#DDD] hover:border-[#999]"}`}
        >
          {uploading ? "업로드 중..." : "+ 업로드"}
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              onBulkUpload(caseId, type, e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      <div className="border border-[#DDD] rounded-lg p-3">
        {images.length === 0 ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-6 border-2 border-dashed border-[#DDD] rounded-xl text-[13px] text-[#BBB] hover:border-[#999] hover:text-[#666] transition-all"
          >
            클릭하여 {label} 이미지 업로드
          </button>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => `img-${img.id}`)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img) => (
                  <SortableThumb
                    key={img.id}
                    img={img}
                    isPrimary={img.match_order === 0}
                    onSetPrimary={() => onSetPrimary(caseId, img.id, type)}
                    onDelete={() => onDeleteImage(caseId, img.id)}
                    onEdit={() =>
                      img.image_url &&
                      onEdit({
                        imageId: img.id,
                        caseId,
                        type,
                        src: img.image_url,
                      })
                    }
                    onWatermark={() =>
                      img.image_url &&
                      onWatermark({
                        imageId: img.id,
                        caseId,
                        type,
                        src: img.image_url,
                      })
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      {images.length > 0 && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onBulkDelete(caseId, type)}
            className="text-[11px] text-red-500 hover:text-red-700 transition-colors"
          >
            일괄 삭제
          </button>
          <button
            disabled
            className="text-[11px] text-[#CCC] cursor-not-allowed"
            title="준비 중"
          >
            일괄 워터마크
          </button>
        </div>
      )}
    </div>
  );
}

function SortableCase({
  c,
  expanded,
  uploading,
  onToggleExpand,
  onEdit,
  onWatermark,
  onToggleMain,
  onDelete,
  onTitleChange,
  onTitleBlur,
  onBulkUpload,
  onDeleteImage,
  onBulkDelete,
  onSetPrimary,
  onReorderImages,
}: {
  c: Case;
  expanded: boolean;
  uploading?: boolean;
  onToggleExpand: (id: number) => void;
  onEdit: (target: EditorTarget) => void;
  onWatermark: (target: EditorTarget) => void;
  onToggleMain: (id: number, val: number) => void;
  onDelete: (id: number) => void;
  onTitleChange: (id: number, title: string) => void;
  onTitleBlur: (id: number) => void;
  onBulkUpload: (
    caseId: number,
    type: "before" | "after",
    files: FileList,
  ) => void;
  onDeleteImage: (caseId: number, imageId: number) => void;
  onBulkDelete: (caseId: number, type: "before" | "after") => void;
  onSetPrimary: (
    caseId: number,
    imageId: number,
    type: "before" | "after",
  ) => void;
  onReorderImages: (
    caseId: number,
    type: "before" | "after",
    oldIndex: number,
    newIndex: number,
  ) => void;
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

  const beforeImages = getImagesByType(c.images, "before");
  const afterImages = getImagesByType(c.images, "after");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-3 px-5 py-4">
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

        <button
          onClick={() => onToggleExpand(c.id)}
          className="text-[12px] text-[#999] hover:text-[#333] transition-colors shrink-0"
        >
          {expanded ? "접기" : "보기"}
        </button>

        <span className="flex-1 text-[15px] font-medium text-[#111] truncate">
          {c.title || "설명 없음"}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {(
            [
              [0, "미노출"],
              [1, "메인1"],
              [2, "메인2"],
              [3, "메인3"],
            ] as [number, string][]
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => onToggleMain(c.id, val)}
              className={`px-2 py-0.5 rounded text-[11px] transition-all ${
                c.show_on_main === val
                  ? "bg-[#111] text-white"
                  : "bg-white text-[#999] border border-[#DDD]"
              }`}
            >
              {label}
            </button>
          ))}
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

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#F0F0F0] pt-4">
          <ImageSection
            caseId={c.id}
            type="before"
            images={beforeImages}
            uploading={uploading}
            onBulkUpload={onBulkUpload}
            onDeleteImage={onDeleteImage}
            onBulkDelete={onBulkDelete}
            onSetPrimary={onSetPrimary}
            onReorder={onReorderImages}
            onEdit={onEdit}
            onWatermark={onWatermark}
          />
          <ImageSection
            caseId={c.id}
            type="after"
            images={afterImages}
            uploading={uploading}
            onBulkUpload={onBulkUpload}
            onDeleteImage={onDeleteImage}
            onBulkDelete={onBulkDelete}
            onSetPrimary={onSetPrimary}
            onReorder={onReorderImages}
            onEdit={onEdit}
            onWatermark={onWatermark}
          />
          <textarea
            value={c.title}
            onChange={(e) => onTitleChange(c.id, e.target.value)}
            onBlur={() => onTitleBlur(c.id)}
            placeholder="설명을 입력해 주세요"
            rows={2}
            className="w-full text-[14px] text-[#111] outline-none border border-[#DDD] rounded-lg p-3 resize-none focus:border-[#999] transition-all placeholder:text-[#CCC]"
          />
        </div>
      )}
    </div>
  );
}

export default function RemodelingAdminPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number> | "all">("all");
  const [toast, setToast] = useState("");
  const [editTarget, setEditTarget] = useState<EditorTarget | null>(null);
  const [wmTarget, setWmTarget] = useState<EditorTarget | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const flash = (m: string) => setToast(m);

  const load = useCallback(() => {
    apiFetch("/api/admin/remodeling", { headers: getHeaders() })
      .then((r) => r.json())
      .then(setCases)
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  const save = async (c: Partial<Case> & { id: number }) => {
    try {
      await apiFetch("/api/admin/remodeling", {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(c),
      });
    } catch {}
  };

  const saveImage = async (data: { id: number; [key: string]: unknown }) => {
    try {
      await apiFetch("/api/admin/remodeling/images", {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
    } catch {}
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      if (prev === "all") {
        const all = new Set(cases.map((c) => c.id));
        all.delete(id);
        return all;
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = cases.findIndex((c) => c.id === active.id);
    const newIdx = cases.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(cases, oldIdx, newIdx);
    setCases(reordered);
    try {
      await apiFetch("/api/admin/remodeling/reorder", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          items: reordered.map((c, i) => ({ id: c.id, sort_order: i + 1 })),
        }),
      });
      flash("순서가 변경되었습니다");
    } catch {}
  };

  const handleAdd = async () => {
    try {
      const res = await apiFetch("/api/admin/remodeling", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title: "",
          sort_order: cases.length + 1,
          show_on_main: 0,
        }),
      });
      const { id } = await res.json();
      load();
      setExpandedIds((prev) => {
        const next =
          prev === "all" ? new Set(cases.map((c) => c.id)) : new Set(prev);
        next.add(id);
        return next;
      });
      flash("새 폴더가 추가되었습니다");
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch("/api/admin/remodeling", {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify({ id }),
      });
      setDeleting(null);
      load();
      flash("삭제되었습니다");
    } catch {}
  };

  const handleToggleMain = async (id: number, val: number) => {
    if (val >= 1 && val <= 3) {
      const conflict = cases.find((c) => c.show_on_main === val && c.id !== id);
      if (conflict) {
        const currentCase = cases.find((c) => c.id === id);
        const oldVal = currentCase?.show_on_main || 0;
        setCases((prev) =>
          prev.map((c) => {
            if (c.id === id) return { ...c, show_on_main: val };
            if (c.id === conflict.id) return { ...c, show_on_main: oldVal };
            return c;
          }),
        );
        await save({ id: conflict.id, show_on_main: oldVal });
        await save({ id, show_on_main: val });
        return;
      }
    }
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, show_on_main: val } : c)),
    );
    await save({ id, show_on_main: val });
  };

  const handleTitleChange = (id: number, title: string) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  };

  const handleTitleBlur = async (id: number) => {
    const c = cases.find((c) => c.id === id);
    if (c) await save({ id, title: c.title });
  };

  const handleBulkUpload = async (
    caseId: number,
    type: "before" | "after",
    files: FileList,
  ) => {
    const caseData = cases.find((c) => c.id === caseId);
    const existing = caseData ? getImagesByType(caseData.images, type) : [];
    const maxOrder = existing.reduce(
      (max, img) => Math.max(max, img.match_order),
      0,
    );

    flash(`${files.length}장 업로드 중...`);
    setUploading(true);
    let success = 0;

    try {
      const fileArray = Array.from(files);
      const urls = await uploadFiles(fileArray);

      for (let i = 0; i < urls.length; i++) {
        const nextOrder = maxOrder + i + 1;
        const res = await apiFetch("/api/admin/remodeling/images", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            case_id: caseId,
            type,
            match_order: nextOrder,
            image_url: urls[i],
          }),
        });
        if (res.ok) success++;
      }
    } catch {}

    setUploading(false);
    load();
    flash(`${success}/${files.length}장 업로드 완료`);
  };

  const handleDeleteImage = async (caseId: number, imageId: number) => {
    if (!window.confirm("이 이미지를 삭제하시겠습니까?")) return;
    try {
      await apiFetch("/api/admin/remodeling/images", {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify({ id: imageId, case_id: caseId }),
      });
      load();
      flash("이미지가 삭제되었습니다");
    } catch {}
  };

  const handleBulkDelete = async (caseId: number, type: "before" | "after") => {
    const caseData = cases.find((c) => c.id === caseId);
    if (!caseData) return;
    const imgs = getImagesByType(caseData.images, type);
    if (imgs.length === 0) return;
    if (
      !window.confirm(
        `${type.toUpperCase()} 이미지 ${imgs.length}장을 모두 삭제하시겠습니까?`,
      )
    )
      return;
    try {
      await Promise.all(
        imgs.map((img) =>
          apiFetch("/api/admin/remodeling/images", {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify({ id: img.id, case_id: caseId }),
          }),
        ),
      );
      load();
      flash(`${type.toUpperCase()} 이미지가 모두 삭제되었습니다`);
    } catch {}
  };

  const handleSetPrimary = async (
    caseId: number,
    imageId: number,
    type: "before" | "after",
  ) => {
    const caseData = cases.find((c) => c.id === caseId);
    if (!caseData) return;

    const imgs = getImagesByType(caseData.images, type);
    const currentPrimary = imgs.find((img) => img.match_order === 0);

    if (currentPrimary && currentPrimary.id === imageId) return;

    const items: { id: number; match_order: number }[] = [];
    let order = 1;
    for (const img of imgs) {
      if (img.id === imageId) {
        items.push({ id: img.id, match_order: 0 });
      } else {
        items.push({ id: img.id, match_order: order });
        order++;
      }
    }
    try {
      await apiFetch("/api/admin/remodeling/images/reorder", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ items }),
      });
      load();
      flash("대표 이미지가 설정되었습니다");
    } catch {}
  };

  const handleReorderImages = async (
    caseId: number,
    type: "before" | "after",
    oldIndex: number,
    newIndex: number,
  ) => {
    const caseData = cases.find((c) => c.id === caseId);
    if (!caseData) return;
    const typeImgs = getImagesByType(caseData.images, type);
    const reorderedImages = arrayMove(typeImgs, oldIndex, newIndex);

    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const otherImgs = c.images.filter((img) => img.type !== type);
        const updatedImgs = reorderedImages.map((img, i) => ({
          ...img,
          match_order: i,
        }));
        return { ...c, images: [...otherImgs, ...updatedImgs] };
      }),
    );

    try {
      await apiFetch("/api/admin/remodeling/images/reorder", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          items: reorderedImages.map((img, i) => ({
            id: img.id,
            match_order: i,
          })),
        }),
      });
    } catch {}
  };

  const handleEditorSave = async (blob: Blob) => {
    if (!editTarget) return;
    const url = await uploadFile(blob, "edited.jpg");
    await saveImage({ id: editTarget.imageId, image_url: url });
    setEditTarget(null);
    load();
    flash("편집이 저장되었습니다");
  };

  const handleWatermarkSave = async (blob: Blob) => {
    if (!wmTarget) return;
    const url = await uploadFile(blob, "watermarked.jpg");
    await saveImage({ id: wmTarget.imageId, image_url_wm: url });
    setWmTarget(null);
    load();
    flash("워터마크가 적용되었습니다");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[26px] font-bold text-[#111] tracking-tight">
            사진등록
          </h1>
        </div>
        <button
          onClick={handleAdd}
          className="bg-[#111] text-white rounded-xl px-5 py-2.5 text-[14px] font-semibold hover:bg-[#333] active:scale-[0.98] transition-all"
        >
          + 새폴더
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
              <SortableCase
                key={c.id}
                c={c}
                expanded={expandedIds === "all" || expandedIds.has(c.id)}
                uploading={uploading}
                onToggleExpand={toggleExpand}
                onEdit={setEditTarget}
                onWatermark={setWmTarget}
                onToggleMain={handleToggleMain}
                onDelete={(id) => setDeleting(id)}
                onTitleChange={handleTitleChange}
                onTitleBlur={handleTitleBlur}
                onBulkUpload={handleBulkUpload}
                onDeleteImage={handleDeleteImage}
                onBulkDelete={handleBulkDelete}
                onSetPrimary={handleSetPrimary}
                onReorderImages={handleReorderImages}
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
