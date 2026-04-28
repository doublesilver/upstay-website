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
import { parseStyle, styleToCss, type TextStyle } from "@/lib/text-style";
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

function insertBulletInto(
  el: HTMLInputElement | HTMLTextAreaElement,
  apply: (newValue: string) => void,
) {
  const s = el.selectionStart ?? el.value.length;
  const e = el.selectionEnd ?? el.value.length;
  const value = el.value;
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
  apply(newValue);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(s + 2, e + added);
  });
}

type ToolbarButtonProps = {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
};

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`w-8 h-8 rounded-lg text-[13px] border transition-colors flex items-center justify-center ${
        active
          ? "bg-[#111] text-white border-[#111]"
          : "bg-white text-[#666] border-[#DDD] hover:border-[#111]"
      } disabled:opacity-30 disabled:hover:border-[#DDD]`}
    >
      {children}
    </button>
  );
}

export default function ConfigPage() {
  const [config, setConfig] = useState<Config>({ ...DEFAULT_CONFIG });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const sloganRef = useRef<HTMLInputElement | null>(null);
  const photoGuideTitleRef = useRef<HTMLInputElement | null>(null);
  const photoGuideCaptionRef = useRef<HTMLInputElement | null>(null);

  const [sloganActive, setSloganActive] = useState(false);
  const [photoGuideField, setPhotoGuideField] = useState<
    "title" | "caption" | null
  >(null);

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

  const toggleBoldFor = (key: keyof Config) => {
    const cur = getStyle(key);
    setStyle(key)({
      ...cur,
      fontWeight: cur.fontWeight === "bold" ? undefined : "bold",
    });
  };

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

  const sloganBold = getStyle("slogan_text_style").fontWeight === "bold";
  const photoGuideTitleBold =
    getStyle("photo_guide_style").fontWeight === "bold";
  const photoGuideCaptionBold =
    getStyle("photo_guide_caption_style").fontWeight === "bold";
  const photoGuideBoldActive =
    photoGuideField === "title"
      ? photoGuideTitleBold
      : photoGuideField === "caption"
        ? photoGuideCaptionBold
        : false;
  const handlePhotoGuideBold = () => {
    if (photoGuideField === "title") toggleBoldFor("photo_guide_style");
    else if (photoGuideField === "caption")
      toggleBoldFor("photo_guide_caption_style");
  };
  const handlePhotoGuideBullet = () => {
    if (photoGuideField === "title" && photoGuideTitleRef.current) {
      insertBulletInto(
        photoGuideTitleRef.current,
        setText("photo_guide_title"),
      );
    } else if (photoGuideField === "caption" && photoGuideCaptionRef.current) {
      insertBulletInto(
        photoGuideCaptionRef.current,
        setText("photo_guide_caption"),
      );
    }
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
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[16px] font-bold text-[#111] flex-1">• 헤더</h2>
            <div className="flex items-center gap-1">
              <ToolbarButton
                active={sloganActive && sloganBold}
                disabled={!sloganActive}
                onClick={() => toggleBoldFor("slogan_text_style")}
                title="굵게"
              >
                <span className="font-bold">B</span>
              </ToolbarButton>
              <ToolbarButton
                active={false}
                disabled={!sloganActive}
                onClick={() => {
                  if (sloganRef.current)
                    insertBulletInto(sloganRef.current, setText("slogan_text"));
                }}
                title="글머리기호"
              >
                •
              </ToolbarButton>
            </div>
          </div>
          <input
            ref={sloganRef}
            type="text"
            value={config.slogan_text}
            onChange={set("slogan_text")}
            onFocus={() => setSloganActive(true)}
            onBlur={() => setSloganActive(false)}
            aria-label="헤더 슬로건"
            placeholder="헤더 슬로건"
            className={inputCls}
            style={styleToCss(getStyle("slogan_text_style"))}
          />
        </section>

        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[16px] font-bold text-[#111] flex-1">
              • 사진안내 카테고리
            </h2>
            <div className="flex items-center gap-1">
              <ToolbarButton
                active={photoGuideBoldActive}
                disabled={photoGuideField === null}
                onClick={handlePhotoGuideBold}
                title="굵게"
              >
                <span className="font-bold">B</span>
              </ToolbarButton>
              <ToolbarButton
                active={false}
                disabled={photoGuideField === null}
                onClick={handlePhotoGuideBullet}
                title="글머리기호"
              >
                •
              </ToolbarButton>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <input
                ref={photoGuideTitleRef}
                type="text"
                value={config.photo_guide_title}
                onChange={set("photo_guide_title")}
                onFocus={() => setPhotoGuideField("title")}
                onBlur={() => setPhotoGuideField(null)}
                aria-label="사진안내 제목"
                className={inputCls}
                style={styleToCss(getStyle("photo_guide_style"))}
              />
            </div>
            <div>
              <input
                ref={photoGuideCaptionRef}
                type="text"
                value={config.photo_guide_caption}
                onChange={set("photo_guide_caption")}
                onFocus={() => setPhotoGuideField("caption")}
                onBlur={() => setPhotoGuideField(null)}
                aria-label="사진안내 보조문구"
                className={inputCls}
                style={styleToCss(getStyle("photo_guide_caption_style"))}
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
                  captionStyle={getStyle(`${key}_caption_style`)}
                  onTitleBold={() => toggleBoldFor(`${key}_title_style`)}
                  onDescBold={() => toggleBoldFor(`${key}_desc_style`)}
                  onCaptionBold={() => toggleBoldFor(`${key}_caption_style`)}
                  onTitleChange={set(`${key}_title`)}
                  onDescChange={set(`${key}_desc`)}
                  onCaptionChange={set(`${key}_caption`)}
                  onTitleTextChange={setText(`${key}_title`)}
                  onDescTextChange={setText(`${key}_desc`)}
                  onCaptionTextChange={setText(`${key}_caption`)}
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
  captionStyle: TextStyle;
  onTitleBold: () => void;
  onDescBold: () => void;
  onCaptionBold: () => void;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCaptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTitleTextChange: (newValue: string) => void;
  onDescTextChange: (newValue: string) => void;
  onCaptionTextChange: (newValue: string) => void;
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
  captionStyle,
  onTitleBold,
  onDescBold,
  onCaptionBold,
  onTitleChange,
  onDescChange,
  onCaptionChange,
  onTitleTextChange,
  onDescTextChange,
  onCaptionTextChange,
  dragHandle,
}: ConfigSectionProps) {
  const titleRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const captionRef = useRef<HTMLInputElement | null>(null);
  const [activeField, setActiveField] = useState<
    "title" | "desc" | "caption" | null
  >(null);

  const isBold =
    activeField === "title"
      ? titleStyle.fontWeight === "bold"
      : activeField === "desc"
        ? descStyle.fontWeight === "bold"
        : activeField === "caption"
          ? captionStyle.fontWeight === "bold"
          : false;

  const handleBold = () => {
    if (activeField === "title") onTitleBold();
    else if (activeField === "desc") onDescBold();
    else if (activeField === "caption") onCaptionBold();
  };

  const handleBullet = () => {
    if (activeField === "title" && titleRef.current) {
      insertBulletInto(titleRef.current, onTitleTextChange);
    } else if (activeField === "desc" && descRef.current) {
      insertBulletInto(descRef.current, onDescTextChange);
    } else if (activeField === "caption" && captionRef.current) {
      insertBulletInto(captionRef.current, onCaptionTextChange);
    }
  };

  return (
    <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        {dragHandle}
        <h2 className="text-[16px] font-bold text-[#111] flex-1">• {title}</h2>
        <div className="flex items-center gap-1">
          <ToolbarButton
            active={isBold}
            disabled={activeField === null}
            onClick={handleBold}
            title="굵게"
          >
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton
            active={false}
            disabled={activeField === null}
            onClick={handleBullet}
            title="글머리기호"
          >
            •
          </ToolbarButton>
        </div>
        <VisibilityToggle visible={visible} onToggle={onToggle} />
      </div>
      <div
        className={`space-y-5 transition-opacity ${visible ? "" : "opacity-50"}`}
      >
        <div>
          <input
            ref={titleRef}
            type="text"
            value={titleValue}
            onChange={onTitleChange}
            onFocus={() => setActiveField("title")}
            onBlur={() => setActiveField(null)}
            className={`${inputCls}`}
            style={styleToCss(titleStyle)}
          />
        </div>
        <div>
          <textarea
            ref={descRef}
            value={descValue}
            onChange={onDescChange}
            onFocus={() => setActiveField("desc")}
            onBlur={() => setActiveField(null)}
            rows={3}
            className={`${inputCls}`}
            style={styleToCss(descStyle)}
          />
        </div>
        <div>
          <input
            ref={captionRef}
            type="text"
            value={captionValue}
            onChange={onCaptionChange}
            onFocus={() => setActiveField("caption")}
            onBlur={() => setActiveField(null)}
            className={inputCls}
            style={styleToCss(captionStyle)}
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
