"use client";

import { useEffect, useRef, useState } from "react";
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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Toast } from "@/components/admin/toast";
import {
  StyleToolbar,
  parseStyle,
  type TextStyle,
} from "@/components/admin/style-toolbar";
import { styleToCss } from "@/lib/text-style";
import { apiFetch, getHeaders } from "@/lib/admin-api";
import { DEFAULT_CONFIG, type ConfigRecord } from "@/lib/config-schema";

type Config = ConfigRecord;

const inputCls =
  "w-full border border-[#DDD] rounded-xl px-4 py-3 text-[14px] outline-none transition-all focus:border-[#111] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]";

const DEFAULT_CATEGORY_ORDER = [
  "service_remodeling",
  "service_building",
  "service_rental",
  "service_category4",
  "service_category5",
];

const CATEGORY_LABELS: Record<string, string> = {
  service_remodeling: "안내 카테고리 ( 1 )",
  service_building: "안내 카테고리 ( 2 )",
  service_rental: "안내 카테고리 ( 3 )",
  service_category4: "안내 카테고리 ( 4 )",
  service_category5: "안내 카테고리 ( 5 )",
};

export default function ConfigPage() {
  const [config, setConfig] = useState<Config>({ ...DEFAULT_CONFIG });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const sloganRef = useRef<HTMLInputElement | null>(null);
  const photoGuideTitleRef = useRef<HTMLInputElement | null>(null);

  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    apiFetch("/api/admin/config", {
      headers: getHeaders(),
    })
      .then((r) => r.json())
      .then((data) => setConfig((prev) => ({ ...prev, ...data })))
      .catch(() => setToast("불러오기에 실패했습니다"))
      .finally(() => setLoading(false));
  }, []);

  const set =
    (key: keyof Config) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setConfig((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const setText = (key: keyof Config) => (newValue: string) => {
    setConfig((prev) => ({ ...prev, [key]: newValue }));
  };

  const setStyle = (key: keyof Config) => (style: TextStyle) => {
    setConfig((prev) => ({ ...prev, [key]: JSON.stringify(style) }));
  };

  const getStyle = (key: keyof Config): TextStyle =>
    parseStyle(config[key] || "{}");

  const toggleVisible = (key: keyof Config) => {
    setConfig((prev) => ({
      ...prev,
      [key]: prev[key] === "0" ? "1" : "0",
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/config", {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(config),
      });
      setToast(res.ok ? "저장되었습니다" : "저장에 실패했습니다");
    } catch {
      setToast("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const categoryOrder = (() => {
    try {
      const parsed = JSON.parse(config.service_categories_order || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
    } catch {}
    return DEFAULT_CATEGORY_ORDER;
  })();

  const categoryItems = categoryOrder.filter((k) =>
    DEFAULT_CATEGORY_ORDER.includes(k),
  );

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categoryItems.indexOf(active.id as string);
    const newIndex = categoryItems.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(categoryItems, oldIndex, newIndex);
    setConfig((prev) => ({
      ...prev,
      service_categories_order: JSON.stringify(reordered),
    }));
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[26px] font-bold text-[#111] tracking-tight">
            메인창
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#111] text-white rounded-xl px-6 py-3 text-[14px] font-semibold hover:bg-[#333] active:scale-[0.98] disabled:opacity-40 transition-all shrink-0"
        >
          {saving ? "저장 중.." : "저장"}
        </button>
      </div>

      {loading && (
        <div className="py-20 text-center text-[#999] text-[14px]">
          로딩 중...
        </div>
      )}

      <div className={`space-y-10 ${loading ? "hidden" : ""}`}>
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-[16px] font-bold text-[#111]">
              사진안내 카테고리
            </h2>
            <VisibilityToggle
              visible={config.photo_guide_visible !== "0"}
              onToggle={() => toggleVisible("photo_guide_visible")}
            />
          </div>
          <div
            className={`space-y-5 transition-opacity ${
              config.photo_guide_visible === "0" ? "opacity-50" : ""
            }`}
          >
            <div>
              <StyleToolbar
                value={getStyle("photo_guide_style")}
                onChange={setStyle("photo_guide_style")}
                inputRef={photoGuideTitleRef}
                onTextChange={setText("photo_guide_title")}
              />
              <input
                ref={photoGuideTitleRef}
                type="text"
                value={config.photo_guide_title}
                onChange={set("photo_guide_title")}
                aria-label="사진안내 제목"
                className={inputCls}
                style={styleToCss(getStyle("photo_guide_style"))}
              />
            </div>
            <div>
              <input
                type="text"
                value={config.photo_guide_caption}
                onChange={set("photo_guide_caption")}
                aria-label="사진안내 보조문구"
                className={inputCls}
              />
            </div>
          </div>
        </section>

        <DndContext
          sensors={categorySensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext
            items={categoryItems}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-10">
              {categoryItems.map((key) => (
                <SortableConfigSection
                  key={key}
                  categoryKey={key}
                  title={CATEGORY_LABELS[key] ?? key}
                  visible={config[`${key}_visible`] !== "0"}
                  onToggle={() => toggleVisible(`${key}_visible`)}
                  titleValue={config[`${key}_title`] ?? ""}
                  descValue={config[`${key}_desc`] ?? ""}
                  captionValue={config[`${key}_caption`] ?? ""}
                  titleStyle={getStyle(`${key}_title_style`)}
                  descStyle={getStyle(`${key}_desc_style`)}
                  onTitleStyleChange={setStyle(`${key}_title_style`)}
                  onDescStyleChange={setStyle(`${key}_desc_style`)}
                  onTitleChange={set(`${key}_title`)}
                  onDescChange={set(`${key}_desc`)}
                  onCaptionChange={set(`${key}_caption`)}
                  onTitleTextChange={setText(`${key}_title`)}
                  onDescTextChange={setText(`${key}_desc`)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}

type ConfigSectionProps = {
  title: string;
  visible: boolean;
  onToggle: () => void;
  titleValue: string;
  descValue: string;
  captionValue: string;
  titleStyle: TextStyle;
  descStyle: TextStyle;
  onTitleStyleChange: (style: TextStyle) => void;
  onDescStyleChange: (style: TextStyle) => void;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCaptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTitleTextChange: (newValue: string) => void;
  onDescTextChange: (newValue: string) => void;
  dragHandle?: React.ReactNode;
};

function SortableConfigSection({
  categoryKey,
  ...sectionProps
}: { categoryKey: string } & ConfigSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoryKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing text-[#999] hover:text-[#111] transition-colors shrink-0 p-1 -ml-1"
      title="드래그하여 순서를 변경합니다"
    >
      <GripVertical size={18} />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      <ConfigSection dragHandle={handle} {...sectionProps} />
    </div>
  );
}

function ConfigSection({
  title,
  visible,
  onToggle,
  titleValue,
  descValue,
  captionValue,
  titleStyle,
  descStyle,
  onTitleStyleChange,
  onDescStyleChange,
  onTitleChange,
  onDescChange,
  onCaptionChange,
  onTitleTextChange,
  onDescTextChange,
  dragHandle,
}: ConfigSectionProps) {
  const titleRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        {dragHandle}
        <h2 className="text-[16px] font-bold text-[#111] flex-1">{title}</h2>
        <VisibilityToggle visible={visible} onToggle={onToggle} />
      </div>
      <div
        className={`space-y-5 transition-opacity ${visible ? "" : "opacity-50"}`}
      >
        <div>
          <StyleToolbar
            value={titleStyle}
            onChange={onTitleStyleChange}
            inputRef={titleRef}
            onTextChange={onTitleTextChange}
          />
          <input
            ref={titleRef}
            type="text"
            value={titleValue}
            onChange={onTitleChange}
            className={`${inputCls}`}
            style={styleToCss(titleStyle)}
          />
        </div>
        <div>
          <StyleToolbar
            value={descStyle}
            onChange={onDescStyleChange}
            inputRef={descRef}
            onTextChange={onDescTextChange}
          />
          <textarea
            ref={descRef}
            value={descValue}
            onChange={onDescChange}
            rows={3}
            className={`${inputCls}`}
            style={styleToCss(descStyle)}
          />
        </div>
        <div>
          <input
            type="text"
            value={captionValue}
            onChange={onCaptionChange}
            className={inputCls}
          />
        </div>
      </div>
    </section>
  );
}

function VisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-medium transition-all ${
        visible
          ? "border-[#111] bg-[#111] text-white"
          : "border-[#DDD] bg-white text-[#666]"
      }`}
    >
      <span
        className={`relative block h-4 w-7 rounded-full transition-colors ${
          visible ? "bg-white/30" : "bg-[#DDD]"
        }`}
      >
        <span
          className={`absolute top-[2px] left-[2px] h-3 w-3 rounded-full bg-white transition-transform ${
            visible ? "translate-x-3" : ""
          }`}
        />
      </span>
      {visible ? "노출" : "미노출"}
    </button>
  );
}
