"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
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
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

export interface EditableImage {
  id: number;
  image_url: string;
  image_url_wm?: string;
  slot_position?: number;
}

export type WmAnchor = "tl" | "t" | "tr" | "l" | "c" | "r" | "bl" | "b" | "br";

export interface EditSettings {
  sharpness: number;
  brightness: number;
  wmOpacity: number;
  wmScale: number;
  wmPos: { x: number; y: number };
  wmAnchor: WmAnchor;
}

interface Props {
  images: EditableImage[];
  initialImageId: number;
  sectionLabel: string;
  onApplyOne: (imageId: number, blob: Blob) => Promise<void> | void;
  onApplyAll: (
    imageIds: number[],
    getBlob: (imageId: number) => Promise<Blob | null>,
  ) => Promise<void> | void;
  onCancel: () => void;
  onError?: (message: string) => void;
  onReorder?: (oldIndex: number, newIndex: number) => void;
}

function SortableThumb({
  image,
  active,
  onClick,
  filter,
}: {
  image: EditableImage;
  active: boolean;
  onClick: () => void;
  filter: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `edit-${image.id}` });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, 0px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      {...attributes}
      {...listeners}
      className={`w-16 h-16 rounded-md overflow-hidden border-2 shrink-0 transition-all cursor-grab active:cursor-grabbing touch-none ${
        active ? "border-[#111]" : "border-transparent hover:border-[#DDD]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.image_url}
        alt=""
        draggable={false}
        style={{ filter }}
        className="w-full h-full object-cover pointer-events-none select-none"
      />
    </div>
  );
}

const DEFAULT_SETTINGS: EditSettings = {
  sharpness: 100,
  brightness: 100,
  wmOpacity: 50,
  wmScale: 30,
  wmPos: { x: 0.4, y: 0.4 },
  wmAnchor: "c",
};

const ANCHOR_INSET = 0.01;

const POS_GRID: { label: string; anchor: WmAnchor }[] = [
  { label: "↖", anchor: "tl" },
  { label: "↑", anchor: "t" },
  { label: "↗", anchor: "tr" },
  { label: "←", anchor: "l" },
  { label: "•", anchor: "c" },
  { label: "→", anchor: "r" },
  { label: "↙", anchor: "bl" },
  { label: "↓", anchor: "b" },
  { label: "↘", anchor: "br" },
];

function posFromAnchor(
  anchor: WmAnchor,
  wmScale: number,
  logoAspect: number,
  imageAspect: number,
): { x: number; y: number } {
  const wmW = wmScale / 100;
  const wmH = (wmScale / 100) * logoAspect * imageAspect;
  const inset = ANCHOR_INSET;
  const left = inset;
  const right = Math.max(inset, 1 - wmW - inset);
  const cx = (1 - wmW) / 2;
  const top = inset;
  const bottom = Math.max(inset, 1 - wmH - inset);
  const cy = Math.max(0, (1 - wmH) / 2);
  switch (anchor) {
    case "tl":
      return { x: left, y: top };
    case "t":
      return { x: cx, y: top };
    case "tr":
      return { x: right, y: top };
    case "l":
      return { x: left, y: cy };
    case "c":
      return { x: cx, y: cy };
    case "r":
      return { x: right, y: cy };
    case "bl":
      return { x: left, y: bottom };
    case "b":
      return { x: cx, y: bottom };
    case "br":
      return { x: right, y: bottom };
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function clampWmPos(
  pos: { x: number; y: number },
  wmScale: number,
  logoAspect: number,
  imageAspect = 1,
): { x: number; y: number } {
  const wmW = wmScale / 100;
  const wmH = (wmScale / 100) * logoAspect * imageAspect;
  return {
    x: Math.max(0, Math.min(1 - wmW, pos.x)),
    y: Math.max(0, Math.min(Math.max(0, 1 - wmH), pos.y)),
  };
}

function maxAllowedScale(logoAspect: number, imageAspect: number): number {
  if (logoAspect <= 0 || imageAspect <= 0) return 100;
  return Math.max(
    10,
    Math.min(100, Math.floor(100 / (logoAspect * imageAspect))),
  );
}

function getImageAspect(el: HTMLElement | null): number {
  if (!el) return 1;
  const w = el.clientWidth;
  const h = el.clientHeight;
  return h > 0 ? w / h : 1;
}

async function renderToBlob(
  imageSrc: string,
  logoImg: HTMLImageElement | null,
  settings: EditSettings,
): Promise<Blob | null> {
  const base = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = base.width;
  canvas.height = base.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.sharpness}%)`;
  ctx.drawImage(base, 0, 0);
  ctx.filter = "none";

  if (logoImg && settings.wmOpacity > 0) {
    const logoW = Math.min(base.width * (settings.wmScale / 100), base.width);
    const logoH = Math.min(
      (logoImg.height / logoImg.width) * logoW,
      base.height,
    );
    const x = Math.max(
      0,
      Math.min(base.width - logoW, settings.wmPos.x * base.width),
    );
    const y = Math.max(
      0,
      Math.min(base.height - logoH, settings.wmPos.y * base.height),
    );

    ctx.save();
    ctx.globalAlpha = settings.wmOpacity / 100;
    ctx.drawImage(logoImg, x, y, logoW, logoH);
    ctx.restore();
  }

  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92),
  );
}

function imageSettingsKey(imageId: number) {
  return `upstay-edit-img-${imageId}`;
}

function loadSettingsForImage(imageId: number): EditSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(imageSettingsKey(imageId));
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<EditSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function ImageEditModal({
  images,
  initialImageId,
  sectionLabel,
  onApplyOne,
  onApplyAll,
  onCancel,
  onError,
  onReorder,
}: Props) {
  const dndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;
    const oldIndex = images.findIndex((img) => `edit-${img.id}` === active.id);
    const newIndex = images.findIndex((img) => `edit-${img.id}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(oldIndex, newIndex);
  };
  const [currentId, setCurrentId] = useState(initialImageId);
  const [settings, setSettings] = useState<EditSettings>(() =>
    loadSettingsForImage(initialImageId),
  );
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [saving, setSaving] = useState<"one" | "all" | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const current = useMemo(
    () => images.find((image) => image.id === currentId) ?? images[0],
    [images, currentId],
  );

  useEffect(() => {
    setCurrentId(initialImageId);
  }, [initialImageId]);

  const posCalibratedRef = useRef(false);

  useEffect(() => {
    setSettings(loadSettingsForImage(currentId));
    posCalibratedRef.current = false;
  }, [currentId]);

  useEffect(() => {
    loadImage("/watermark.png")
      .then(setLogoImg)
      .catch(() => setLogoImg(null));
  }, []);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    if (posCalibratedRef.current) return;
    if (!logoImg || !previewRef.current) return;
    if (settings.wmAnchor !== "c") return;
    if (
      settings.wmPos.x !== DEFAULT_SETTINGS.wmPos.x ||
      settings.wmPos.y !== DEFAULT_SETTINGS.wmPos.y
    ) {
      posCalibratedRef.current = true;
      return;
    }
    const aspect = logoImg.height / logoImg.width;
    const imageAspect = getImageAspect(previewRef.current);
    if (imageAspect <= 0) return;
    const newPos = posFromAnchor("c", settings.wmScale, aspect, imageAspect);
    setSettings((prev) =>
      prev.wmAnchor === "c"
        ? {
            ...prev,
            wmPos: clampWmPos(newPos, prev.wmScale, aspect, imageAspect),
          }
        : prev,
    );
    posCalibratedRef.current = true;
  }, [logoImg, settings.wmAnchor, settings.wmScale, settings.wmPos]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
    posCalibratedRef.current = false;
    if (current) {
      try {
        localStorage.removeItem(imageSettingsKey(current.id));
      } catch {}
    }
  };

  const onWmPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const previewEl = previewRef.current;
    if (!previewEl) return;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startWmX = settings.wmPos.x;
    const startWmY = settings.wmPos.y;
    const previewW = previewEl.clientWidth;
    const previewH = previewEl.clientHeight;
    const aspect = logoImg ? logoImg.height / logoImg.width : 1;
    const imageAspect = previewH > 0 ? previewW / previewH : 1;

    setIsDragging(true);

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startClientX;
      const dy = ev.clientY - startClientY;
      setSettings((prev) => ({
        ...prev,
        wmAnchor: "c",
        wmPos: clampWmPos(
          { x: startWmX + dx / previewW, y: startWmY + dy / previewH },
          prev.wmScale,
          aspect,
          imageAspect,
        ),
      }));
    };

    const up = () => {
      setIsDragging(false);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
    };

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  };

  const persistSettingsForImage = (imageId: number, s: EditSettings) => {
    try {
      localStorage.setItem(imageSettingsKey(imageId), JSON.stringify(s));
    } catch {}
  };

  const ensureLogo = async (): Promise<HTMLImageElement | null> => {
    if (logoImg) return logoImg;
    try {
      const img = await loadImage("/watermark.png");
      setLogoImg(img);
      return img;
    } catch {
      return null;
    }
  };

  const applyOne = async () => {
    if (!current) return;
    setSaving("one");
    const logo = settings.wmOpacity > 0 ? await ensureLogo() : logoImg;
    const blob = await renderToBlob(current.image_url, logo, settings);
    if (blob === null) {
      const msg =
        "워터마크 합성 실패: 이미지 로드 차단(CORS)일 수 있습니다. 새로고침 후 다시 시도해주세요.";
      if (onError) onError(msg);
      else alert(msg);
      setSaving(null);
      return;
    }
    await onApplyOne(current.id, blob);
    persistSettingsForImage(current.id, settings);
    setSaving(null);
  };

  const applyAll = async () => {
    setSaving("all");
    const logo = settings.wmOpacity > 0 ? await ensureLogo() : logoImg;
    const ids = images.map((image) => image.id);
    await onApplyAll(ids, async (id) => {
      const image = images.find((item) => item.id === id);
      if (!image) return null;
      const blob = await renderToBlob(image.image_url, logo, settings);
      if (blob === null) {
        console.warn(`이미지 합성 실패 (id=${id}): CORS 차단 가능성`);
      }
      return blob;
    });
    ids.forEach((id) => persistSettingsForImage(id, settings));
    setSaving(null);
  };

  const imageFilter = `brightness(${settings.brightness}%) contrast(${settings.sharpness}%)`;
  const logoW =
    previewRef.current && logoImg
      ? previewRef.current.clientWidth * (settings.wmScale / 100)
      : 0;
  const logoH = logoImg && logoW ? (logoImg.height / logoImg.width) * logoW : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-edit-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-[1100px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-3 border-b border-black">
          <h3
            id="image-edit-title"
            className="text-[16px] font-bold text-[#111]"
          >
            사진 편집
            <span className="text-[12px] font-medium text-[#999] ml-1">
              {sectionLabel}
            </span>
          </h3>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onCancel}
            className="bg-white border border-[#111] rounded-lg px-4 py-1.5 text-[14px] font-medium text-[#666] hover:bg-[#FAFAFA] hover:text-[#111] transition-colors"
          >
            닫기
          </button>
        </div>

        <div className="flex-1 min-h-0 flex">
          <div className="flex-1 min-w-0 flex flex-col bg-[#FAFAFA]">
            <div className="flex-1 min-h-0 flex items-center justify-center p-4">
              <div ref={previewRef} className="relative max-w-full max-h-full">
                {current && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={current.image_url}
                      alt=""
                      className="max-h-[58vh] max-w-full object-contain block"
                      style={{ filter: imageFilter }}
                    />
                    {logoImg && settings.wmOpacity > 0 && logoW > 0 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/watermark.png"
                        alt=""
                        className="absolute select-none"
                        onPointerDown={onWmPointerDown}
                        style={{
                          width: `${logoW}px`,
                          height: `${logoH}px`,
                          left: `${settings.wmPos.x * 100}%`,
                          top: `${settings.wmPos.y * 100}%`,
                          opacity: settings.wmOpacity / 100,
                          cursor: isDragging ? "grabbing" : "grab",
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-[#111] px-3 h-[80px] flex items-center bg-white">
              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={images.map((image) => `edit-${image.id}`)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex gap-1.5 overflow-x-auto w-full">
                    {images.map((image) => (
                      <SortableThumb
                        key={image.id}
                        image={image}
                        active={image.id === currentId}
                        onClick={() => setCurrentId(image.id)}
                        filter={imageFilter}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>

          <div className="w-[280px] shrink-0 border-l border-[#111] flex flex-col">
            <div className="flex-1 overflow-hidden p-3 space-y-2">
              <div className="border border-[#111] rounded-xl p-3">
                <p className="text-[11px] font-bold tracking-wider text-[#777] mb-2">
                  사진 보정
                </p>
                <div className="h-px bg-[#E5E5E5] mb-2" />
                <Slider
                  label="선명도"
                  value={settings.sharpness}
                  min={0}
                  max={200}
                  onChange={(value) =>
                    setSettings((prev) => ({ ...prev, sharpness: value }))
                  }
                  unit=""
                />
                <Slider
                  label="밝기"
                  value={settings.brightness}
                  min={0}
                  max={200}
                  onChange={(value) =>
                    setSettings((prev) => ({ ...prev, brightness: value }))
                  }
                  unit=""
                />
              </div>

              <div className="border border-[#111] rounded-xl p-3">
                <p className="text-[11px] font-bold tracking-wider text-[#777] mb-2">
                  워터마크 설정
                </p>
                <div className="h-px bg-[#E5E5E5] mb-2" />
                <Slider
                  label="투명도"
                  value={settings.wmOpacity}
                  min={0}
                  max={200}
                  onChange={(value) =>
                    setSettings((prev) => ({ ...prev, wmOpacity: value }))
                  }
                  unit="%"
                />
                <Slider
                  label="크기"
                  value={settings.wmScale}
                  min={0}
                  max={200}
                  onChange={(value) =>
                    setSettings((prev) => {
                      const aspect = logoImg
                        ? logoImg.height / logoImg.width
                        : 1;
                      const imageAspect = getImageAspect(previewRef.current);
                      const maxScale = maxAllowedScale(aspect, imageAspect);
                      const clampedScale = Math.min(value, maxScale);
                      const newPos = posFromAnchor(
                        prev.wmAnchor,
                        clampedScale,
                        aspect,
                        imageAspect,
                      );
                      return {
                        ...prev,
                        wmScale: clampedScale,
                        wmPos: clampWmPos(
                          newPos,
                          clampedScale,
                          aspect,
                          imageAspect,
                        ),
                      };
                    })
                  }
                  unit="%"
                />
                <div className="mt-2 border border-[#111] rounded-xl p-3">
                  <label className="block text-[12px] text-[#333] mb-1.5">
                    위치
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {POS_GRID.map((item) => {
                      const active = settings.wmAnchor === item.anchor;

                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() =>
                            setSettings((prev) => {
                              const aspect = logoImg
                                ? logoImg.height / logoImg.width
                                : 1;
                              const imageAspect = getImageAspect(
                                previewRef.current,
                              );
                              return {
                                ...prev,
                                wmAnchor: item.anchor,
                                wmPos: clampWmPos(
                                  posFromAnchor(
                                    item.anchor,
                                    prev.wmScale,
                                    aspect,
                                    imageAspect,
                                  ),
                                  prev.wmScale,
                                  aspect,
                                  imageAspect,
                                ),
                              };
                            })
                          }
                          className={`aspect-square rounded-lg text-[14px] transition-all ${
                            active
                              ? "bg-[#111] text-white"
                              : "bg-[#F7F7F7] text-[#666] hover:bg-[#EBEBEB]"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-black px-4 h-[80px] flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center gap-1 min-w-[72px] border border-[#111] rounded-lg px-3 py-2 text-[12px] text-[#666] hover:bg-[#F7F7F7] transition-all"
              >
                <RotateCcw size={12} />
                초기화
              </button>
              <button
                type="button"
                onClick={applyOne}
                disabled={saving !== null}
                className="min-w-[72px] border border-[#111] rounded-lg px-4 py-2 text-[12px] text-[#333] hover:bg-[#F7F7F7] disabled:opacity-40 transition-all"
              >
                {saving === "one" ? "적용 중.." : "적용"}
              </button>
              <button
                type="button"
                onClick={applyAll}
                disabled={saving !== null || images.length === 0}
                className="min-w-[72px] bg-[#111] text-white rounded-lg px-4 py-2 text-[12px] font-semibold hover:bg-[#333] disabled:opacity-40 transition-all"
              >
                {saving === "all" ? "적용 중.." : "전체 적용"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  unit: string;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-[#333]">{label}</span>
        <span className="text-[11px] text-[#777] bg-[#F7F7F7] rounded-md px-2 py-0.5">
          {value}
          {unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="text-[12px] text-[#666] w-3 text-center leading-none"
        >
          -
        </button>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-[#111]"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="text-[12px] text-[#666] w-3 text-center leading-none"
        >
          +
        </button>
      </div>
    </div>
  );
}
