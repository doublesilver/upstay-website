"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// TODO: DndContext, SortableContext 등 dnd-kit을 next/dynamic으로 지연 로드하면
//       관리자 초기 번들 크기를 줄일 수 있음. 현재는 직접 import 유지.
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckSquare,
  GripVertical,
  ImageOff,
  Plus,
  SquarePen,
  Trash,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { ImageEditModal } from "@/components/admin/image-edit-modal";
import { Toast } from "@/components/admin/toast";
import { apiFetch, errMsg, getHeaders } from "@/lib/admin-api";

interface CaseImage {
  id: number;
  type: "before" | "after";
  match_order: number;
  is_starred: number;
  slot_position: number;
  image_url: string;
  image_url_wm: string;
}

interface RemodelingCase {
  id: number;
  title: string;
  sort_order: number;
  show_on_main: number;
  created_at: string;
  images: CaseImage[];
}

function getImagesByType(images: CaseImage[], type: "before" | "after") {
  return images
    .filter((img) => img.type === type)
    .sort((a, b) => a.match_order - b.match_order || a.id - b.id);
}

function getImagesForEdit(images: CaseImage[], type: "before" | "after") {
  return images
    .filter((img) => img.type === type)
    .sort((a, b) => a.match_order - b.match_order || a.id - b.id);
}

async function uploadFiles(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file, file.name));

  const res = await apiFetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  return data.urls || [];
}

async function uploadFile(file: Blob) {
  const urls = await uploadFiles([file as File]);
  return urls[0] || "";
}

function ToolbarButton({
  onClick,
  icon,
  label,
  disabled,
  tone = "default",
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
      : "border-[#111] text-[#555] hover:text-[#111] hover:border-[#999]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 text-[12px] border rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${toneClass}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SlotStars({
  image,
  onAssignSlot,
}: {
  image: CaseImage;
  onAssignSlot: (slot: number) => void;
}) {
  const currentSlot = image.slot_position ?? 0;

  const quadrants = [
    { slot: 1, posClass: "top-0 left-0" },
    { slot: 2, posClass: "top-0 right-0" },
    { slot: 3, posClass: "bottom-0 left-0" },
    { slot: 4, posClass: "bottom-0 right-0" },
  ] as const;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {quadrants.map(({ slot, posClass }) => {
        const isActive = currentSlot === slot;
        return (
          <button
            key={slot}
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAssignSlot(isActive ? 0 : slot);
            }}
            className={`absolute ${posClass} w-1/2 h-1/2 pointer-events-auto transition-colors ${
              isActive ? "bg-yellow-400/40" : "hover:bg-black/15"
            }`}
            title={`${slot}번`}
          >
            {isActive && (
              <span className="absolute inset-0 flex items-center justify-center text-[22px] font-black text-yellow-400 drop-shadow">
                ★
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ImageThumb({
  image,
  checked,
  selectionMode,
  eager,
  onOpenImage,
  onToggleCheck,
  onAssignSlot,
}: {
  image: CaseImage;
  checked: boolean;
  selectionMode: boolean;
  eager?: boolean;
  onOpenImage: () => void;
  onToggleCheck: () => void;
  onAssignSlot: (slot: number) => void;
}) {
  return (
    <div
      onClick={selectionMode ? onToggleCheck : onOpenImage}
      className={`relative group w-[120px] h-[90px] rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${
        checked ? "border-[#111] ring-2 ring-[#111]" : "border-[#111]"
      }`}
    >
      {image.image_url ? (
        <>
          <Image
            src={image.image_url_wm || image.image_url}
            alt=""
            width={120}
            height={90}
            sizes="120px"
            quality={70}
            draggable={false}
            loading={eager ? "eager" : "lazy"}
            className="w-full h-full object-cover pointer-events-none select-none"
          />
        </>
      ) : (
        <div className="w-full h-full bg-[#F5F5F5] flex items-center justify-center text-[#CCC] pointer-events-none">
          <ImageOff size={20} />
        </div>
      )}

      {selectionMode && (
        <span
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck();
          }}
          className={`absolute top-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer z-10 ${
            checked
              ? "bg-[#111] border-[#111] text-white"
              : "bg-white/90 border-[#111]"
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
      )}

      {!selectionMode && (
        <SlotStars image={image} onAssignSlot={onAssignSlot} />
      )}
    </div>
  );
}

function ImageSection({
  caseId,
  type,
  images,
  uploading,
  checkedIds,
  selectionMode,
  onOpenEdit,
  onOpenImage,
  onToggleCheck,
  onBulkUpload,
  onBulkDeleteAll,
  onDeleteSelected,
  onToggleSelectionMode,
  onCancelSelectionMode,
  onAssignSlot,
}: {
  caseId: number;
  type: "before" | "after";
  images: CaseImage[];
  uploading?: boolean;
  checkedIds: Set<number>;
  selectionMode: boolean;
  onOpenEdit: (caseId: number, type: "before" | "after") => void;
  onOpenImage: (
    caseId: number,
    type: "before" | "after",
    imageId: number,
  ) => void;
  onToggleCheck: (imageId: number) => void;
  onBulkUpload: (
    caseId: number,
    type: "before" | "after",
    files: FileList,
  ) => void;
  onBulkDeleteAll: (caseId: number, type: "before" | "after") => void;
  onDeleteSelected: (caseId: number, type: "before" | "after") => void;
  onToggleSelectionMode: () => void;
  onCancelSelectionMode: () => void;
  onAssignSlot: (
    caseId: number,
    imageId: number,
    type: "before" | "after",
    slot: number,
  ) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const label = type === "before" ? "BEFORE" : "AFTER";

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {selectionMode ? (
          <>
            <ToolbarButton
              onClick={() => fileRef.current?.click()}
              icon={<Upload size={14} />}
              label={uploading ? "업로드 중.." : "업로드"}
              disabled={true}
            />
            <ToolbarButton
              onClick={() => onOpenEdit(caseId, type)}
              icon={<SquarePen size={14} />}
              label="편집"
              disabled={true}
            />
            <ToolbarButton
              onClick={() => onDeleteSelected(caseId, type)}
              icon={<Trash size={14} />}
              label={`삭제${checkedIds.size > 0 ? ` (${checkedIds.size})` : ""}`}
              disabled={checkedIds.size === 0}
              tone="danger"
            />
            <ToolbarButton
              onClick={onCancelSelectionMode}
              icon={<CheckSquare size={14} />}
              label="취소"
            />
            <ToolbarButton
              onClick={() => onBulkDeleteAll(caseId, type)}
              icon={<Trash size={14} />}
              label="전체 삭제"
              disabled={true}
              tone="danger"
            />
          </>
        ) : (
          <>
            <ToolbarButton
              onClick={() => fileRef.current?.click()}
              icon={<Upload size={14} />}
              label={uploading ? "업로드 중.." : "업로드"}
              disabled={uploading}
            />
            <ToolbarButton
              onClick={() => onOpenEdit(caseId, type)}
              icon={<SquarePen size={14} />}
              label="편집"
              disabled={images.length === 0}
            />
            <ToolbarButton
              onClick={onToggleSelectionMode}
              icon={<CheckSquare size={14} />}
              label="선택 삭제"
              disabled={images.length === 0}
              tone="danger"
            />
            <ToolbarButton
              onClick={() => onBulkDeleteAll(caseId, type)}
              icon={<Trash size={14} />}
              label="전체 삭제"
              disabled={images.length === 0}
              tone="danger"
            />
          </>
        )}
        <span className="ml-auto text-[12px] text-[#666] font-medium">
          {label} <span className="text-[#111]">( {images.length}장 )</span>
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

      <div className="border border-[#111] rounded-lg p-3 bg-[#FAFAFA]">
        {images.length === 0 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-[#111] rounded-xl text-[13px] text-[#BBB] hover:border-[#999] hover:text-[#666] transition-all bg-white"
          >
            클릭하여 {label} 이미지를 업로드해 주세요
          </button>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
            {images.map((image, i) => (
              <ImageThumb
                key={image.id}
                image={image}
                checked={checkedIds.has(image.id)}
                selectionMode={selectionMode}
                eager={i < 8}
                onOpenImage={() => onOpenImage(caseId, type, image.id)}
                onToggleCheck={() => onToggleCheck(image.id)}
                onAssignSlot={(slot) =>
                  onAssignSlot(caseId, image.id, type, slot)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SortableCase({
  item,
  collapsed,
  uploading,
  getChecked,
  isSelectionMode,
  onOpenEdit,
  onOpenImage,
  onToggleCheck,
  onToggleMain,
  onDelete,
  onTitleChange,
  onRegister,
  onBulkUpload,
  onBulkDeleteAll,
  onDeleteSelected,
  onToggleSelectionMode,
  onCancelSelectionMode,
  onAssignSlot,
  onToggleCollapse,
}: {
  item: RemodelingCase;
  collapsed: boolean;
  uploading?: boolean;
  getChecked: (type: "before" | "after") => Set<number>;
  isSelectionMode: (type: "before" | "after") => boolean;
  onOpenEdit: (caseId: number, type: "before" | "after") => void;
  onOpenImage: (
    caseId: number,
    type: "before" | "after",
    imageId: number,
  ) => void;
  onToggleCheck: (
    caseId: number,
    type: "before" | "after",
    imageId: number,
  ) => void;
  onToggleMain: (id: number, value: number) => void;
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
  onToggleSelectionMode: (caseId: number, type: "before" | "after") => void;
  onCancelSelectionMode: (caseId: number, type: "before" | "after") => void;
  onAssignSlot: (
    caseId: number,
    imageId: number,
    type: "before" | "after",
    slot: number,
  ) => void;
  onToggleCollapse: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const beforeImages = getImagesByType(item.images, "before");
  const afterImages = getImagesByType(item.images, "after");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-[#111] rounded-2xl overflow-hidden hover:shadow-sm transition-all"
    >
      {!collapsed && (
        <div className="px-5 pt-5 pb-5 space-y-4">
          <ImageSection
            caseId={item.id}
            type="before"
            images={beforeImages}
            uploading={uploading}
            checkedIds={getChecked("before")}
            selectionMode={isSelectionMode("before")}
            onOpenEdit={onOpenEdit}
            onOpenImage={onOpenImage}
            onToggleCheck={(imageId) =>
              onToggleCheck(item.id, "before", imageId)
            }
            onBulkUpload={onBulkUpload}
            onBulkDeleteAll={onBulkDeleteAll}
            onDeleteSelected={onDeleteSelected}
            onToggleSelectionMode={() =>
              onToggleSelectionMode(item.id, "before")
            }
            onCancelSelectionMode={() =>
              onCancelSelectionMode(item.id, "before")
            }
            onAssignSlot={onAssignSlot}
          />
          <div className="border-t border-[#111]" />
          <ImageSection
            caseId={item.id}
            type="after"
            images={afterImages}
            uploading={uploading}
            checkedIds={getChecked("after")}
            selectionMode={isSelectionMode("after")}
            onOpenEdit={onOpenEdit}
            onOpenImage={onOpenImage}
            onToggleCheck={(imageId) =>
              onToggleCheck(item.id, "after", imageId)
            }
            onBulkUpload={onBulkUpload}
            onBulkDeleteAll={onBulkDeleteAll}
            onDeleteSelected={onDeleteSelected}
            onToggleSelectionMode={() =>
              onToggleSelectionMode(item.id, "after")
            }
            onCancelSelectionMode={() =>
              onCancelSelectionMode(item.id, "after")
            }
            onAssignSlot={onAssignSlot}
          />
          <div className="border-t border-[#111]" />

          <div className="flex items-start gap-3">
            <label className="text-[13px] font-medium text-[#333] shrink-0 pt-1.5">
              설명
            </label>
            <textarea
              value={item.title}
              onChange={(e) => onTitleChange(item.id, e.target.value)}
              placeholder="설명을 입력해 주세요 (엔터키로 줄바꿈)"
              rows={1}
              className="flex-1 text-[14px] text-[#111] outline-none border border-[#111] rounded-lg px-3 py-2 focus:border-[#999] transition-all placeholder:text-[#111]/70 resize-y"
            />
          </div>
        </div>
      )}

      <div className="px-5 py-3 border-t border-[#111] bg-[#FAFAFA] flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[#999] hover:text-[#111] transition-colors shrink-0 p-1"
          title="드래그하여 순서를 변경합니다"
        >
          <GripVertical size={18} />
        </button>

        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="ml-auto px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-[#666] border border-[#111] hover:border-[#999] hover:text-[#111] transition-all"
          >
            보기
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-[#666] border border-[#111] hover:border-[#999] hover:text-[#111] transition-all"
            >
              박스 삭제
            </button>

            {([1, 2, 3] as const).map((value) => {
              const active = item.show_on_main === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onToggleMain(item.id, active ? 0 : value)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    active
                      ? "bg-[#111] text-white border border-[#111]"
                      : "bg-white text-[#666] border border-[#111] hover:border-[#999] hover:text-[#111]"
                  }`}
                >
                  메인{value}
                </button>
              );
            })}

            <button
              type="button"
              onClick={onToggleCollapse}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-[#666] border border-[#111] hover:border-[#999] hover:text-[#111] transition-all"
            >
              접기
            </button>

            <button
              type="button"
              onClick={() => onRegister(item.id)}
              className="ml-auto rounded-lg px-4 py-1.5 text-[12px] font-semibold active:scale-[0.98] transition-all bg-[#111] text-white hover:bg-[#333]"
            >
              저장
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function RemodelingAdminPage() {
  const [cases, setCases] = useState<RemodelingCase[]>([]);
  const [toast, setToast] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editorSection, setEditorSection] = useState<{
    caseId: number;
    type: "before" | "after";
    initialImageId?: number;
  } | null>(null);
  const [checkedMap, setCheckedMap] = useState<Map<string, Set<number>>>(
    new Map(),
  );
  const [selectionSections, setSelectionSections] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedCases, setCollapsedCases] = useState<Set<number>>(new Set());

  const toggleCollapse = (id: number) => {
    setCollapsedCases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sectionKey = (caseId: number, type: "before" | "after") =>
    `${type}-${caseId}`;

  const toggleSelectionMode = (caseId: number, type: "before" | "after") => {
    const key = `${caseId}:${type}`;
    setSelectionSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const cancelSelectionMode = (caseId: number, type: "before" | "after") => {
    const key = `${caseId}:${type}`;
    clearSectionChecks(caseId, type);
    setSelectionSections((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const isSelectionMode = (caseId: number, type: "before" | "after") =>
    selectionSections.has(`${caseId}:${type}`);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const flash = (message: string) => setToast(message);

  const originalTitlesRef = useRef<Map<number, string>>(new Map());

  const load = useCallback(() => {
    apiFetch("/api/admin/remodeling", { headers: getHeaders() })
      .then((r) => r.json())
      .then((rows: RemodelingCase[]) => {
        setCases(rows);
        originalTitlesRef.current = new Map(rows.map((c) => [c.id, c.title]));
      })
      .catch((error) => flash(`불러오기에 실패했습니다: ${errMsg(error)}`))
      .finally(() => setLoading(false));
  }, []);

  const dirtyCaseIds = new Set(
    cases
      .filter((c) => originalTitlesRef.current.get(c.id) !== c.title)
      .map((c) => c.id),
  );

  useEffect(() => {
    if (dirtyCaseIds.size === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyCaseIds.size]);

  useEffect(load, [load]);

  useEffect(() => {
    if (deleting === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleting(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleting]);

  const saveCase = async (item: Partial<RemodelingCase> & { id: number }) => {
    await apiFetch("/api/admin/remodeling", {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
  };

  const saveImage = async (data: { id: number; [key: string]: unknown }) => {
    await apiFetch("/api/admin/remodeling/images", {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  };

  const toggleCheck = (
    caseId: number,
    type: "before" | "after",
    imageId: number,
  ) => {
    const key = sectionKey(caseId, type);
    setCheckedMap((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(key) ?? []);
      if (set.has(imageId)) set.delete(imageId);
      else set.add(imageId);
      next.set(key, set);
      return next;
    });
  };

  const clearSectionChecks = (caseId: number, type: "before" | "after") => {
    setCheckedMap((prev) => {
      const next = new Map(prev);
      next.delete(sectionKey(caseId, type));
      return next;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = cases.findIndex((item) => item.id === active.id);
    const newIndex = cases.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(cases, oldIndex, newIndex);
    setCases(reordered);

    try {
      await apiFetch("/api/admin/remodeling/reorder", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          items: reordered.map((item, index) => ({
            id: item.id,
            sort_order: index + 1,
          })),
        }),
      });
      flash("순서가 변경되었습니다");
      load();
    } catch (error) {
      flash(`순서 변경에 실패했습니다: ${errMsg(error)}`);
      load();
    }
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
      flash("새 박스가 추가되었습니다");
    } catch (error) {
      flash(`추가에 실패했습니다: ${errMsg(error)}`);
    }
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
    } catch (error) {
      flash(`삭제에 실패했습니다: ${errMsg(error)}`);
    }
  };

  const handleToggleMain = (id: number, value: number) => {
    setCases((prev) =>
      prev.map((item) => {
        if (
          value >= 1 &&
          value <= 3 &&
          item.show_on_main === value &&
          item.id !== id
        ) {
          return { ...item, show_on_main: 0 };
        }
        if (item.id === id) return { ...item, show_on_main: value };
        return item;
      }),
    );
  };

  const handleTitleChange = (id: number, title: string) => {
    setCases((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title } : item)),
    );
  };

  const handleRegister = async (id: number) => {
    const current = cases.find((item) => item.id === id);
    if (!current) return;

    const targets = cases.filter(
      (item) =>
        item.id === id ||
        (current.show_on_main >= 1 &&
          current.show_on_main <= 3 &&
          item.show_on_main === current.show_on_main &&
          item.id !== id),
    );

    try {
      await Promise.all(
        targets.map((item) =>
          saveCase({
            id: item.id,
            title: item.title,
            show_on_main: item.show_on_main,
          }),
        ),
      );
      // dirty 해제: 저장된 항목들의 originalTitlesRef 갱신
      targets.forEach((item) => {
        originalTitlesRef.current.set(item.id, item.title);
      });
      // 강제 re-render로 dirtyCaseIds 갱신
      setCases((prev) => [...prev]);
      flash("저장되었습니다");
    } catch (error) {
      flash(`저장에 실패했습니다: ${errMsg(error)}`);
    }
  };

  const handleBulkUpload = async (
    caseId: number,
    type: "before" | "after",
    files: FileList,
  ) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const caseData = cases.find((item) => item.id === caseId);
    const existing = caseData ? getImagesByType(caseData.images, type) : [];
    const maxOrder = existing.reduce(
      (max, image) => Math.max(max, image.match_order),
      0,
    );

    setUploading(true);

    let success = 0;
    let failedReason = "";

    try {
      const urls = await uploadFiles(fileArray);

      const results = await Promise.allSettled(
        urls.map((url: string, index: number) =>
          apiFetch("/api/admin/remodeling/images", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
              case_id: caseId,
              type,
              match_order: maxOrder + index + 1,
              image_url: url,
              is_starred: 0,
            }),
          }),
        ),
      );
      success = results.filter((r) => r.status === "fulfilled").length;
      const firstFail = results.find((r) => r.status === "rejected") as
        | PromiseRejectedResult
        | undefined;
      if (firstFail) failedReason = errMsg(firstFail.reason);
    } catch (error) {
      failedReason = errMsg(error);
    }

    setUploading(false);

    const failed = fileArray.length - success;
    if (success === fileArray.length) {
      flash(`${success}장 업로드되었습니다`);
    } else if (success > 0) {
      flash(
        `${success}장 업로드됨, ${failed}장 실패${failedReason ? ` (${failedReason})` : ""}`,
      );
    } else {
      flash(`업로드 실패${failedReason ? `: ${failedReason}` : ""}`);
    }

    load();
  };

  const handleBulkDeleteAll = async (
    caseId: number,
    type: "before" | "after",
  ) => {
    const caseData = cases.find((item) => item.id === caseId);
    if (!caseData) return;

    const images = getImagesByType(caseData.images, type);
    if (images.length === 0) return;

    if (
      !window.confirm(
        `${type.toUpperCase()} 이미지 ${images.length}장을 모두 삭제하시겠습니까?`,
      )
    ) {
      return;
    }

    try {
      await Promise.all(
        images.map((image) =>
          apiFetch("/api/admin/remodeling/images", {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify({ id: image.id, case_id: caseId }),
          }),
        ),
      );
      clearSectionChecks(caseId, type);
      load();
      flash(`${type.toUpperCase()} 이미지가 모두 삭제되었습니다`);
    } catch (error) {
      flash(`삭제에 실패했습니다: ${errMsg(error)}`);
    }
  };

  const handleDeleteSelected = async (
    caseId: number,
    type: "before" | "after",
  ) => {
    const ids = Array.from(checkedMap.get(sectionKey(caseId, type)) ?? []);
    if (ids.length === 0) return;

    if (!window.confirm(`선택한 이미지 ${ids.length}장을 삭제하시겠습니까?`)) {
      return;
    }

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
      cancelSelectionMode(caseId, type);
      load();
      flash(`${ids.length}장이 삭제되었습니다`);
    } catch (error) {
      flash(`삭제에 실패했습니다: ${errMsg(error)}`);
    }
  };

  const handleAssignSlot = async (
    caseId: number,
    imageId: number,
    type: "before" | "after",
    slot: number,
  ) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        return {
          ...c,
          images: c.images.map((img) => {
            if (img.type !== type) return img;
            if (img.slot_position === slot && img.id !== imageId) {
              return { ...img, slot_position: 0, is_starred: 0 };
            }
            if (img.id === imageId) {
              const newSlot = img.slot_position === slot ? 0 : slot;
              return {
                ...img,
                slot_position: newSlot,
                is_starred: newSlot > 0 ? 1 : 0,
              };
            }
            return img;
          }),
        };
      }),
    );

    try {
      await saveImage({ id: imageId, slot_position: slot });
      load();
    } catch (error) {
      flash(`슬롯 변경에 실패했습니다: ${errMsg(error)}`);
      load();
    }
  };

  const handleReorderImages = async (
    caseId: number,
    type: "before" | "after",
    oldIndex: number,
    newIndex: number,
  ) => {
    const caseData = cases.find((item) => item.id === caseId);
    if (!caseData) return;

    const images = getImagesForEdit(caseData.images, type);
    const reorderedImages = arrayMove(images, oldIndex, newIndex);

    setCases((prev) =>
      prev.map((item) => {
        if (item.id !== caseId) return item;
        const otherImages = item.images.filter((image) => image.type !== type);
        const updatedImages = reorderedImages.map((image, index) => ({
          ...image,
          match_order: index + 1,
        }));
        return { ...item, images: [...otherImages, ...updatedImages] };
      }),
    );

    try {
      await apiFetch("/api/admin/remodeling/images/reorder", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          case_id: caseId,
          type,
          items: reorderedImages.map((image, index) => ({
            id: image.id,
            match_order: index + 1,
          })),
        }),
      });
      flash("이미지 순서가 저장되었습니다");
      load();
    } catch (error) {
      flash(`이미지 순서 저장에 실패했습니다: ${errMsg(error)}`);
      load();
    }
  };

  const editorImages = editorSection
    ? getImagesForEdit(
        cases.find((item) => item.id === editorSection.caseId)?.images ?? [],
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
          type="button"
          onClick={handleAdd}
          className="bg-[#111] text-white rounded-xl px-5 py-2.5 text-[14px] font-semibold hover:bg-[#333] active:scale-[0.98] transition-all inline-flex items-center gap-1.5"
        >
          <Plus size={16} />
          박스 추가
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={cases.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {cases.map((item) => (
              <SortableCase
                key={item.id}
                item={item}
                uploading={uploading}
                getChecked={(type) =>
                  checkedMap.get(sectionKey(item.id, type)) ?? new Set()
                }
                isSelectionMode={(type) => isSelectionMode(item.id, type)}
                onOpenEdit={(caseId, type) =>
                  setEditorSection({ caseId, type })
                }
                onOpenImage={(caseId, type, imageId) =>
                  setEditorSection({ caseId, type, initialImageId: imageId })
                }
                onToggleCheck={toggleCheck}
                onToggleMain={handleToggleMain}
                onDelete={(id) => setDeleting(id)}
                onTitleChange={handleTitleChange}
                onRegister={handleRegister}
                onBulkUpload={handleBulkUpload}
                onBulkDeleteAll={handleBulkDeleteAll}
                onDeleteSelected={handleDeleteSelected}
                onToggleSelectionMode={toggleSelectionMode}
                onCancelSelectionMode={cancelSelectionMode}
                onAssignSlot={handleAssignSlot}
                collapsed={collapsedCases.has(item.id)}
                onToggleCollapse={() => toggleCollapse(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {loading && cases.length === 0 && (
        <div className="py-20 text-center text-[#999] text-[14px]">
          로딩 중...
        </div>
      )}

      {!loading && cases.length === 0 && (
        <div className="bg-white border border-[#111] rounded-2xl py-20 text-center">
          <div className="w-16 h-16 bg-[#F7F7F7] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#CCC]">
            <ImageOff size={28} />
          </div>
          <p className="text-[15px] font-medium text-[#999]">
            등록된 박스가 없습니다
          </p>
          <p className="mt-1 text-[13px] text-[#CCC]">
            새 박스를 추가하고 Before/After 사진을 업로드해 주세요
          </p>
        </div>
      )}

      {deleting !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setDeleting(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remodeling-delete-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="px-6 py-8 text-center">
              <h3
                id="remodeling-delete-title"
                className="text-[17px] font-bold text-[#111]"
              >
                삭제하시겠습니까?
              </h3>
            </div>
            <div className="px-6 py-4 border-t border-[#111] flex gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="flex-1 py-2.5 rounded-xl text-[14px] text-[#666] hover:bg-[#F7F7F7] transition-all"
              >
                취소
              </button>
              <button
                type="button"
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
          initialImageId={editorSection.initialImageId ?? editorImages[0].id}
          sectionLabel={`${editorSection.type === "before" ? "BEFORE" : "AFTER"} ( ${editorImages.length}장 )`}
          onApplyOne={async (id, blob) => {
            try {
              const url = await uploadFile(blob);
              await saveImage({ id, image_url_wm: url });
              load();
              flash("변경사항이 적용되었습니다");
            } catch (error) {
              flash(`적용 실패: ${errMsg(error)}`);
            }
          }}
          onApplyAll={async (ids, getBlob) => {
            flash(`${ids.length}장 처리 중..`);
            let success = 0;
            let failMsg = "";
            const concurrency = 3;
            const queue = [...ids];
            const workers = Array.from({ length: concurrency }, async () => {
              while (queue.length > 0) {
                const id = queue.shift();
                if (id === undefined) break;
                try {
                  const blob = await getBlob(id);
                  if (!blob) {
                    if (!failMsg)
                      failMsg = "이미지 합성 실패 (CORS 차단 가능성)";
                    continue;
                  }
                  const url = await uploadFile(blob);
                  await saveImage({ id, image_url_wm: url });
                  success += 1;
                } catch (error) {
                  if (!failMsg) failMsg = errMsg(error);
                }
              }
            });
            await Promise.all(workers);
            load();
            if (success === ids.length) {
              flash(`${success}장 전체 적용이 완료되었습니다`);
            } else {
              flash(
                `${success}/${ids.length}장 적용됨${failMsg ? ` (실패: ${failMsg})` : ""}`,
              );
            }
          }}
          onError={(msg) => flash(msg)}
          onReorder={(oldIndex, newIndex) =>
            handleReorderImages(
              editorSection.caseId,
              editorSection.type,
              oldIndex,
              newIndex,
            )
          }
          onCancel={() => setEditorSection(null)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
