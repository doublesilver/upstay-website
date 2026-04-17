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
import {
  Upload,
  SquarePen,
  CheckSquare,
  Trash,
  ImageOff,
  GripVertical,
  Plus,
} from "lucide-react";
import { ImageEditModal } from "@/components/admin/image-edit-modal";
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

async function uploadFile(file: Blob): Promise<string> {
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
  checked,
  onToggleCheck,
  onSetPrimary,
}: {
  img: CaseImage;
  isPrimary: boolean;
  checked: boolean;
  onToggleCheck: () => void;
  onSetPrimary: () => void;
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
      {...attributes}
      {...listeners}
      className={`relative group w-[120px] h-[90px] rounded-lg overflow-hidden shrink-0 border transition-all cursor-grab active:cursor-grabbing touch-none ${
        checked ? "border-[#111] ring-2 ring-[#111]" : "border-[#E5E5E5]"
      }`}
    >
      {img.image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.image_url_wm || img.image_url}
            alt=""
            draggable={false}
            className="w-full h-full object-cover pointer-events-none select-none"
          />
          {img.image_url_wm && (
            <span className="absolute bottom-1 left-1 bg-[#111]/70 text-white text-[8px] px-1 py-0.5 rounded pointer-events-none">
              WM
            </span>
          )}
        </>
      ) : (
        <div className="w-full h-full bg-[#F5F5F5] flex items-center justify-center text-[#CCC] pointer-events-none">
          <ImageOff size={20} />
        </div>
      )}

      <span
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCheck();
        }}
        className={`absolute top-1 left-1 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer z-10 transition-opacity ${
          checked
            ? "bg-[#111] border-[#111] text-white opacity-100"
            : "bg-white/90 border-[#DDD] opacity-0 group-hover:opacity-100"
        }`}
      >
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>

      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSetPrimary();
        }}
        className={`absolute top-1 right-1 text-[14px] z-10 transition-opacity ${
          isPrimary
            ? "text-yellow-400 drop-shadow opacity-100"
            : "text-white/80 opacity-0 group-hover:opacity-100 hover:text-yellow-300"
        }`}
        title={isPrimary ? "대표 이미지" : "대표로 설정"}
      >
        ★
      </button>
    </div>
  );
}

function ToolbarButton({
  onClick,
  icon,
  label,
  disabled,
  tone,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  tone?: "default" | "danger" | "active";
}) {
  const cls =
    tone === "danger"
      ? "border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
      : tone === "active"
        ? "border-[#111] bg-[#111] text-white"
        : "border-[#DDD] text-[#555] hover:text-[#111] hover:border-[#999]";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 text-[12px] border rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ImageSection({
  caseId,
  type,
  images,
  uploading,
  checkedIds,
  onOpenEdit,
  onToggleCheck,
  onBulkUpload,
  onBulkDeleteAll,
  onDeleteSelected,
  onSetPrimary,
  onReorder,
}: {
  caseId: number;
  type: "before" | "after";
  images: CaseImage[];
  uploading?: boolean;
  checkedIds: Set<number>;
  onOpenEdit: (caseId: number, type: "before" | "after") => void;
  onToggleCheck: (imageId: number) => void;
  onBulkUpload: (
    caseId: number,
    type: "before" | "after",
    files: FileList,
  ) => void;
  onBulkDeleteAll: (caseId: number, type: "before" | "after") => void;
  onDeleteSelected: (caseId: number, type: "before" | "after") => void;
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

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <ToolbarButton
          onClick={() => fileRef.current?.click()}
          icon={<Upload size={14} />}
          label={uploading ? "업로드 중..." : "업로드"}
          disabled={uploading}
        />
        <ToolbarButton
          onClick={() => onOpenEdit(caseId, type)}
          icon={<SquarePen size={14} />}
          label="편집"
          disabled={images.length === 0}
        />
        <ToolbarButton
          onClick={() => onDeleteSelected(caseId, type)}
          icon={<CheckSquare size={14} />}
          label={`선택 삭제${checkedIds.size > 0 ? ` (${checkedIds.size})` : ""}`}
          disabled={checkedIds.size === 0}
          tone="danger"
        />
        <ToolbarButton
          onClick={() => onBulkDeleteAll(caseId, type)}
          icon={<Trash size={14} />}
          label="전체 삭제"
          disabled={images.length === 0}
          tone="danger"
        />
        <span className="ml-auto text-[12px] text-[#666] font-medium">
          {label} <span className="text-[#BBB]">·</span>{" "}
          <span className="text-[#111]">{images.length}장</span>
        </span>
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

      <div className="border border-[#DDD] rounded-lg p-3 bg-[#FAFAFA]">
        {images.length === 0 ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-[#DDD] rounded-xl text-[13px] text-[#BBB] hover:border-[#999] hover:text-[#666] transition-all bg-white"
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
              <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
                {images.map((img) => (
                  <SortableThumb
                    key={img.id}
                    img={img}
                    isPrimary={img.match_order === 0}
                    checked={checkedIds.has(img.id)}
                    onToggleCheck={() => onToggleCheck(img.id)}
                    onSetPrimary={() => onSetPrimary(caseId, img.id, type)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

function SortableCase({
  c,
  uploading,
  getChecked,
  onOpenEdit,
  onToggleCheck,
  onToggleMain,
  onDelete,
  onTitleChange,
  onRegister,
  onBulkUpload,
  onBulkDeleteAll,
  onDeleteSelected,
  onSetPrimary,
  onReorderImages,
}: {
  c: Case;
  uploading?: boolean;
  getChecked: (type: "before" | "after") => Set<number>;
  onOpenEdit: (caseId: number, type: "before" | "after") => void;
  onToggleCheck: (
    caseId: number,
    type: "before" | "after",
    imageId: number,
  ) => void;
  onToggleMain: (id: number, val: number) => void;
  onDelete: (id: number) => void;
  onTitleChange: (id: number, title: string) => void;
  onRegister: (id: number) => void;
  onBulkUpload: (
    caseId: number,
    type: "before" | "after",
    files: FileList,
  ) => void;
  onBulkDeleteAll: (caseId: number, type: "before" | "after") => void;
  onDeleteSelected: (caseId: number, type: "before" | "after") => void;
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
      <div className="px-5 pt-5 pb-5 space-y-4">
        {(["before", "after"] as const).map((t) => (
          <ImageSection
            key={t}
            caseId={c.id}
            type={t}
            images={t === "before" ? beforeImages : afterImages}
            uploading={uploading}
            checkedIds={getChecked(t)}
            onOpenEdit={onOpenEdit}
            onToggleCheck={(imgId) => onToggleCheck(c.id, t, imgId)}
            onBulkUpload={onBulkUpload}
            onBulkDeleteAll={onBulkDeleteAll}
            onDeleteSelected={onDeleteSelected}
            onSetPrimary={onSetPrimary}
            onReorder={onReorderImages}
          />
        ))}

        <div className="flex items-center gap-3">
          <label className="text-[13px] font-medium text-[#333] shrink-0">
            내용
          </label>
          <input
            type="text"
            value={c.title}
            onChange={(e) => onTitleChange(c.id, e.target.value)}
            placeholder="설명을 입력해 주세요"
            className="flex-1 text-[14px] text-[#111] outline-none border border-[#DDD] rounded-lg px-3 py-2 focus:border-[#999] transition-all placeholder:text-[#111]/40"
          />
        </div>
      </div>

      <div className="px-5 py-3 border-t border-[#F0F0F0] bg-[#FAFAFA] flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[#999] hover:text-[#111] transition-colors shrink-0 p-1"
          title="드래그하여 순서 변경"
        >
          <GripVertical size={18} />
        </button>
        <button
          onClick={() => onDelete(c.id)}
          className="ml-auto px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-[#666] border border-[#DDD] hover:border-[#999] hover:text-[#111] transition-all"
        >
          창삭제
        </button>
        {([1, 2, 3] as const).map((val) => {
          const active = c.show_on_main === val;
          return (
            <button
              key={val}
              onClick={() => onToggleMain(c.id, active ? 0 : val)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                active
                  ? "bg-[#111] text-white border border-[#111]"
                  : "bg-white text-[#666] border border-[#DDD] hover:border-[#999] hover:text-[#111]"
              }`}
            >
              메인{val}
            </button>
          );
        })}
        <button
          onClick={() => onRegister(c.id)}
          className="bg-[#111] text-white rounded-lg px-4 py-1.5 text-[12px] font-semibold hover:bg-[#333] active:scale-[0.98] transition-all"
        >
          저장
        </button>
      </div>
    </div>
  );
}

export default function RemodelingAdminPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [toast, setToast] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editorSection, setEditorSection] = useState<{
    caseId: number;
    type: "before" | "after";
  } | null>(null);

  const [checkedMap, setCheckedMap] = useState<Map<string, Set<number>>>(
    new Map(),
  );
  const sectionKey = (caseId: number, type: "before" | "after") =>
    `${type}-${caseId}`;

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

  const toggleCheck = (
    caseId: number,
    type: "before" | "after",
    imageId: number,
  ) => {
    const k = sectionKey(caseId, type);
    setCheckedMap((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(k) ?? []);
      if (set.has(imageId)) set.delete(imageId);
      else set.add(imageId);
      next.set(k, set);
      return next;
    });
  };

  const clearSectionChecks = (caseId: number, type: "before" | "after") => {
    setCheckedMap((p) => {
      const n = new Map(p);
      n.delete(sectionKey(caseId, type));
      return n;
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
      await apiFetch("/api/admin/remodeling", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title: "",
          sort_order: cases.length + 1,
          show_on_main: 0,
        }),
      });
      load();
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

  const handleToggleMain = (id: number, val: number) => {
    setCases((prev) =>
      prev.map((c) => {
        if (val >= 1 && val <= 3 && c.show_on_main === val && c.id !== id) {
          return { ...c, show_on_main: 0 };
        }
        if (c.id === id) return { ...c, show_on_main: val };
        return c;
      }),
    );
  };

  const handleTitleChange = (id: number, title: string) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  };

  const handleRegister = async (id: number) => {
    const c = cases.find((c) => c.id === id);
    if (!c) return;
    const targets = cases.filter(
      (x) =>
        x.id === id ||
        (c.show_on_main >= 1 &&
          c.show_on_main <= 3 &&
          x.show_on_main === c.show_on_main &&
          x.id !== id),
    );
    await Promise.all(
      targets.map((t) =>
        save({ id: t.id, title: t.title, show_on_main: t.show_on_main }),
      ),
    );
    flash("저장되었습니다");
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

  const handleBulkDeleteAll = async (
    caseId: number,
    type: "before" | "after",
  ) => {
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
      clearSectionChecks(caseId, type);
      load();
      flash(`${type.toUpperCase()} 이미지가 모두 삭제되었습니다`);
    } catch {}
  };

  const handleDeleteSelected = async (
    caseId: number,
    type: "before" | "after",
  ) => {
    const ids = Array.from(checkedMap.get(sectionKey(caseId, type)) ?? []);
    if (ids.length === 0) return;
    if (!window.confirm(`선택한 이미지 ${ids.length}장을 삭제하시겠습니까?`))
      return;
    try {
      await Promise.all(
        ids.map((imageId) =>
          apiFetch("/api/admin/remodeling/images", {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify({ id: imageId, case_id: caseId }),
          }),
        ),
      );
      clearSectionChecks(caseId, type);
      load();
      flash(`${ids.length}장이 삭제되었습니다`);
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

  const editorImages = editorSection
    ? getImagesByType(
        cases.find((c) => c.id === editorSection.caseId)?.images ?? [],
        editorSection.type,
      )
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[26px] font-bold text-[#111] tracking-tight">
          사진등록
        </h1>
        <button
          onClick={handleAdd}
          className="bg-[#111] text-white rounded-xl px-5 py-2.5 text-[14px] font-semibold hover:bg-[#333] active:scale-[0.98] transition-all inline-flex items-center gap-1.5"
        >
          <Plus size={16} />새 폴더
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
                uploading={uploading}
                getChecked={(t) =>
                  checkedMap.get(sectionKey(c.id, t)) ?? new Set()
                }
                onOpenEdit={(cid, t) =>
                  setEditorSection({ caseId: cid, type: t })
                }
                onToggleCheck={toggleCheck}
                onToggleMain={handleToggleMain}
                onDelete={(id) => setDeleting(id)}
                onTitleChange={handleTitleChange}
                onRegister={handleRegister}
                onBulkUpload={handleBulkUpload}
                onBulkDeleteAll={handleBulkDeleteAll}
                onDeleteSelected={handleDeleteSelected}
                onSetPrimary={handleSetPrimary}
                onReorderImages={handleReorderImages}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {cases.length === 0 && (
        <div className="bg-white border border-[#EBEBEB] rounded-2xl py-20 text-center">
          <div className="w-16 h-16 bg-[#F7F7F7] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#CCC]">
            <ImageOff size={28} />
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
            <div className="px-6 py-8 text-center">
              <h3 className="text-[17px] font-bold text-[#111]">
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

      {editorSection && editorImages.length > 0 && (
        <ImageEditModal
          images={editorImages}
          initialImageId={editorImages[0].id}
          sectionLabel={`${editorSection.type === "before" ? "BEFORE" : "AFTER"} · ${editorImages.length}장`}
          onApplyOne={async (id, blob) => {
            const url = await uploadFile(blob);
            await saveImage({ id, image_url: url });
            load();
            flash("변경사항이 적용되었습니다");
          }}
          onApplyAll={async (ids, getBlob) => {
            flash(`${ids.length}장 처리 중...`);
            let success = 0;
            for (const id of ids) {
              const blob = await getBlob(id);
              if (!blob) continue;
              const url = await uploadFile(blob);
              await saveImage({ id, image_url: url });
              success++;
            }
            load();
            flash(`${success}/${ids.length}장에 전체 적용 완료`);
            setEditorSection(null);
          }}
          onCancel={() => setEditorSection(null)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
